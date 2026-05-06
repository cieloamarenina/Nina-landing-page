import pytest

from auth.rate_limit import EmailRateLimiter, RateLimitExceeded


def test_under_limit_allowed():
    rl = EmailRateLimiter(max_per_window=3, window_seconds=600)
    rl.check_and_record("a@b.de")
    rl.check_and_record("a@b.de")
    rl.check_and_record("a@b.de")


def test_over_limit_raises():
    rl = EmailRateLimiter(max_per_window=2, window_seconds=600)
    rl.check_and_record("a@b.de")
    rl.check_and_record("a@b.de")
    with pytest.raises(RateLimitExceeded):
        rl.check_and_record("a@b.de")


def test_window_expires(monkeypatch):
    fake_now = [1000.0]
    monkeypatch.setattr("auth.rate_limit.time.monotonic", lambda: fake_now[0])
    rl = EmailRateLimiter(max_per_window=1, window_seconds=60)
    rl.check_and_record("a@b.de")
    fake_now[0] = 1100.0
    rl.check_and_record("a@b.de")


def test_per_email_isolated():
    rl = EmailRateLimiter(max_per_window=1, window_seconds=600)
    rl.check_and_record("a@b.de")
    rl.check_and_record("c@d.de")
