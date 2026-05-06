import time

import pytest

from auth.codes import (
    CodeExpired,
    CodeMaxAttempts,
    CodeNotFound,
    CodeUsed,
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
    fake_now = [time.time() - 60 * 20]
    monkeypatch.setattr("auth.codes.time.time", lambda: fake_now[0])
    store_code(tmp_db_path, "a@b.de", "123456")
    fake_now[0] = time.time()
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
    fake_now = [time.time() - 3600 * 2]
    monkeypatch.setattr("auth.codes.time.time", lambda: fake_now[0])
    store_code(tmp_db_path, "a@b.de", "111111")
    fake_now[0] = time.time()
    deleted = cleanup_old_codes(tmp_db_path, older_than_seconds=3600)
    assert deleted == 1
