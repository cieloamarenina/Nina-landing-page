#!/usr/bin/env python3
"""Deploy the chat workflow to n8n via REST API.

Idempotent: looks up credentials/workflow by name; updates instead of duplicates.
"""
import json
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW_FILE = ROOT / "n8n-4-chat.json"


def env(name: str, required: bool = True) -> str:
    v = os.environ.get(name, "").strip()
    if required and not v:
        sys.exit(f"missing env var: {name}")
    return v


def n8n_request(method: str, path: str, **kwargs) -> requests.Response:
    base = env("N8N_BASE_URL").rstrip("/")
    url = f"{base}/api/v1{path}"
    headers = kwargs.pop("headers", {})
    headers["X-N8N-API-KEY"] = env("N8N_API_KEY")
    headers["Accept"] = "application/json"
    return requests.request(method, url, headers=headers, timeout=30, **kwargs)


def find_credential_by_name(name: str) -> str | None:
    r = n8n_request("GET", "/credentials")
    if r.status_code != 200:
        return None
    for c in r.json().get("data", []):
        if c.get("name") == name:
            return c["id"]
    return None


def create_credential(name: str, cred_type: str, data: dict) -> str:
    existing = find_credential_by_name(name)
    if existing:
        print(f"  · credential exists: {name} ({existing})")
        return existing
    r = n8n_request(
        "POST", "/credentials",
        json={"name": name, "type": cred_type, "data": data},
    )
    if r.status_code not in (200, 201):
        sys.exit(f"failed to create credential {name}: {r.status_code} {r.text}")
    cid = r.json()["id"]
    print(f"  ✓ created credential: {name} ({cid})")
    return cid


def find_workflow_by_name(name: str) -> str | None:
    r = n8n_request("GET", "/workflows")
    if r.status_code != 200:
        return None
    for w in r.json().get("data", []):
        if w.get("name") == name:
            return w["id"]
    return None


def upload_workflow(workflow_json: dict) -> str:
    name = workflow_json["name"]
    existing = find_workflow_by_name(name)
    if existing:
        # n8n's PATCH /workflows/{id} updates in place
        r = n8n_request("PUT", f"/workflows/{existing}", json=workflow_json)
        if r.status_code not in (200, 201):
            sys.exit(f"workflow update failed: {r.status_code} {r.text}")
        print(f"  ✓ updated workflow: {name} ({existing})")
        return existing
    r = n8n_request("POST", "/workflows", json=workflow_json)
    if r.status_code not in (200, 201):
        sys.exit(f"workflow create failed: {r.status_code} {r.text}")
    wid = r.json()["id"]
    print(f"  ✓ created workflow: {name} ({wid})")
    return wid


def activate_workflow(workflow_id: str) -> None:
    r = n8n_request("POST", f"/workflows/{workflow_id}/activate")
    if r.status_code not in (200, 201):
        sys.exit(f"activation failed: {r.status_code} {r.text}")
    print(f"  ✓ activated workflow: {workflow_id}")


def main() -> None:
    load_dotenv(Path(__file__).parent / ".env")
    print("→ Deploying chat workflow to n8n\n")

    print("1. Credentials")
    mistral_id = create_credential(
        "MISTRAL_API",
        "mistralCloudApi",
        {"apiKey": env("MISTRAL_API_KEY")},
    )

    nextcloud_pw = env("NEXTCLOUD_BOT_APP_PASSWORD", required=False)
    if nextcloud_pw:
        nextcloud_id = create_credential(
            "NEXTCLOUD_BOT",
            "httpBasicAuth",
            {
                "user": env("NEXTCLOUD_BOT_USER"),
                "password": nextcloud_pw,
            },
        )
    else:
        nextcloud_id = ""
        print("  · skipping NEXTCLOUD_BOT (no NEXTCLOUD_BOT_APP_PASSWORD set — Email-only mode)")

    smtp_id = create_credential(
        "SMTP_AUTH",
        "smtp",
        {
            "user": env("SMTP_USER"),
            "password": env("SMTP_PASS"),
            "host": env("SMTP_HOST", required=False) or "smtp.all-inkl.com",
            "port": int(env("SMTP_PORT", required=False) or "587"),
            "secure": False,
            "disableStartTls": False,
        },
    )

    print("\n2. Workflow")
    wf_text = WORKFLOW_FILE.read_text(encoding="utf-8")
    wf_text = wf_text.replace("__MISTRAL_CRED_ID__", mistral_id)
    wf_text = wf_text.replace("__NEXTCLOUD_CRED_ID__", nextcloud_id)
    wf_text = wf_text.replace("__SMTP_CRED_ID__", smtp_id)
    workflow = json.loads(wf_text)
    # Strip read-only fields the n8n API rejects on create/update
    for k in ("active", "id", "createdAt", "updatedAt", "tags",
             "versionId", "triggerCount", "pinData", "staticData",
             "meta", "shared"):
        workflow.pop(k, None)
    wid = upload_workflow(workflow)

    print("\n3. Activation")
    activate_workflow(wid)

    print("\n✅ Done")
    print(f"   Production webhook: {env('WEBHOOK_PROD_URL')}")
    print(f"   Test webhook:       {env('WEBHOOK_TEST_URL')}")
    print(f"\n   Next: set env vars on the n8n container (Coolify → n8n app → Environment):")
    print(f"     - JWT_SECRET     (must match Auth-Service env)")
    print(f"     - ALLOWED_ORIGIN = {env('ALLOWED_ORIGIN')}")
    if nextcloud_pw:
        print(f"     - NEXTCLOUD_BASE_URL        = {env('NEXTCLOUD_BASE_URL')}")
        print(f"     - NEXTCLOUD_TALK_ROOM_TOKEN = {env('NEXTCLOUD_TALK_ROOM_TOKEN', required=False)}")


if __name__ == "__main__":
    main()
