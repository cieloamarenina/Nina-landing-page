import hashlib
import time

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from auth.codes import (
    CodeError,
    generate_code,
    recent_codes_count,
    store_code,
    verify_code,
)
from auth.config import get_settings
from auth.db import db_session
from auth.email_sender import send_code_email
from auth.jwt_utils import issue_jwt
from auth.rate_limit import EmailRateLimiter, RateLimitExceeded


router = APIRouter()


class ConsentBody(BaseModel):
    accepted_at: str
    version: str


class RequestCodeBody(BaseModel):
    email: EmailStr
    lang: str = Field(pattern=r"^(de|en|fr|es|it)$")
    consent: ConsentBody


class VerifyBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


_rate_limiter: EmailRateLimiter | None = None


def _get_rate_limiter() -> EmailRateLimiter:
    global _rate_limiter
    if _rate_limiter is None:
        s = get_settings()
        _rate_limiter = EmailRateLimiter(
            max_per_window=s.rate_limit_per_email,
            window_seconds=s.rate_limit_window_min * 60,
        )
    return _rate_limiter


def _hash_ip(ip: str) -> str:
    return hashlib.sha256(f"nlvc-salt:{ip}".encode()).hexdigest()


@router.post("/auth/request-code")
async def request_code(body: RequestCodeBody, request: Request):
    s = get_settings()
    email = body.email.lower().strip()

    try:
        _get_rate_limiter().check_and_record(email)
    except RateLimitExceeded:
        raise HTTPException(status_code=429, detail="too many requests")

    if recent_codes_count(s.sqlite_path, email, s.rate_limit_window_min) >= s.rate_limit_per_email:
        raise HTTPException(status_code=429, detail="too many recent codes")

    code = generate_code()
    store_code(s.sqlite_path, email, code)

    ip = request.client.host if request.client else "unknown"
    with db_session(s.sqlite_path) as conn:
        conn.execute(
            "INSERT INTO consent_log (email, accepted_at, consent_version, ip_hash) "
            "VALUES (?, ?, ?, ?)",
            (email, int(time.time()), body.consent.version, _hash_ip(ip)),
        )

    await send_code_email(
        to=email,
        code=code,
        lang=body.lang,
        host=s.smtp_host,
        port=s.smtp_port,
        user=s.smtp_user,
        password=s.smtp_pass,
        sender=s.smtp_from,
    )
    return {"status": "code_sent"}


@router.post("/auth/verify")
def verify(body: VerifyBody):
    s = get_settings()
    email = body.email.lower().strip()
    try:
        verify_code(
            s.sqlite_path,
            email,
            body.code,
            s.code_ttl_minutes,
            s.code_max_attempts,
        )
    except CodeError:
        raise HTTPException(status_code=401, detail="invalid code")

    token, exp = issue_jwt(email, s.jwt_secret, expires_hours=s.jwt_expires_hours)
    return {"jwt": token, "expires_at": exp}
