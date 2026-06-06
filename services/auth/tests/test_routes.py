import time
from unittest.mock import AsyncMock, patch

import jwt
import pytest
from fastapi.testclient import TestClient

from auth.main import app


def _payload(email="a@b.de", lang="de"):
    return {
        "email": email,
        "lang": lang,
        "consent": {"accepted_at": "2026-05-06T10:00:00Z", "version": "1.0"},
    }


def test_health_returns_ok(tmp_db_path):
    with TestClient(app) as client:
        r = client.get("/auth/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_request_code_returns_200(tmp_db_path):
    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock) as mock_send:
        with TestClient(app) as client:
            r = client.post("/auth/request-code", json=_payload())
    assert r.status_code == 200
    assert r.json() == {"status": "code_sent"}
    mock_send.assert_awaited_once()


def test_request_code_invalid_email_returns_422(tmp_db_path):
    with TestClient(app) as client:
        r = client.post("/auth/request-code", json=_payload(email="not-an-email"))
    assert r.status_code == 422


def test_request_code_logs_consent(tmp_db_path):
    from auth.db import db_session

    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock):
        with TestClient(app) as client:
            client.post("/auth/request-code", json=_payload())
    with db_session(tmp_db_path) as conn:
        row = conn.execute("SELECT count(*) AS c FROM consent_log").fetchone()
        assert row["c"] == 1


def test_verify_with_correct_code_returns_jwt(tmp_db_path, monkeypatch):
    monkeypatch.setattr("auth.routes.auth.generate_code", lambda: "123456")
    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock):
        with TestClient(app) as client:
            client.post("/auth/request-code", json=_payload())
            r = client.post(
                "/auth/verify",
                json={"email": "a@b.de", "code": "123456"},
            )
    assert r.status_code == 200
    data = r.json()
    assert "jwt" in data
    assert "expires_at" in data
    claims = jwt.decode(
        data["jwt"], "test-secret-1234567890-please", algorithms=["HS256"]
    )
    assert claims["sub"] == "a@b.de"


def test_verify_with_wrong_code_returns_401(tmp_db_path, monkeypatch):
    monkeypatch.setattr("auth.routes.auth.generate_code", lambda: "123456")
    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock):
        with TestClient(app) as client:
            client.post("/auth/request-code", json=_payload())
            r = client.post(
                "/auth/verify",
                json={"email": "a@b.de", "code": "999999"},
            )
    assert r.status_code == 401


def test_verify_no_code_returns_401(tmp_db_path):
    with TestClient(app) as client:
        r = client.post(
            "/auth/verify", json={"email": "x@y.de", "code": "111111"}
        )
    assert r.status_code == 401


# --- Validation & rate-limit edge cases --------------------------------------


def test_request_code_invalid_lang_returns_422(tmp_db_path):
    with TestClient(app) as client:
        r = client.post("/auth/request-code", json=_payload(lang="xx"))
    assert r.status_code == 422


def test_request_code_missing_consent_returns_422(tmp_db_path):
    with TestClient(app) as client:
        r = client.post(
            "/auth/request-code", json={"email": "a@b.de", "lang": "de"}
        )
    assert r.status_code == 422


def test_request_code_rate_limited_returns_429(tmp_db_path):
    # Default limit is 3 per window; the 4th request must be rejected.
    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock):
        with TestClient(app) as client:
            for _ in range(3):
                ok = client.post("/auth/request-code", json=_payload(email="rl@b.de"))
                assert ok.status_code == 200
            blocked = client.post("/auth/request-code", json=_payload(email="rl@b.de"))
    assert blocked.status_code == 429


@pytest.mark.parametrize("bad_code", ["12345", "1234567", "abcdef", "12 456", ""])
def test_verify_bad_code_format_returns_422(tmp_db_path, bad_code):
    with TestClient(app) as client:
        r = client.post("/auth/verify", json={"email": "a@b.de", "code": bad_code})
    assert r.status_code == 422


def test_request_then_verify_is_case_insensitive(tmp_db_path, monkeypatch):
    # Request with an upper-case address, verify with a different casing.
    monkeypatch.setattr("auth.routes.auth.generate_code", lambda: "123456")
    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock):
        with TestClient(app) as client:
            client.post("/auth/request-code", json=_payload(email="MixedCase@B.de"))
            r = client.post(
                "/auth/verify", json={"email": "mixedcase@b.de", "code": "123456"}
            )
    assert r.status_code == 200
    assert jwt.decode(
        r.json()["jwt"], "test-secret-1234567890-please", algorithms=["HS256"]
    )["sub"] == "mixedcase@b.de"


def test_verify_expires_at_is_in_the_future(tmp_db_path, monkeypatch):
    monkeypatch.setattr("auth.routes.auth.generate_code", lambda: "123456")
    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock):
        with TestClient(app) as client:
            client.post("/auth/request-code", json=_payload())
            r = client.post("/auth/verify", json={"email": "a@b.de", "code": "123456"})
    assert r.json()["expires_at"] > int(time.time())
