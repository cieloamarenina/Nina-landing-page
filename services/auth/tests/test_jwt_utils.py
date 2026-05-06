import time

import jwt
import pytest

from auth.jwt_utils import JWTExpired, JWTInvalid, issue_jwt, verify_jwt


SECRET = "test-secret-very-long-please"


def test_issue_jwt_returns_token_and_exp():
    token, exp = issue_jwt("a@b.de", SECRET, expires_hours=24)
    assert isinstance(token, str)
    assert exp > int(time.time())


def test_verify_valid_jwt_returns_email():
    token, _ = issue_jwt("A@B.de", SECRET)
    claims = verify_jwt(token, SECRET)
    assert claims["sub"] == "a@b.de"
    assert "jti" in claims


def test_verify_expired_jwt_raises():
    token = jwt.encode(
        {
            "sub": "a@b.de",
            "iat": int(time.time()) - 7200,
            "exp": int(time.time()) - 3600,
            "jti": "x",
        },
        SECRET,
        algorithm="HS256",
    )
    with pytest.raises(JWTExpired):
        verify_jwt(token, SECRET)


def test_verify_wrong_signature_raises():
    token, _ = issue_jwt("a@b.de", SECRET)
    with pytest.raises(JWTInvalid):
        verify_jwt(token, "different-secret")


def test_verify_garbage_raises():
    with pytest.raises(JWTInvalid):
        verify_jwt("not.a.token", SECRET)
