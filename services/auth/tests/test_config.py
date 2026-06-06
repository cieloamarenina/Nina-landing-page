import pytest
from pydantic import ValidationError

from auth.config import Settings, get_settings


def _set_required(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "s" * 32)
    monkeypatch.setenv("SMTP_USER", "user@test.de")
    monkeypatch.setenv("SMTP_PASS", "secret")


def test_defaults_are_applied(monkeypatch):
    _set_required(monkeypatch)
    s = get_settings()
    assert s.jwt_expires_hours == 24
    assert s.smtp_port == 587
    assert s.rate_limit_per_email == 3
    assert s.rate_limit_window_min == 10
    assert s.code_ttl_minutes == 10
    assert s.code_max_attempts == 5
    assert s.consent_version == "1.0"
    assert s.allowed_origin == "https://ninalearnsvibecoding.com"


def test_env_overrides_defaults(monkeypatch):
    _set_required(monkeypatch)
    monkeypatch.setenv("RATE_LIMIT_PER_EMAIL", "7")
    monkeypatch.setenv("CODE_TTL_MINUTES", "3")
    s = get_settings()
    assert s.rate_limit_per_email == 7
    assert s.code_ttl_minutes == 3


def test_env_is_case_insensitive(monkeypatch):
    _set_required(monkeypatch)
    monkeypatch.setenv("jwt_expires_hours", "12")
    assert get_settings().jwt_expires_hours == 12


def test_missing_required_field_raises(monkeypatch):
    # JWT_SECRET / SMTP_* are required and have no default.
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.delenv("SMTP_USER", raising=False)
    monkeypatch.delenv("SMTP_PASS", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_unknown_env_vars_are_ignored(monkeypatch):
    _set_required(monkeypatch)
    monkeypatch.setenv("TOTALLY_UNRELATED_VAR", "whatever")
    # extra="ignore" -> construction must not blow up.
    assert get_settings().jwt_secret == "s" * 32
