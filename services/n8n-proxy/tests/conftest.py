import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("N8N_BASE_URL", "https://n8n.example.com")
os.environ.setdefault("N8N_API_KEY", "test-key")
os.environ.setdefault("JWT_SECRET", "test-secret-at-least-32-chars-long!!")
os.environ.setdefault("ALLOWED_ORIGIN", "https://ninalearnsvibecoding.com")

MOCK_WORKFLOWS = {
    "data": [
        {"id": "1", "name": "Blog Automat", "active": True,
         "createdAt": "2026-04-21T10:00:00Z", "updatedAt": "2026-05-06T09:00:00Z",
         "nodes": [{}] * 8},
        {"id": "2", "name": "Talk Echo Bot", "active": True,
         "createdAt": "2026-05-05T10:00:00Z", "updatedAt": "2026-05-06T08:00:00Z",
         "nodes": [{}] * 5},
        {"id": "3", "name": "Support Workflow", "active": False,
         "createdAt": "2026-05-06T10:00:00Z", "updatedAt": "2026-05-06T10:00:00Z",
         "nodes": [{}] * 4},
    ],
    "nextCursor": None,
}

MOCK_EXECUTIONS_TODAY = {
    "data": [
        {"id": "e1", "workflowId": "1", "status": "success",
         "startedAt": "2026-05-06T10:00:00Z", "stoppedAt": "2026-05-06T10:00:01Z"},
        {"id": "e2", "workflowId": "1", "status": "success",
         "startedAt": "2026-05-06T09:00:00Z", "stoppedAt": "2026-05-06T09:00:02Z"},
        {"id": "e3", "workflowId": "2", "status": "error",
         "startedAt": "2026-05-06T08:00:00Z", "stoppedAt": "2026-05-06T08:00:00Z"},
    ],
    "nextCursor": None,
}


@pytest.fixture
def client():
    import app as proxy_app
    proxy_app.app.config["TESTING"] = True
    with proxy_app.app.test_client() as c:
        yield c
