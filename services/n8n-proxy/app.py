import os
from datetime import datetime, timezone
from functools import wraps

import jwt as pyjwt
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

N8N_BASE_URL = os.getenv("N8N_BASE_URL", "").rstrip("/")
N8N_API_KEY = os.getenv("N8N_API_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "https://ninalearnsvibecoding.com")
FLASK_PORT = int(os.getenv("FLASK_PORT", "5001"))

if not N8N_BASE_URL or not N8N_API_KEY or not JWT_SECRET:
    raise RuntimeError("N8N_BASE_URL, N8N_API_KEY and JWT_SECRET must be set in .env")

app = Flask(__name__)
CORS(app, origins=[ALLOWED_ORIGIN, "http://localhost:*", "file://"])


def _n8n_headers() -> dict:
    return {"X-N8N-API-KEY": N8N_API_KEY, "Accept": "application/json"}


def _n8n_get(path: str, params: dict | None = None) -> dict:
    url = f"{N8N_BASE_URL}/api/v1{path}"
    r = requests.get(url, headers=_n8n_headers(), params=params, timeout=10)
    r.raise_for_status()
    return r.json()


def _today_utc_iso() -> str:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def _require_jwt(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "missing token"}), 401
        token = auth.split(" ", 1)[1]
        try:
            pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except pyjwt.ExpiredSignatureError:
            return jsonify({"error": "token expired"}), 401
        except pyjwt.InvalidTokenError:
            return jsonify({"error": "invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


def _fetch_all_workflows() -> list:
    results = []
    cursor = None
    while True:
        params = {"limit": 250}
        if cursor:
            params["cursor"] = cursor
        page = _n8n_get("/workflows", params=params)
        results.extend(page.get("data", []))
        cursor = page.get("nextCursor")
        if not cursor:
            break
    return results


def _fetch_executions_since(iso_timestamp: str) -> list:
    """Fetch executions, stopping when startedAt < iso_timestamp (date-filter in Python)."""
    cutoff = datetime.strptime(iso_timestamp, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    results = []
    cursor = None
    while True:
        params = {"limit": 250, "includeData": "false"}
        if cursor:
            params["cursor"] = cursor
        page = _n8n_get("/executions", params=params)
        batch = page.get("data", [])
        for ex in batch:
            started = ex.get("startedAt", "")
            if not started:
                continue
            try:
                ex_dt = _parse_dt(started).replace(tzinfo=timezone.utc)
            except Exception:
                continue
            if ex_dt < cutoff:
                return results  # executions are newest-first; stop here
            results.append(ex)
        cursor = page.get("nextCursor")
        if not cursor or not batch:
            break
    return results


def _parse_dt(s: str) -> datetime:
    for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S+00:00"):
        try:
            return datetime.strptime(s[:26].rstrip("Z") + "Z", fmt)
        except ValueError:
            continue
    return datetime.utcnow()


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/public-stats")
def public_stats():
    try:
        workflows = _fetch_all_workflows()
        today_iso = _today_utc_iso()
        executions = _fetch_executions_since(today_iso)
    except Exception as e:
        return jsonify({
            "total_workflows": 0, "active_workflows": 0,
            "runs_today": 0, "errors_24h": 0, "success_rate": 100.0,
            "error": str(e),
        })

    total = len(workflows)
    active = sum(1 for w in workflows if w.get("active"))
    runs = len(executions)
    errors = sum(1 for e in executions if e.get("status") == "error")
    success_rate = round((runs - errors) / runs * 100, 1) if runs > 0 else 100.0

    return jsonify({
        "total_workflows": total,
        "active_workflows": active,
        "runs_today": runs,
        "errors_24h": errors,
        "success_rate": success_rate,
        "error": None,
    })


@app.route("/api/public-recent-runs")
def public_recent_runs():
    try:
        page = _n8n_get("/executions", params={"limit": 10, "includeData": "false"})
        executions = page.get("data", [])
        workflows_cache: dict[str, str] = {}

        def _wf_name(wf_id: str) -> str:
            if wf_id not in workflows_cache:
                try:
                    wf = _n8n_get(f"/workflows/{wf_id}")
                    workflows_cache[wf_id] = wf.get("name", wf_id)
                except Exception:
                    workflows_cache[wf_id] = wf_id
            return workflows_cache[wf_id]

        runs = []
        for ex in executions:
            wf_id = ex.get("workflowId", "")
            started = ex.get("startedAt")
            stopped = ex.get("stoppedAt")
            duration_s = None
            if started and stopped:
                try:
                    duration_s = round(
                        (_parse_dt(stopped) - _parse_dt(started)).total_seconds(), 1
                    )
                except Exception:
                    pass
            runs.append({
                "workflow_name": _wf_name(wf_id),
                "status": ex.get("status"),
                "started_at": started,
                "duration_s": duration_s,
            })
        return jsonify({"runs": runs})
    except Exception as e:
        return jsonify({"runs": [], "error": str(e)})


@app.route("/api/workflows")
@_require_jwt
def get_workflows():
    try:
        workflows = _fetch_all_workflows()
        today_iso = _today_utc_iso()
        all_executions = _fetch_executions_since(today_iso)
    except Exception as e:
        return jsonify({"error": str(e)}), 502

    runs_by_wf: dict[str, int] = {}
    last_exec_by_wf: dict[str, dict] = {}

    for ex in all_executions:
        wf_id = ex.get("workflowId", "")
        runs_by_wf[wf_id] = runs_by_wf.get(wf_id, 0) + 1
        existing = last_exec_by_wf.get(wf_id)
        started = ex.get("startedAt", "")
        if not existing or started > existing.get("startedAt", ""):
            last_exec_by_wf[wf_id] = ex

    enriched = []
    for wf in workflows:
        wf_id = wf.get("id", "")
        last = last_exec_by_wf.get(wf_id)
        duration_s = None
        if last and last.get("startedAt") and last.get("stoppedAt"):
            try:
                duration_s = round(
                    (_parse_dt(last["stoppedAt"]) - _parse_dt(last["startedAt"])).total_seconds(), 2
                )
            except Exception:
                pass

        enriched.append({
            "id": wf_id,
            "name": wf.get("name", ""),
            "active": wf.get("active", False),
            "node_count": len(wf.get("nodes", [])),
            "created_at": wf.get("createdAt", ""),
            "updated_at": wf.get("updatedAt", ""),
            "runs_today": runs_by_wf.get(wf_id, 0),
            "last_execution": {
                "started_at": last.get("startedAt") if last else None,
                "status": last.get("status") if last else None,
                "duration_s": duration_s,
            } if last else None,
        })

    return jsonify({"workflows": enriched})


@app.route("/api/stats")
@_require_jwt
def get_stats():
    try:
        workflows = _fetch_all_workflows()
        today_iso = _today_utc_iso()
        executions = _fetch_executions_since(today_iso)
    except Exception as e:
        return jsonify({"error": str(e)}), 502

    runs = len(executions)
    errors = sum(1 for e in executions if e.get("status") == "error")
    success_rate = round((runs - errors) / runs * 100, 1) if runs > 0 else 100.0

    durations = []
    for ex in executions:
        if ex.get("startedAt") and ex.get("stoppedAt"):
            try:
                d = (_parse_dt(ex["stoppedAt"]) - _parse_dt(ex["startedAt"])).total_seconds()
                if d >= 0:
                    durations.append(d)
            except Exception:
                pass

    avg_runtime = round(sum(durations) / len(durations), 2) if durations else 0.0

    return jsonify({
        "total_workflows": len(workflows),
        "active_workflows": sum(1 for w in workflows if w.get("active")),
        "runs_today": runs,
        "errors_24h": errors,
        "success_rate": success_rate,
        "avg_runtime_s": avg_runtime,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=False)
