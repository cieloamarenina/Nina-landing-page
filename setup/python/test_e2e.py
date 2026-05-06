#!/usr/bin/env python3
"""End-to-end: auth → chat → verify Nextcloud Talk message arrived."""
import os
import sys
import time
import uuid
from pathlib import Path

import requests
from dotenv import load_dotenv


def main():
    load_dotenv(Path(__file__).parent / ".env")
    auth = os.environ["AUTH_BASE_URL"].rstrip("/")
    webhook = os.environ.get("WEBHOOK_PROD_URL") or os.environ["WEBHOOK_TEST_URL"]
    origin = os.environ["ALLOWED_ORIGIN"]
    test_email = os.environ["TEST_EMAIL"]
    nc_base = os.environ["NEXTCLOUD_BASE_URL"].rstrip("/")
    nc_user = os.environ["NEXTCLOUD_BOT_USER"]
    nc_pass = os.environ["NEXTCLOUD_BOT_APP_PASSWORD"]
    nc_room = os.environ["NEXTCLOUD_TALK_ROOM_TOKEN"]

    sid = str(uuid.uuid4())
    print(f"→ Session {sid}\n")

    print("1. Request magic code")
    r = requests.post(
        f"{auth}/auth/request-code",
        json={
            "email": test_email, "lang": "de",
            "consent": {"accepted_at": "2026-05-06T10:00:00Z", "version": "1.0"},
        },
        headers={"Origin": origin}, timeout=30,
    )
    if r.status_code != 200:
        sys.exit(f"request-code failed: {r.status_code} {r.text}")
    print(f"   ✓ code sent to {test_email}")

    code = input("   Paste 6-digit code from email: ").strip()

    print("\n2. Verify code")
    r = requests.post(
        f"{auth}/auth/verify",
        json={"email": test_email, "code": code},
        headers={"Origin": origin}, timeout=30,
    )
    if r.status_code != 200:
        sys.exit(f"verify failed: {r.status_code} {r.text}")
    jwt_token = r.json()["jwt"]
    print(f"   ✓ JWT received")

    msg = f"e2e-test-{sid[:8]}: was ist Pablo Player?"
    print(f"\n3. Chat: {msg!r}")
    r = requests.post(
        webhook,
        json={"session_id": sid, "message": msg, "lang": "de", "honeypot": ""},
        headers={
            "Authorization": f"Bearer {jwt_token}",
            "Origin": origin,
            "Content-Type": "application/json",
        },
        timeout=60,
    )
    if r.status_code != 200:
        sys.exit(f"chat failed: {r.status_code} {r.text}")
    reply = r.json().get("reply", "")
    if not reply:
        sys.exit("empty reply")
    print(f"   ✓ reply: {reply[:200]}…")
    if "spotify" not in reply.lower() and "music" not in reply.lower():
        print(f"   ⚠ reply doesn't mention Spotify/Music — system prompt may need tuning")

    print("\n4. Check Nextcloud Talk for notification")
    time.sleep(2)
    r = requests.get(
        f"{nc_base}/ocs/v2.php/apps/spreed/api/v1/chat/{nc_room}",
        params={"lookIntoFuture": 0, "limit": 10},
        headers={"OCS-APIRequest": "true", "Accept": "application/json"},
        auth=(nc_user, nc_pass),
        timeout=30,
    )
    if r.status_code != 200:
        sys.exit(f"Talk fetch failed: {r.status_code} {r.text}")
    messages = r.json().get("ocs", {}).get("data", [])
    found = any(sid[:8] in (m.get("message") or "") for m in messages)
    if not found:
        sys.exit(f"Talk notification with session {sid[:8]} not in last 10 messages")
    print(f"   ✓ Talk notification received")

    print("\n✅ E2E PASS")


if __name__ == "__main__":
    main()
