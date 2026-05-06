#!/usr/bin/env python3
"""Test chat webhook with a real JWT (from NLVC_JWT env var)."""
import os
import sys
import uuid
from pathlib import Path

import requests
from dotenv import load_dotenv


def main():
    load_dotenv(Path(__file__).parent / ".env")
    webhook = os.environ.get("WEBHOOK_PROD_URL") or os.environ["WEBHOOK_TEST_URL"]
    origin = os.environ["ALLOWED_ORIGIN"]
    jwt_token = os.environ.get("NLVC_JWT")
    if not jwt_token:
        sys.exit("set NLVC_JWT (run test_auth_flow.py first to get one)")

    sid = str(uuid.uuid4())
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Origin": origin,
        "Content-Type": "application/json",
    }

    def call(message: str) -> dict:
        r = requests.post(
            webhook,
            json={
                "session_id": sid,
                "message": message,
                "lang": "de",
                "honeypot": "",
            },
            headers=headers,
            timeout=60,
        )
        if r.status_code != 200:
            sys.exit(f"webhook failed: {r.status_code} {r.text}")
        return r.json()

    print(f"→ Session {sid}\n")

    print("Question 1: Hi! Wer ist Nina?")
    a = call("Hi! Wer ist Nina?")
    print(f"  reply: {a['reply'][:200]}…")
    if not a.get("reply") or len(a["reply"]) < 10:
        sys.exit("empty reply")

    print("\nQuestion 2 (memory test): Was hast du gerade gesagt?")
    b = call("Was hast du gerade gesagt?")
    print(f"  reply: {b['reply'][:200]}…")
    if b["reply"] == a["reply"]:
        sys.exit("responses identical — memory might be broken")

    print("\n✅ Webhook reachable, replies non-empty, memory functional")


if __name__ == "__main__":
    main()
