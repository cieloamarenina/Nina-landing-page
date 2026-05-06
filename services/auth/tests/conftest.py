import os
import tempfile

import pytest

from auth.db import init_db


@pytest.fixture
def tmp_db_path(monkeypatch):
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    monkeypatch.setenv("SQLITE_PATH", path)
    monkeypatch.setenv("JWT_SECRET", "test-secret-1234567890-please")
    monkeypatch.setenv("SMTP_USER", "u")
    monkeypatch.setenv("SMTP_PASS", "p")
    init_db(path)
    yield path
    try:
        os.unlink(path)
    except OSError:
        pass
