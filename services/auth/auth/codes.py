import secrets
import time

import bcrypt

from auth.db import db_session


class CodeError(Exception):
    """Base for all magic-code errors."""


class CodeNotFound(CodeError):
    """No matching unverified code for this email (or wrong code)."""


class CodeExpired(CodeError):
    """Code older than TTL."""


class CodeUsed(CodeError):
    """Code already verified before."""


class CodeMaxAttempts(CodeError):
    """Too many wrong attempts."""


def generate_code() -> str:
    """6-digit zero-padded numeric code."""
    return f"{secrets.randbelow(1_000_000):06d}"


def _hash(code: str) -> str:
    return bcrypt.hashpw(code.encode(), bcrypt.gensalt(rounds=10)).decode()


def _matches(code: str, hashed: str) -> bool:
    return bcrypt.checkpw(code.encode(), hashed.encode())


def store_code(db_path: str, email: str, code: str) -> None:
    with db_session(db_path) as conn:
        conn.execute(
            "INSERT INTO magic_codes (email, code_hash, created_at) VALUES (?, ?, ?)",
            (email.lower().strip(), _hash(code), int(time.time())),
        )


def verify_code(
    db_path: str,
    email: str,
    code: str,
    ttl_minutes: int,
    max_attempts: int,
) -> bool:
    email_norm = email.lower().strip()
    now = int(time.time())
    cutoff = now - ttl_minutes * 60
    with db_session(db_path) as conn:
        cur = conn.execute(
            "SELECT id, code_hash, created_at, attempts, used "
            "FROM magic_codes WHERE email = ? "
            "ORDER BY created_at DESC LIMIT 1",
            (email_norm,),
        )
        row = cur.fetchone()
        if row is None:
            raise CodeNotFound("no code for email")
        cid = row["id"]
        if row["used"]:
            raise CodeUsed("code already used")
        if row["created_at"] < cutoff:
            raise CodeExpired("code expired")
        if row["attempts"] >= max_attempts:
            raise CodeMaxAttempts("max attempts reached")
        if not _matches(code, row["code_hash"]):
            conn.execute(
                "UPDATE magic_codes SET attempts = attempts + 1 WHERE id = ?",
                (cid,),
            )
            raise CodeNotFound("wrong code")
        conn.execute("UPDATE magic_codes SET used = 1 WHERE id = ?", (cid,))
        return True


def recent_codes_count(db_path: str, email: str, window_minutes: int) -> int:
    cutoff = int(time.time()) - window_minutes * 60
    with db_session(db_path) as conn:
        cur = conn.execute(
            "SELECT count(*) AS c FROM magic_codes "
            "WHERE email = ? AND created_at >= ?",
            (email.lower().strip(), cutoff),
        )
        return cur.fetchone()["c"]


def cleanup_old_codes(db_path: str, older_than_seconds: int) -> int:
    cutoff = int(time.time()) - older_than_seconds
    with db_session(db_path) as conn:
        cur = conn.execute(
            "DELETE FROM magic_codes WHERE created_at < ?",
            (cutoff,),
        )
        return cur.rowcount
