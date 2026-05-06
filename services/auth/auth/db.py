import sqlite3
from contextlib import contextmanager
from pathlib import Path


SCHEMA = """
CREATE TABLE IF NOT EXISTS magic_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_codes_email ON magic_codes(email, created_at DESC);

CREATE TABLE IF NOT EXISTS consent_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    accepted_at INTEGER NOT NULL,
    consent_version TEXT NOT NULL,
    ip_hash TEXT NOT NULL
);
"""


def init_db(path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()


def get_connection(path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(path, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def db_session(path: str):
    conn = get_connection(path)
    try:
        yield conn
    finally:
        conn.close()
