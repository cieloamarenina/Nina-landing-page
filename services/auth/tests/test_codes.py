import pytest

from auth.codes import (
    CodeExpired,
    CodeMaxAttempts,
    CodeNotFound,
    CodeUsed,
    _hash,
    _matches,
    cleanup_old_codes,
    generate_code,
    recent_codes_count,
    store_code,
    verify_code,
)


def test_generate_code_is_six_digits():
    for _ in range(100):
        c = generate_code()
        assert len(c) == 6
        assert c.isdigit()


def test_store_and_verify_code_success(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "123456")
    assert verify_code(tmp_db_path, "a@b.de", "123456", 10, 5) is True


def test_verify_wrong_code_raises(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "123456")
    with pytest.raises(CodeNotFound):
        verify_code(tmp_db_path, "a@b.de", "999999", 10, 5)


def test_verify_used_code_raises(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "123456")
    verify_code(tmp_db_path, "a@b.de", "123456", 10, 5)
    with pytest.raises(CodeUsed):
        verify_code(tmp_db_path, "a@b.de", "123456", 10, 5)


def test_verify_expired_code_raises(tmp_db_path, monkeypatch):
    # Advance a controllable clock forward. We must NOT reset via time.time(),
    # because monkeypatching auth.codes.time.time patches the shared time module
    # singleton — the real clock is no longer reachable from here.
    clock = [1_000_000.0]
    monkeypatch.setattr("auth.codes.time.time", lambda: clock[0])
    store_code(tmp_db_path, "a@b.de", "123456")  # created_at = 1_000_000
    clock[0] += 60 * 20  # 20 minutes later, past the 10-minute TTL
    with pytest.raises(CodeExpired):
        verify_code(tmp_db_path, "a@b.de", "123456", 10, 5)


def test_max_attempts_enforced(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "123456")
    for _ in range(5):
        with pytest.raises(CodeNotFound):
            verify_code(tmp_db_path, "a@b.de", "wrong1", 10, 5)
    with pytest.raises(CodeMaxAttempts):
        verify_code(tmp_db_path, "a@b.de", "123456", 10, 5)


def test_recent_codes_count(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "111111")
    store_code(tmp_db_path, "a@b.de", "222222")
    assert recent_codes_count(tmp_db_path, "a@b.de", 10) == 2
    assert recent_codes_count(tmp_db_path, "x@y.de", 10) == 0


def test_cleanup_old_codes(tmp_db_path, monkeypatch):
    clock = [1_000_000.0]
    monkeypatch.setattr("auth.codes.time.time", lambda: clock[0])
    store_code(tmp_db_path, "a@b.de", "111111")  # created_at = 1_000_000
    clock[0] += 3600 * 2  # 2 hours later
    deleted = cleanup_old_codes(tmp_db_path, older_than_seconds=3600)
    assert deleted == 1


# --- Edge cases ---------------------------------------------------------------


def test_cleanup_keeps_recent_codes(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "111111")
    assert cleanup_old_codes(tmp_db_path, older_than_seconds=3600) == 0
    # The fresh code must survive and still verify.
    assert verify_code(tmp_db_path, "a@b.de", "111111", 10, 5) is True


def test_email_normalized_on_store_and_verify(tmp_db_path):
    # Stored uppercase/padded, verified lowercase/clean — must still match.
    store_code(tmp_db_path, "  A@B.de  ", "123456")
    assert verify_code(tmp_db_path, "a@b.de", "123456", 10, 5) is True


def test_verify_email_normalized_lookup(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "123456")
    assert verify_code(tmp_db_path, "  A@B.DE ", "123456", 10, 5) is True


def test_wrong_attempts_persist_across_calls(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "123456")
    for _ in range(3):
        with pytest.raises(CodeNotFound):
            verify_code(tmp_db_path, "a@b.de", "000000", 10, 5)
    assert recent_codes_count(tmp_db_path, "a@b.de", 10) == 1
    # Two attempts remain (max=5), so the correct code still works.
    assert verify_code(tmp_db_path, "a@b.de", "123456", 10, 5) is True


def test_correct_code_rejected_after_max_attempts(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "123456")
    for _ in range(5):
        with pytest.raises(CodeNotFound):
            verify_code(tmp_db_path, "a@b.de", "000000", 10, 5)
    # Even the RIGHT code is refused once the attempt budget is spent.
    with pytest.raises(CodeMaxAttempts):
        verify_code(tmp_db_path, "a@b.de", "123456", 10, 5)


def test_only_latest_code_is_checked(tmp_db_path, monkeypatch):
    # Re-requesting a code invalidates the previous one (verify reads newest only).
    # The two codes need distinct created_at, so advance a controllable clock.
    clock = [1_000_000.0]
    monkeypatch.setattr("auth.codes.time.time", lambda: clock[0])
    store_code(tmp_db_path, "a@b.de", "111111")
    clock[0] += 60
    store_code(tmp_db_path, "a@b.de", "222222")
    with pytest.raises(CodeNotFound):
        verify_code(tmp_db_path, "a@b.de", "111111", 10, 5)
    assert verify_code(tmp_db_path, "a@b.de", "222222", 10, 5) is True


def test_unknown_email_raises_not_found(tmp_db_path):
    with pytest.raises(CodeNotFound):
        verify_code(tmp_db_path, "nobody@nowhere.de", "123456", 10, 5)


def test_hash_is_salted_but_still_matches():
    # bcrypt salts each call: same input -> different hashes, both verifiable.
    h1, h2 = _hash("123456"), _hash("123456")
    assert h1 != h2
    assert _matches("123456", h1)
    assert _matches("123456", h2)
    assert not _matches("654321", h1)


def test_recent_codes_count_respects_window(tmp_db_path, monkeypatch):
    clock = [1_000_000.0]
    monkeypatch.setattr("auth.codes.time.time", lambda: clock[0])
    store_code(tmp_db_path, "a@b.de", "111111")  # at t=1_000_000
    clock[0] += 60 * 20  # 20 minutes later
    store_code(tmp_db_path, "a@b.de", "222222")  # at t=+20min
    # 10-minute window only sees the second code.
    assert recent_codes_count(tmp_db_path, "a@b.de", 10) == 1
    # 30-minute window sees both.
    assert recent_codes_count(tmp_db_path, "a@b.de", 30) == 2


def test_generate_code_can_produce_leading_zeros(monkeypatch):
    monkeypatch.setattr("auth.codes.secrets.randbelow", lambda n: 42)
    assert generate_code() == "000042"
