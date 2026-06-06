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


# --- Edge cases ---------------------------------------------------------------


def test_issue_normalizes_email_in_sub():
    token, _ = issue_jwt("  USER@Example.COM  ", SECRET)
    claims = verify_jwt(token, SECRET)
    assert claims["sub"] == "user@example.com"


def test_exp_reflects_expires_hours():
    before = int(time.time())
    _, exp = issue_jwt("a@b.de", SECRET, expires_hours=2)
    # exp should sit ~2h ahead of now (allow a few seconds of execution slack).
    assert 2 * 3600 - 5 <= exp - before <= 2 * 3600 + 5


def test_two_tokens_have_distinct_jti():
    t1, _ = issue_jwt("a@b.de", SECRET)
    t2, _ = issue_jwt("a@b.de", SECRET)
    assert verify_jwt(t1, SECRET)["jti"] != verify_jwt(t2, SECRET)["jti"]


def test_alg_none_token_is_rejected():
    # Classic JWT attack: an unsigned token with "alg": "none" must NOT verify.
    forged = jwt.encode({"sub": "attacker@evil.de"}, key=None, algorithm="none")
    with pytest.raises(JWTInvalid):
        verify_jwt(forged, SECRET)


def test_token_signed_with_other_algorithm_rejected():
    # A token signed HS512 must be rejected since we only allow HS256.
    token = jwt.encode({"sub": "a@b.de"}, SECRET, algorithm="HS512")
    with pytest.raises(JWTInvalid):
        verify_jwt(token, SECRET)


def test_empty_token_raises():
    with pytest.raises(JWTInvalid):
        verify_jwt("", SECRET)
