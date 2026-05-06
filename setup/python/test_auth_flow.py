#!/usr/bin/env python3
"""Test the magic-link auth flow against the live auth service."""
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv


def main():
    load_dotenv(Path(__file__).parent / ".env")
    auth = os.environ["AUTH_BASE_URL"].rstrip("/")
    origin = os.environ["ALLOWED_ORIGIN"]
    test_email = os.environ["TEST_EMAIL"]

    print(f"→ Requesting code for {test_email}")
    r = requests.post(
        f"{auth}/auth/request-code",
        json={
            "email": test_email,
            "lang": "de",
            "consent": {
                "accepted_at": "2026-05-06T10:00:00Z",
                "version": "1.0",
            },
        },
        headers={"Origin": origin},
        timeout=30,
    )
    if r.status_code != 200:
        sys.exit(f"request-code failed: {r.status_code} {r.text}")
    print(f"  ✓ {r.json()}")

    code = input("Paste 6-digit code from email: ").strip()

    r = requests.post(
        f"{auth}/auth/verify",
        json={"email": test_email, "code": code},
        headers={"Origin": origin},
        timeout=30,
    )
    if r.status_code != 200:
        sys.exit(f"verify failed: {r.status_code} {r.text}")
    data = r.json()
    print(f"  ✓ JWT: {data['jwt'][:40]}…")
    print(f"  ✓ Expires at: {data['expires_at']}")
    print(f"\nFor next test:\n  export NLVC_JWT='{data['jwt']}'")


if __name__ == "__main__":
    main()
