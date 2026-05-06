import time
from unittest.mock import patch

import jwt as pyjwt
import requests as req

from tests.conftest import MOCK_EXECUTIONS_TODAY, MOCK_WORKFLOWS

SECRET = "test-secret-at-least-32-chars-long!!"


def _make_token(expired=False):
    now = int(time.time())
    payload = {"sub": "nina@test.com", "iat": now,
               "exp": now + (-1 if expired else 3600), "jti": "test"}
    return pyjwt.encode(payload, SECRET, algorithm="HS256")


def _mock_n8n(path, params=None):
    if "/workflows" in path:
        return MOCK_WORKFLOWS
    if "/executions" in path:
        return MOCK_EXECUTIONS_TODAY
    return {"data": [], "nextCursor": None}


# ── Health ────────────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


# ── Public stats ──────────────────────────────────────────────────────────────

def test_public_stats_returns_aggregated_data(client):
    with patch("app._n8n_get", side_effect=_mock_n8n):
        r = client.get("/api/public-stats")
    assert r.status_code == 200
    d = r.get_json()
    assert d["total_workflows"] == 3
    assert d["active_workflows"] == 2
    assert d["runs_today"] == 3
    assert d["errors_24h"] == 1
    assert 0 <= d["success_rate"] <= 100
    assert d["error"] is None


def test_public_stats_returns_zeros_when_n8n_unreachable(client):
    with patch("app._n8n_get", side_effect=req.ConnectionError("down")):
        r = client.get("/api/public-stats")
    assert r.status_code == 200
    d = r.get_json()
    assert d["total_workflows"] == 0
    assert d["error"] is not None


# ── Workflows (JWT-protected) ─────────────────────────────────────────────────

def test_workflows_requires_auth(client):
    r = client.get("/api/workflows")
    assert r.status_code == 401


def test_workflows_rejects_expired_token(client):
    token = _make_token(expired=True)
    r = client.get("/api/workflows", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
    assert r.get_json()["error"] == "token expired"


def test_workflows_returns_enriched_list(client):
    token = _make_token()
    with patch("app._n8n_get", side_effect=_mock_n8n):
        r = client.get("/api/workflows", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    d = r.get_json()
    assert len(d["workflows"]) == 3
    first = next(w for w in d["workflows"] if w["id"] == "1")
    assert first["node_count"] == 8
    assert first["runs_today"] == 2
    assert first["last_execution"]["status"] == "success"


# ── Stats (JWT-protected) ─────────────────────────────────────────────────────

def test_stats_requires_auth(client):
    r = client.get("/api/stats")
    assert r.status_code == 401


def test_stats_returns_full_data(client):
    token = _make_token()
    with patch("app._n8n_get", side_effect=_mock_n8n):
        r = client.get("/api/stats", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    d = r.get_json()
    assert d["total_workflows"] == 3
    assert d["active_workflows"] == 2
    assert d["runs_today"] == 3
    assert d["errors_24h"] == 1
    assert "avg_runtime_s" in d
