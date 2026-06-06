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


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """The route module caches a process-global EmailRateLimiter. Without this
    reset its state would leak between tests (calls for the same email pile up),
    making request-code tests order-dependent and flaky."""
    import auth.routes.auth as auth_routes

    auth_routes._rate_limiter = None
    yield
    auth_routes._rate_limiter = None
