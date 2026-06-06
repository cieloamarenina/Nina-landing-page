import sqlite3

from auth.db import db_session, get_connection, init_db


def test_init_db_creates_expected_tables(tmp_path):
    path = str(tmp_path / "auth.db")
    init_db(path)
    with db_session(path) as conn:
        tables = {
            row["name"]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
        }
    assert {"magic_codes", "consent_log"} <= tables


def test_init_db_creates_parent_directories(tmp_path):
    # Nested path that does not exist yet — init_db must mkdir -p.
    path = str(tmp_path / "nested" / "deeper" / "auth.db")
    init_db(path)
    with db_session(path) as conn:
        conn.execute("SELECT 1 FROM magic_codes")  # would raise if missing


def test_init_db_is_idempotent(tmp_path):
    path = str(tmp_path / "auth.db")
    init_db(path)
    with db_session(path) as conn:
        conn.execute(
            "INSERT INTO magic_codes (email, code_hash, created_at) VALUES (?, ?, ?)",
            ("a@b.de", "h", 1),
        )
    # Re-running init_db must NOT drop or wipe existing data (uses IF NOT EXISTS).
    init_db(path)
    with db_session(path) as conn:
        count = conn.execute("SELECT count(*) AS c FROM magic_codes").fetchone()["c"]
    assert count == 1


def test_connection_uses_row_factory(tmp_path):
    path = str(tmp_path / "auth.db")
    init_db(path)
    with db_session(path) as conn:
        row = conn.execute("SELECT 1 AS answer").fetchone()
    assert isinstance(row, sqlite3.Row)
    assert row["answer"] == 1


def test_connection_autocommits(tmp_path):
    # isolation_level=None means writes persist without an explicit commit.
    path = str(tmp_path / "auth.db")
    init_db(path)
    conn = get_connection(path)
    conn.execute(
        "INSERT INTO magic_codes (email, code_hash, created_at) VALUES (?, ?, ?)",
        ("a@b.de", "h", 1),
    )
    conn.close()  # no commit() call
    with db_session(path) as conn2:
        count = conn2.execute("SELECT count(*) AS c FROM magic_codes").fetchone()["c"]
    assert count == 1
