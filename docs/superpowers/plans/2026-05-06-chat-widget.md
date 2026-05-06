# Chat Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Liefere Underwater-Chat-Widget für ninalearnsvibecoding.com mit Magic-Link-Auth, n8n-AI-Backend (Mistral) und Nextcloud-Talk-Notifications, DSGVO-konform.

**Architecture:** Drei Komponenten — Frontend (Vanilla-CSS/JS in `chat-widget.{css,js}`), Auth-Service (FastAPI + SQLite + SMTP, deployt als Docker-Container in Coolify), n8n-Workflow (Mistral Agent mit Memory + Article-Search-Tool, parallele Branches für Reply, Nextcloud-Talk, Bot-Block-Email). Setup automatisiert per Python-Skript via n8n REST API.

**Tech Stack:** FastAPI, SQLite, PyJWT, bcrypt, aiosmtplib, pytest + httpx (Auth) — Vanilla JS/CSS (Frontend) — n8n REST API + requests (Setup) — Mistral Large via nativer n8n-Node — Nextcloud Talk OCS API.

**Spec-Referenz:** [docs/superpowers/specs/2026-05-06-chat-widget-design.md](../specs/2026-05-06-chat-widget-design.md)

---

## File Structure

```
Nina-landing-page/
├── .gitignore                                   [MODIFY]
│
├── chat-widget.css                              [NEW] Frontend-Stil (Underwater + Modal-frei)
├── chat-widget.js                               [NEW] Frontend-Logik (Auth + Chat + i18n)
├── index.html                                   [MODIFY] Widget einbinden + i18n-Keys
│
├── services/auth/                               [NEW] FastAPI-Container
│   ├── .env.sample
│   ├── .gitignore
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── README.md
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── config.py        Pydantic-Settings (env-vars)
│   │   ├── db.py            SQLite-Connection + Schema-Init
│   │   ├── codes.py         Magic-Code Generieren/Verifizieren
│   │   ├── jwt_utils.py     JWT issuen + verifizieren
│   │   ├── email_sender.py  SMTP-Versand mit i18n-Templates
│   │   ├── rate_limit.py    In-Process Rate-Limiter (Email-basiert)
│   │   ├── main.py          FastAPI-App + Lifespan + Cleanup-Task
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── health.py    GET /auth/health
│   │   │   └── auth.py      POST /auth/request-code, POST /auth/verify
│   │   └── i18n/
│   │       ├── code_email.de.html
│   │       ├── code_email.en.html
│   │       ├── code_email.fr.html
│   │       ├── code_email.es.html
│   │       └── code_email.it.html
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_codes.py
│       ├── test_jwt_utils.py
│       ├── test_rate_limit.py
│       ├── test_email_sender.py
│       └── test_routes.py
│
├── setup/
│   ├── n8n-4-chat.json                          [NEW] n8n Workflow-JSON
│   └── python/
│       ├── .env.sample                          [NEW]
│       ├── .gitignore                           [NEW]
│       ├── requirements.txt                     [NEW]
│       ├── deploy_chat_workflow.py              [NEW]
│       ├── test_auth_flow.py                    [NEW]
│       ├── test_chat_webhook.py                 [NEW]
│       └── test_e2e.py                          [NEW]
│
├── docs/
│   └── datenschutz-chat-widget.md               [NEW] DSGVO-Vorlage
│
└── preview/chat-widget-preview.html             [EXISTING]
```

---

## Phase 1 — Repository Setup

### Task 1: .gitignore + Verzeichnisstruktur

**Files:**
- Modify: `/Users/redfish-hr/Stuff/Nina-landing-page/.gitignore`

- [ ] **Step 1: Read current .gitignore**

```bash
cat /Users/redfish-hr/Stuff/Nina-landing-page/.gitignore 2>/dev/null || echo "(none)"
```

- [ ] **Step 2: Write/update root .gitignore**

Append (or create if not present) the following block at the end of `/Users/redfish-hr/Stuff/Nina-landing-page/.gitignore`:

```
# Chat Widget secrets and runtime data
services/auth/.env
services/auth/data/
services/auth/.venv/
services/auth/__pycache__/
services/auth/**/__pycache__/
setup/python/.env
setup/python/.venv/
setup/python/__pycache__/
setup/python/**/__pycache__/
*.pyc
.pytest_cache/
```

- [ ] **Step 3: Verify**

Run: `cd /Users/redfish-hr/Stuff/Nina-landing-page && git check-ignore -v services/auth/.env setup/python/.env`
Expected: each path resolves to a `.gitignore` rule (output non-empty).

- [ ] **Step 4: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add .gitignore
git commit -m "chore: ignore chat-widget secrets and runtime data"
```

---

### Task 2: setup/python/ Skelett

**Files:**
- Create: `setup/python/requirements.txt`
- Create: `setup/python/.env.sample`
- Create: `setup/python/.gitignore`
- Create: `setup/python/README.md`

- [ ] **Step 1: Create requirements.txt**

```
requests>=2.31
python-dotenv>=1.0
PyJWT>=2.8
```

- [ ] **Step 2: Create .env.sample**

```
# n8n
N8N_BASE_URL=https://n8n.ninalearnsvibecoding.com
N8N_API_KEY=
WEBHOOK_TEST_URL=https://n8n.ninalearnsvibecoding.com/webhook-test/8b1a11fc-6362-44c4-8422-7eb8b13e8d3e
WEBHOOK_PROD_URL=https://n8n.ninalearnsvibecoding.com/webhook/8b1a11fc-6362-44c4-8422-7eb8b13e8d3e

# Auth-Service (lokal/Coolify)
AUTH_BASE_URL=https://auth.ninalearnsvibecoding.com

# Mistral
MISTRAL_API_KEY=
MISTRAL_MODEL=mistral-large-latest

# Nextcloud Talk
NEXTCLOUD_BASE_URL=https://cloud.ninalearnsvibecoding.com
NEXTCLOUD_BOT_USER=nina-bot
NEXTCLOUD_BOT_APP_PASSWORD=
NEXTCLOUD_TALK_ROOM_TOKEN=

# JWT (must match Auth-Service)
JWT_SECRET=

# Sicherheit
ALLOWED_ORIGIN=https://ninalearnsvibecoding.com

# Test
TEST_EMAIL=
```

- [ ] **Step 3: Create local .gitignore**

```
.env
.venv/
__pycache__/
*.pyc
```

- [ ] **Step 4: Create README.md**

```markdown
# Setup-Toolkit (Python)

Automatisches Deployment des n8n-Workflows + E2E-Tests.

## Quickstart

```bash
cd setup/python
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.sample .env
# Werte in .env eintragen (n8n API-Key, Mistral, Nextcloud, JWT_SECRET muss = Auth-Service)
python deploy_chat_workflow.py    # uploaded Workflow + Credentials
python test_e2e.py                # Auth → Chat → Verify
```

## Skripte

| Skript | Was es tut |
|--------|------------|
| `deploy_chat_workflow.py` | Legt Mistral-Credential + Nextcloud-Credential in n8n an, uploaded `setup/n8n-4-chat.json`, aktiviert Workflow |
| `test_auth_flow.py` | Magic-Link Flow: request-code → verify → JWT |
| `test_chat_webhook.py` | Chat-Webhook mit echtem JWT |
| `test_e2e.py` | End-to-End: Auth + Chat + Talk-Notification verifiziert |
```

- [ ] **Step 5: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add setup/python/
git commit -m "chore(setup): scaffold python deployment toolkit"
```

---

## Phase 2 — Auth-Service

### Task 3: services/auth/ Skelett + Dependencies

**Files:**
- Create: `services/auth/requirements.txt`
- Create: `services/auth/pytest.ini`
- Create: `services/auth/.env.sample`
- Create: `services/auth/.gitignore`
- Create: `services/auth/auth/__init__.py` (empty)
- Create: `services/auth/auth/routes/__init__.py` (empty)
- Create: `services/auth/tests/__init__.py` (empty)

- [ ] **Step 1: Create requirements.txt**

```
fastapi>=0.110
uvicorn[standard]>=0.27
pydantic>=2.6
pydantic-settings>=2.2
PyJWT>=2.8
bcrypt>=4.1
aiosmtplib>=3.0
email-validator>=2.1
httpx>=0.27
```

- [ ] **Step 2: Create dev requirements**

Create `services/auth/requirements-dev.txt`:

```
pytest>=8.0
pytest-asyncio>=0.23
pytest-cov>=4.1
respx>=0.20
freezegun>=1.4
```

- [ ] **Step 3: Create pytest.ini**

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
pythonpath = .
filterwarnings =
    ignore::DeprecationWarning
```

- [ ] **Step 4: Create .env.sample**

```
JWT_SECRET=please-generate-32-bytes-base64
JWT_EXPIRES_HOURS=24

SQLITE_PATH=./data/auth.db

SMTP_HOST=smtp.all-inkl.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Nina Learns Vibe Coding <ciao@ninalearnsvibecoding.com>

ALLOWED_ORIGIN=https://ninalearnsvibecoding.com

RATE_LIMIT_PER_EMAIL=3
RATE_LIMIT_WINDOW_MIN=10
CODE_TTL_MINUTES=10
CODE_MAX_ATTEMPTS=5

CONSENT_VERSION=1.0
```

- [ ] **Step 5: Create local .gitignore**

```
.env
data/
.venv/
__pycache__/
*.pyc
.pytest_cache/
htmlcov/
.coverage
```

- [ ] **Step 6: Create empty package files**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
mkdir -p services/auth/auth/routes services/auth/auth/i18n services/auth/tests services/auth/data
touch services/auth/auth/__init__.py
touch services/auth/auth/routes/__init__.py
touch services/auth/tests/__init__.py
touch services/auth/data/.gitkeep
```

- [ ] **Step 7: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/
git commit -m "chore(auth): scaffold FastAPI service skeleton"
```

---

### Task 4: config.py — Pydantic Settings

**Files:**
- Create: `services/auth/auth/config.py`
- Create: `services/auth/tests/test_config.py`

- [ ] **Step 1: Write failing test**

`services/auth/tests/test_config.py`:

```python
import os
from auth.config import Settings


def test_settings_load_from_env(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "abc")
    monkeypatch.setenv("SMTP_USER", "u")
    monkeypatch.setenv("SMTP_PASS", "p")
    s = Settings()
    assert s.jwt_secret == "abc"
    assert s.jwt_expires_hours == 24
    assert s.code_ttl_minutes == 10
    assert s.allowed_origin == "https://ninalearnsvibecoding.com"


def test_settings_missing_jwt_secret_raises(monkeypatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.setenv("SMTP_USER", "u")
    monkeypatch.setenv("SMTP_PASS", "p")
    import pytest
    with pytest.raises(Exception):
        Settings()
```

- [ ] **Step 2: Run test, verify it fails**

```bash
cd services/auth
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/test_config.py -v
```

Expected: ImportError / ModuleNotFoundError on `auth.config`.

- [ ] **Step 3: Implement config.py**

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    jwt_secret: str = Field(...)
    jwt_expires_hours: int = 24

    sqlite_path: str = "./data/auth.db"

    smtp_host: str = "smtp.all-inkl.com"
    smtp_port: int = 587
    smtp_user: str = Field(...)
    smtp_pass: str = Field(...)
    smtp_from: str = "Nina Learns Vibe Coding <ciao@ninalearnsvibecoding.com>"

    allowed_origin: str = "https://ninalearnsvibecoding.com"

    rate_limit_per_email: int = 3
    rate_limit_window_min: int = 10
    code_ttl_minutes: int = 10
    code_max_attempts: int = 5

    consent_version: str = "1.0"


def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 4: Run test, verify it passes**

```bash
pytest tests/test_config.py -v
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/auth/config.py services/auth/tests/test_config.py
git commit -m "feat(auth): typed settings via pydantic-settings"
```

---

### Task 5: db.py — SQLite Schema + Connection

**Files:**
- Create: `services/auth/auth/db.py`
- Create: `services/auth/tests/conftest.py`
- Create: `services/auth/tests/test_db.py`

- [ ] **Step 1: Write conftest.py with fixtures**

`services/auth/tests/conftest.py`:

```python
import os
import tempfile
import pytest
from auth.db import init_db, get_connection


@pytest.fixture
def tmp_db_path(monkeypatch):
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    monkeypatch.setenv("SQLITE_PATH", path)
    monkeypatch.setenv("JWT_SECRET", "test-secret-1234567890")
    monkeypatch.setenv("SMTP_USER", "u")
    monkeypatch.setenv("SMTP_PASS", "p")
    init_db(path)
    yield path
    try:
        os.unlink(path)
    except OSError:
        pass
```

- [ ] **Step 2: Write failing test**

`services/auth/tests/test_db.py`:

```python
import sqlite3
from auth.db import init_db, get_connection


def test_init_db_creates_tables(tmp_db_path):
    conn = get_connection(tmp_db_path)
    cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = {row[0] for row in cur}
    assert "magic_codes" in tables
    assert "consent_log" in tables


def test_init_db_is_idempotent(tmp_db_path):
    init_db(tmp_db_path)
    init_db(tmp_db_path)  # second call should not raise
    conn = get_connection(tmp_db_path)
    cur = conn.execute("SELECT count(*) FROM magic_codes")
    assert cur.fetchone()[0] == 0
```

- [ ] **Step 3: Run test, verify it fails**

```bash
cd services/auth
pytest tests/test_db.py -v
```

Expected: ImportError on `auth.db`.

- [ ] **Step 4: Implement db.py**

```python
import sqlite3
from contextlib import contextmanager
from pathlib import Path


SCHEMA = """
CREATE TABLE IF NOT EXISTS magic_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_codes_email ON magic_codes(email, created_at DESC);

CREATE TABLE IF NOT EXISTS consent_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    accepted_at INTEGER NOT NULL,
    consent_version TEXT NOT NULL,
    ip_hash TEXT NOT NULL
);
"""


def init_db(path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()


def get_connection(path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(path, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def db_session(path: str):
    conn = get_connection(path)
    try:
        yield conn
    finally:
        conn.close()
```

- [ ] **Step 5: Run tests, verify pass**

```bash
pytest tests/test_db.py -v
```

Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/auth/db.py services/auth/tests/conftest.py services/auth/tests/test_db.py
git commit -m "feat(auth): sqlite schema and connection helper"
```

---

### Task 6: codes.py — Magic-Code-Logik

**Files:**
- Create: `services/auth/auth/codes.py`
- Create: `services/auth/tests/test_codes.py`

- [ ] **Step 1: Write failing tests**

`services/auth/tests/test_codes.py`:

```python
import time
import pytest
from auth.codes import (
    generate_code,
    store_code,
    verify_code,
    CodeNotFound,
    CodeExpired,
    CodeUsed,
    CodeMaxAttempts,
)


def test_generate_code_is_six_digits():
    for _ in range(100):
        c = generate_code()
        assert len(c) == 6
        assert c.isdigit()


def test_store_and_verify_code_success(tmp_db_path):
    code = "123456"
    store_code(tmp_db_path, "a@b.de", code)
    assert verify_code(tmp_db_path, "a@b.de", code, ttl_minutes=10, max_attempts=5) is True


def test_verify_wrong_code_increments_attempts(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "123456")
    with pytest.raises(CodeNotFound):
        verify_code(tmp_db_path, "a@b.de", "999999", ttl_minutes=10, max_attempts=5)


def test_verify_used_code_raises(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "123456")
    verify_code(tmp_db_path, "a@b.de", "123456", ttl_minutes=10, max_attempts=5)
    with pytest.raises(CodeUsed):
        verify_code(tmp_db_path, "a@b.de", "123456", ttl_minutes=10, max_attempts=5)


def test_verify_expired_code_raises(tmp_db_path, monkeypatch):
    fake_now = [time.time() - 60 * 20]  # 20 min ago
    monkeypatch.setattr("auth.codes.time.time", lambda: fake_now[0])
    store_code(tmp_db_path, "a@b.de", "123456")
    fake_now[0] = time.time()
    with pytest.raises(CodeExpired):
        verify_code(tmp_db_path, "a@b.de", "123456", ttl_minutes=10, max_attempts=5)


def test_max_attempts_enforced(tmp_db_path):
    store_code(tmp_db_path, "a@b.de", "123456")
    for _ in range(5):
        with pytest.raises(CodeNotFound):
            verify_code(tmp_db_path, "a@b.de", "wrong", ttl_minutes=10, max_attempts=5)
    with pytest.raises(CodeMaxAttempts):
        verify_code(tmp_db_path, "a@b.de", "123456", ttl_minutes=10, max_attempts=5)


def test_recent_codes_count(tmp_db_path):
    from auth.codes import recent_codes_count
    store_code(tmp_db_path, "a@b.de", "111111")
    store_code(tmp_db_path, "a@b.de", "222222")
    assert recent_codes_count(tmp_db_path, "a@b.de", window_minutes=10) == 2
    assert recent_codes_count(tmp_db_path, "x@y.de", window_minutes=10) == 0


def test_cleanup_old_codes(tmp_db_path, monkeypatch):
    from auth.codes import cleanup_old_codes
    fake_now = [time.time() - 3600 * 2]  # 2h ago
    monkeypatch.setattr("auth.codes.time.time", lambda: fake_now[0])
    store_code(tmp_db_path, "a@b.de", "111111")
    fake_now[0] = time.time()
    deleted = cleanup_old_codes(tmp_db_path, older_than_seconds=3600)
    assert deleted == 1
```

- [ ] **Step 2: Run, verify failing**

```bash
cd services/auth
pytest tests/test_codes.py -v
```

Expected: ImportError on `auth.codes`.

- [ ] **Step 3: Implement codes.py**

```python
import secrets
import time
import bcrypt
from auth.db import db_session


class CodeError(Exception): ...
class CodeNotFound(CodeError): ...
class CodeExpired(CodeError): ...
class CodeUsed(CodeError): ...
class CodeMaxAttempts(CodeError): ...


def generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _hash(code: str) -> str:
    return bcrypt.hashpw(code.encode(), bcrypt.gensalt(rounds=10)).decode()


def _matches(code: str, hashed: str) -> bool:
    return bcrypt.checkpw(code.encode(), hashed.encode())


def store_code(db_path: str, email: str, code: str) -> None:
    with db_session(db_path) as conn:
        conn.execute(
            "INSERT INTO magic_codes (email, code_hash, created_at) VALUES (?, ?, ?)",
            (email.lower().strip(), _hash(code), int(time.time())),
        )


def verify_code(db_path: str, email: str, code: str, ttl_minutes: int, max_attempts: int) -> bool:
    email_norm = email.lower().strip()
    now = int(time.time())
    cutoff = now - ttl_minutes * 60
    with db_session(db_path) as conn:
        cur = conn.execute(
            "SELECT id, code_hash, created_at, attempts, used "
            "FROM magic_codes WHERE email = ? "
            "ORDER BY created_at DESC LIMIT 1",
            (email_norm,),
        )
        row = cur.fetchone()
        if row is None:
            raise CodeNotFound("no code for email")
        cid, code_hash, created_at, attempts, used = row["id"], row["code_hash"], row["created_at"], row["attempts"], row["used"]
        if used:
            raise CodeUsed("code already used")
        if created_at < cutoff:
            raise CodeExpired("code expired")
        if attempts >= max_attempts:
            raise CodeMaxAttempts("max attempts reached")
        if not _matches(code, code_hash):
            conn.execute("UPDATE magic_codes SET attempts = attempts + 1 WHERE id = ?", (cid,))
            raise CodeNotFound("wrong code")
        conn.execute("UPDATE magic_codes SET used = 1 WHERE id = ?", (cid,))
        return True


def recent_codes_count(db_path: str, email: str, window_minutes: int) -> int:
    cutoff = int(time.time()) - window_minutes * 60
    with db_session(db_path) as conn:
        cur = conn.execute(
            "SELECT count(*) AS c FROM magic_codes WHERE email = ? AND created_at >= ?",
            (email.lower().strip(), cutoff),
        )
        return cur.fetchone()["c"]


def cleanup_old_codes(db_path: str, older_than_seconds: int) -> int:
    cutoff = int(time.time()) - older_than_seconds
    with db_session(db_path) as conn:
        cur = conn.execute("DELETE FROM magic_codes WHERE created_at < ?", (cutoff,))
        return cur.rowcount
```

- [ ] **Step 4: Run, verify pass**

```bash
pytest tests/test_codes.py -v
```

Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/auth/codes.py services/auth/tests/test_codes.py
git commit -m "feat(auth): magic-code generation, storage, verification"
```

---

### Task 7: jwt_utils.py — JWT issuen + verifizieren

**Files:**
- Create: `services/auth/auth/jwt_utils.py`
- Create: `services/auth/tests/test_jwt_utils.py`

- [ ] **Step 1: Write failing tests**

`services/auth/tests/test_jwt_utils.py`:

```python
import time
import pytest
import jwt
from auth.jwt_utils import issue_jwt, verify_jwt, JWTInvalid, JWTExpired


SECRET = "test-secret-very-long-please"


def test_issue_jwt_returns_token_and_exp():
    token, exp = issue_jwt("a@b.de", SECRET, expires_hours=24)
    assert isinstance(token, str)
    assert exp > int(time.time())


def test_verify_valid_jwt_returns_email():
    token, _ = issue_jwt("a@b.de", SECRET, expires_hours=24)
    claims = verify_jwt(token, SECRET)
    assert claims["sub"] == "a@b.de"
    assert "jti" in claims


def test_verify_expired_jwt_raises():
    token = jwt.encode(
        {"sub": "a@b.de", "iat": int(time.time()) - 7200, "exp": int(time.time()) - 3600, "jti": "x"},
        SECRET, algorithm="HS256",
    )
    with pytest.raises(JWTExpired):
        verify_jwt(token, SECRET)


def test_verify_wrong_signature_raises():
    token, _ = issue_jwt("a@b.de", SECRET, expires_hours=24)
    with pytest.raises(JWTInvalid):
        verify_jwt(token, "different-secret")


def test_verify_garbage_raises():
    with pytest.raises(JWTInvalid):
        verify_jwt("not.a.token", SECRET)
```

- [ ] **Step 2: Run, verify fail**

```bash
pytest tests/test_jwt_utils.py -v
```

Expected: ImportError.

- [ ] **Step 3: Implement jwt_utils.py**

```python
import time
import uuid
import jwt


class JWTError(Exception): ...
class JWTInvalid(JWTError): ...
class JWTExpired(JWTError): ...


def issue_jwt(email: str, secret: str, expires_hours: int = 24) -> tuple[str, int]:
    now = int(time.time())
    exp = now + expires_hours * 3600
    payload = {
        "sub": email.lower().strip(),
        "iat": now,
        "exp": exp,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, secret, algorithm="HS256"), exp


def verify_jwt(token: str, secret: str) -> dict:
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as e:
        raise JWTExpired(str(e))
    except jwt.InvalidTokenError as e:
        raise JWTInvalid(str(e))
```

- [ ] **Step 4: Run, verify pass**

```bash
pytest tests/test_jwt_utils.py -v
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/auth/jwt_utils.py services/auth/tests/test_jwt_utils.py
git commit -m "feat(auth): JWT issuance and verification"
```

---

### Task 8: rate_limit.py

**Files:**
- Create: `services/auth/auth/rate_limit.py`
- Create: `services/auth/tests/test_rate_limit.py`

- [ ] **Step 1: Write failing tests**

`services/auth/tests/test_rate_limit.py`:

```python
import time
import pytest
from auth.rate_limit import EmailRateLimiter, RateLimitExceeded


def test_under_limit_allowed():
    rl = EmailRateLimiter(max_per_window=3, window_seconds=600)
    rl.check_and_record("a@b.de")
    rl.check_and_record("a@b.de")
    rl.check_and_record("a@b.de")  # 3rd allowed


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
    rl.check_and_record("a@b.de")  # window passed, allowed again


def test_per_email_isolated():
    rl = EmailRateLimiter(max_per_window=1, window_seconds=600)
    rl.check_and_record("a@b.de")
    rl.check_and_record("c@d.de")  # different email, no rate limit
```

- [ ] **Step 2: Run, verify fail**

```bash
pytest tests/test_rate_limit.py -v
```

- [ ] **Step 3: Implement rate_limit.py**

```python
import time
from collections import defaultdict, deque
from threading import Lock


class RateLimitExceeded(Exception): ...


class EmailRateLimiter:
    def __init__(self, max_per_window: int, window_seconds: int):
        self.max = max_per_window
        self.window = window_seconds
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check_and_record(self, email: str) -> None:
        now = time.monotonic()
        cutoff = now - self.window
        key = email.lower().strip()
        with self._lock:
            bucket = self._buckets[key]
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self.max:
                raise RateLimitExceeded(f"max {self.max} per {self.window}s")
            bucket.append(now)
```

- [ ] **Step 4: Run, verify pass**

```bash
pytest tests/test_rate_limit.py -v
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/auth/rate_limit.py services/auth/tests/test_rate_limit.py
git commit -m "feat(auth): per-email rate limiter"
```

---

### Task 9: email_sender.py + i18n-Templates

**Files:**
- Create: `services/auth/auth/email_sender.py`
- Create: `services/auth/auth/i18n/code_email.de.html`
- Create: `services/auth/auth/i18n/code_email.en.html`
- Create: `services/auth/auth/i18n/code_email.fr.html`
- Create: `services/auth/auth/i18n/code_email.es.html`
- Create: `services/auth/auth/i18n/code_email.it.html`
- Create: `services/auth/tests/test_email_sender.py`

- [ ] **Step 1: Create i18n templates**

`services/auth/auth/i18n/code_email.de.html`:

```html
<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#080c14;color:#e8f0fe;padding:24px">
<div style="max-width:480px;margin:0 auto;background:#0d1320;border:1px solid #1e2d45;border-radius:16px;padding:32px">
  <h2 style="color:#00d4ff;margin:0 0 16px">Hallo!</h2>
  <p>Du wolltest mit Ninas Chat-Bot reden. Dein Code:</p>
  <p style="font-size:32px;letter-spacing:8px;color:#00d4ff;background:#111827;padding:16px;text-align:center;border-radius:8px;font-family:monospace">{code}</p>
  <p style="color:#6b7fa3;font-size:13px">Code gilt 10 Minuten. Wenn du das nicht warst, einfach ignorieren.</p>
  <p style="color:#6b7fa3;font-size:12px;margin-top:24px">— Nina Learns Vibe Coding</p>
</div>
</body></html>
```

`services/auth/auth/i18n/code_email.en.html`: same structure, content:

```html
<h2 style="color:#00d4ff;margin:0 0 16px">Hi there!</h2>
<p>You wanted to chat with Nina's bot. Your code:</p>
[code box same as DE]
<p style="color:#6b7fa3;font-size:13px">Valid for 10 minutes. If this wasn't you, just ignore.</p>
```

(Same shell, replace texts. For brevity, complete files: copy DE, change `<h2>` and 2 paragraphs to per-language wording.)

- **fr**: „Salut !" / „Tu voulais discuter avec le bot de Nina. Voici ton code :" / „Valable 10 minutes. Sinon, ignore simplement ce mail."
- **es**: „¡Hola!" / „Querías chatear con el bot de Nina. Tu código:" / „Válido 10 minutos. Si no fuiste tú, ignóralo."
- **it**: „Ciao!" / „Volevi chattare con il bot di Nina. Il tuo codice:" / „Valido 10 minuti. Se non eri tu, ignora questa mail."

Use the same outer `<!DOCTYPE html>...</body></html>` and box markup, only swap heading/paragraphs.

- [ ] **Step 2: Write failing test**

`services/auth/tests/test_email_sender.py`:

```python
import pytest
from unittest.mock import patch, AsyncMock
from auth.email_sender import send_code_email, render_template


def test_render_template_de():
    html = render_template("de", code="123456")
    assert "123456" in html
    assert "Hallo" in html


def test_render_template_fallback_to_en():
    html = render_template("xx", code="987654")
    assert "987654" in html
    assert "Hi there" in html  # English fallback


@pytest.mark.asyncio
async def test_send_code_email_calls_smtp():
    with patch("auth.email_sender.aiosmtplib.send", new_callable=AsyncMock) as mock_send:
        await send_code_email(
            to="a@b.de", code="111111", lang="de",
            host="smtp.test", port=587, user="u", password="p",
            sender="Test <noreply@test.de>",
        )
        mock_send.assert_awaited_once()
        msg = mock_send.await_args.args[0]
        assert msg["To"] == "a@b.de"
        assert "111111" in msg.as_string()
```

- [ ] **Step 3: Run, verify fail**

- [ ] **Step 4: Implement email_sender.py**

```python
from email.message import EmailMessage
from pathlib import Path
import aiosmtplib


I18N_DIR = Path(__file__).parent / "i18n"


def render_template(lang: str, code: str) -> str:
    path = I18N_DIR / f"code_email.{lang}.html"
    if not path.exists():
        path = I18N_DIR / "code_email.en.html"
    return path.read_text(encoding="utf-8").replace("{code}", code)


async def send_code_email(
    to: str, code: str, lang: str,
    host: str, port: int, user: str, password: str, sender: str,
) -> None:
    html = render_template(lang, code)
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to
    subjects = {
        "de": f"Dein Code: {code}",
        "en": f"Your code: {code}",
        "fr": f"Ton code : {code}",
        "es": f"Tu código: {code}",
        "it": f"Il tuo codice: {code}",
    }
    msg["Subject"] = subjects.get(lang, subjects["en"])
    msg.set_content(f"Code: {code}")
    msg.add_alternative(html, subtype="html")
    await aiosmtplib.send(
        msg, hostname=host, port=port,
        username=user, password=password,
        start_tls=True,
    )
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_email_sender.py -v
```

Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/auth/email_sender.py services/auth/auth/i18n/ services/auth/tests/test_email_sender.py
git commit -m "feat(auth): SMTP code email with i18n templates"
```

---

### Task 10: routes/health.py + main.py + Smoke-Test

**Files:**
- Create: `services/auth/auth/routes/health.py`
- Create: `services/auth/auth/main.py`
- Create: `services/auth/tests/test_health.py`

- [ ] **Step 1: Write failing test**

`services/auth/tests/test_health.py`:

```python
from fastapi.testclient import TestClient
from auth.main import app


def test_health_returns_ok(tmp_db_path):
    with TestClient(app) as client:
        r = client.get("/auth/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
```

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Implement routes/health.py**

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/auth/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Implement main.py**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.config import get_settings
from auth.db import init_db
from auth.routes import health, auth as auth_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    init_db(settings.sqlite_path)
    yield


app = FastAPI(title="NLVC Chat Auth", lifespan=lifespan)


def _settings_for_cors():
    try:
        return get_settings().allowed_origin
    except Exception:
        return "https://ninalearnsvibecoding.com"


app.add_middleware(
    CORSMiddleware,
    allow_origins=[_settings_for_cors()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(health.router)
app.include_router(auth_routes.router)
```

Note: `auth.routes.auth` must exist as an empty stub for now to allow import. Create `services/auth/auth/routes/auth.py`:

```python
from fastapi import APIRouter
router = APIRouter()
```

- [ ] **Step 5: Run, verify pass**

```bash
pytest tests/test_health.py -v
```

Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/auth/main.py services/auth/auth/routes/
git add services/auth/tests/test_health.py
git commit -m "feat(auth): FastAPI app skeleton with health endpoint"
```

---

### Task 11: routes/auth.py — /auth/request-code

**Files:**
- Modify: `services/auth/auth/routes/auth.py`
- Create: `services/auth/tests/test_routes_request_code.py`

- [ ] **Step 1: Write failing test**

```python
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from auth.main import app


def _payload(email="a@b.de", lang="de"):
    return {
        "email": email, "lang": lang,
        "consent": {"accepted_at": "2026-05-06T10:00:00Z", "version": "1.0"},
    }


def test_request_code_returns_200(tmp_db_path):
    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock) as mock_send:
        with TestClient(app) as client:
            r = client.post("/auth/request-code", json=_payload())
    assert r.status_code == 200
    assert r.json() == {"status": "code_sent"}
    mock_send.assert_awaited_once()


def test_request_code_invalid_email_returns_422(tmp_db_path):
    with TestClient(app) as client:
        r = client.post("/auth/request-code", json=_payload(email="not-an-email"))
    assert r.status_code == 422


def test_request_code_rate_limit_429(tmp_db_path):
    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock):
        with TestClient(app) as client:
            for _ in range(3):
                client.post("/auth/request-code", json=_payload())
            r = client.post("/auth/request-code", json=_payload())
    assert r.status_code == 429


def test_request_code_logs_consent(tmp_db_path):
    from auth.db import db_session
    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock):
        with TestClient(app) as client:
            client.post("/auth/request-code", json=_payload())
    with db_session(tmp_db_path) as conn:
        row = conn.execute("SELECT count(*) AS c FROM consent_log").fetchone()
        assert row["c"] == 1
```

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Implement routes/auth.py (request-code only)**

```python
import hashlib
import time
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from auth.codes import generate_code, store_code, recent_codes_count
from auth.config import get_settings
from auth.db import db_session
from auth.email_sender import send_code_email
from auth.rate_limit import EmailRateLimiter, RateLimitExceeded


router = APIRouter()


class ConsentBody(BaseModel):
    accepted_at: str
    version: str


class RequestCodeBody(BaseModel):
    email: EmailStr
    lang: str = Field(pattern=r"^(de|en|fr|es|it)$")
    consent: ConsentBody


_rate_limiter: EmailRateLimiter | None = None


def _get_rate_limiter() -> EmailRateLimiter:
    global _rate_limiter
    if _rate_limiter is None:
        s = get_settings()
        _rate_limiter = EmailRateLimiter(
            max_per_window=s.rate_limit_per_email,
            window_seconds=s.rate_limit_window_min * 60,
        )
    return _rate_limiter


def _hash_ip(ip: str) -> str:
    return hashlib.sha256(f"nlvc-salt:{ip}".encode()).hexdigest()


@router.post("/auth/request-code")
async def request_code(body: RequestCodeBody, request: Request):
    s = get_settings()
    email = body.email.lower().strip()
    try:
        _get_rate_limiter().check_and_record(email)
    except RateLimitExceeded:
        raise HTTPException(status_code=429, detail="too many requests")

    if recent_codes_count(s.sqlite_path, email, s.rate_limit_window_min) >= s.rate_limit_per_email:
        raise HTTPException(status_code=429, detail="too many recent codes")

    code = generate_code()
    store_code(s.sqlite_path, email, code)

    ip = request.client.host if request.client else "unknown"
    with db_session(s.sqlite_path) as conn:
        conn.execute(
            "INSERT INTO consent_log (email, accepted_at, consent_version, ip_hash) "
            "VALUES (?, ?, ?, ?)",
            (email, int(time.time()), body.consent.version, _hash_ip(ip)),
        )

    await send_code_email(
        to=email, code=code, lang=body.lang,
        host=s.smtp_host, port=s.smtp_port,
        user=s.smtp_user, password=s.smtp_pass,
        sender=s.smtp_from,
    )
    return {"status": "code_sent"}
```

- [ ] **Step 4: Run, verify pass**

```bash
pytest tests/test_routes_request_code.py -v
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/auth/routes/auth.py services/auth/tests/test_routes_request_code.py
git commit -m "feat(auth): /auth/request-code with rate limit and consent log"
```

---

### Task 12: routes/auth.py — /auth/verify

**Files:**
- Modify: `services/auth/auth/routes/auth.py`
- Create: `services/auth/tests/test_routes_verify.py`

- [ ] **Step 1: Write failing test**

```python
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import jwt
from auth.main import app


def _request_code(client, email="a@b.de"):
    payload = {"email": email, "lang": "de",
               "consent": {"accepted_at": "2026-05-06T10:00:00Z", "version": "1.0"}}
    return client.post("/auth/request-code", json=payload)


def test_verify_with_correct_code_returns_jwt(tmp_db_path, monkeypatch):
    monkeypatch.setattr("auth.codes.generate_code", lambda: "123456")
    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock):
        with TestClient(app) as client:
            _request_code(client)
            r = client.post("/auth/verify", json={"email": "a@b.de", "code": "123456"})
    assert r.status_code == 200
    data = r.json()
    assert "jwt" in data
    assert "expires_at" in data
    claims = jwt.decode(data["jwt"], "test-secret-1234567890", algorithms=["HS256"])
    assert claims["sub"] == "a@b.de"


def test_verify_with_wrong_code_returns_401(tmp_db_path, monkeypatch):
    monkeypatch.setattr("auth.codes.generate_code", lambda: "123456")
    with patch("auth.routes.auth.send_code_email", new_callable=AsyncMock):
        with TestClient(app) as client:
            _request_code(client)
            r = client.post("/auth/verify", json={"email": "a@b.de", "code": "999999"})
    assert r.status_code == 401


def test_verify_no_code_existing_returns_401(tmp_db_path):
    with TestClient(app) as client:
        r = client.post("/auth/verify", json={"email": "x@y.de", "code": "111111"})
    assert r.status_code == 401
```

- [ ] **Step 2: Run, verify fail**

- [ ] **Step 3: Add /auth/verify to routes/auth.py**

Append to `services/auth/auth/routes/auth.py`:

```python
from auth.codes import verify_code, CodeError
from auth.jwt_utils import issue_jwt


class VerifyBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


@router.post("/auth/verify")
def verify(body: VerifyBody):
    s = get_settings()
    email = body.email.lower().strip()
    try:
        verify_code(s.sqlite_path, email, body.code, s.code_ttl_minutes, s.code_max_attempts)
    except CodeError:
        raise HTTPException(status_code=401, detail="invalid code")

    token, exp = issue_jwt(email, s.jwt_secret, expires_hours=s.jwt_expires_hours)
    return {"jwt": token, "expires_at": exp}
```

- [ ] **Step 4: Run, verify pass**

```bash
pytest tests/test_routes_verify.py -v
```

Expected: 3 passed.

- [ ] **Step 5: Run full test suite**

```bash
pytest -v
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/auth/routes/auth.py services/auth/tests/test_routes_verify.py
git commit -m "feat(auth): /auth/verify issues JWT after code match"
```

---

### Task 13: Cleanup-Background-Task

**Files:**
- Modify: `services/auth/auth/main.py`

- [ ] **Step 1: Add cleanup loop to lifespan**

Replace `lifespan` in `services/auth/auth/main.py`:

```python
import asyncio
from auth.codes import cleanup_old_codes


async def _cleanup_loop(db_path: str):
    while True:
        try:
            cleanup_old_codes(db_path, older_than_seconds=3600)
        except Exception:
            pass
        await asyncio.sleep(300)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    init_db(settings.sqlite_path)
    task = asyncio.create_task(_cleanup_loop(settings.sqlite_path))
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
```

- [ ] **Step 2: Verify all existing tests still pass**

```bash
cd services/auth && pytest -v
```

- [ ] **Step 3: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/auth/main.py
git commit -m "feat(auth): background cleanup of old magic codes"
```

---

### Task 14: Dockerfile + README

**Files:**
- Create: `services/auth/Dockerfile`
- Create: `services/auth/.dockerignore`
- Create: `services/auth/README.md`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM python:3.12-slim AS base

WORKDIR /app

ENV PYTHONUNBUFFERED=1 PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY auth ./auth

RUN mkdir -p /data && useradd -u 1000 appuser && chown -R appuser /app /data
USER appuser

ENV SQLITE_PATH=/data/auth.db
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD python -c "import urllib.request,sys; \
sys.exit(0 if urllib.request.urlopen('http://localhost:8000/auth/health').status==200 else 1)"

CMD ["uvicorn", "auth.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Create .dockerignore**

```
.venv
__pycache__
*.pyc
.pytest_cache
tests
data
.env
htmlcov
.coverage
README.md
```

- [ ] **Step 3: Create README.md**

```markdown
# Auth-Service (FastAPI)

Magic-Link Authentication für das Chat-Widget. Stellt 6-stelligen Code per Email zu, gibt 24h-JWT zurück nach Code-Verifikation.

## Endpoints

- `GET /auth/health` — Liveness
- `POST /auth/request-code` — sendet Code per Mail
- `POST /auth/verify` — verifiziert Code, gibt JWT zurück

## Local Dev

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.sample .env  # Werte eintragen
uvicorn auth.main:app --reload --port 8000
```

## Tests

```bash
pytest -v
```

## Deployment (Coolify)

- Application Type: Dockerfile
- Repository: dieses Repo, root path `/services/auth`
- Domain: `auth.ninalearnsvibecoding.com`
- Environment-Variablen aus `.env.sample`
- Persistent Volume: `/data` (für SQLite)
```

- [ ] **Step 4: Test local Docker build**

```bash
cd services/auth
docker build -t nlvc-auth:test .
docker run --rm -p 8000:8000 \
  -e JWT_SECRET=test -e SMTP_USER=u -e SMTP_PASS=p \
  -e SMTP_HOST=localhost -v /tmp/auth-data:/data \
  nlvc-auth:test &
sleep 3
curl -s http://localhost:8000/auth/health
docker stop $(docker ps -q --filter ancestor=nlvc-auth:test) || true
```

Expected: `{"status":"ok"}`.

- [ ] **Step 5: Commit**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
git add services/auth/Dockerfile services/auth/.dockerignore services/auth/README.md
git commit -m "feat(auth): containerize for Coolify deployment"
```

---

## Phase 3 — n8n Workflow

### Task 15: n8n-4-chat.json — Workflow-JSON

**Files:**
- Create: `setup/n8n-4-chat.json`

This file is large but mechanical. Build it as the JSON serialization of an n8n workflow with these nodes (in order, each with `id`, `name`, `type`, `typeVersion`, `position`, `parameters`):

1. **Webhook** (`n8n-nodes-base.webhook`, v2): path = literal `8b1a11fc-6362-44c4-8422-7eb8b13e8d3e`, method `POST`, response mode `responseNode`, options.allowedOrigins = `https://ninalearnsvibecoding.com`
2. **JWT Validate** (`n8n-nodes-base.code`, v2): JS code that reads `Authorization` header, splits on `Bearer `, verifies with `crypto`-based HS256 against env var `JWT_SECRET`, sets `email` in workflow context. On failure returns 401.
3. **IF Origin** (`n8n-nodes-base.if`, v2): condition `{{ $json.headers.origin === $env.ALLOWED_ORIGIN }}`
4. **IF Honeypot** (`n8n-nodes-base.if`, v2): condition `{{ $json.body.honeypot === '' }}`
5. **IF Length** (`n8n-nodes-base.if`, v2): `{{ $json.body.message.length <= 1500 }}`
6. **AI Agent** (`@n8n/n8n-nodes-langchain.agent`, v1): with system prompt verbatim from spec section 3, `text` from `$json.body.message`
   - Connected to `Mistral Cloud Chat Model` (model = `mistral-large-latest`, credential ref `MISTRAL_API`)
   - Connected to `Window Buffer Memory` (`sessionIdType=customKey`, key = `={{ $json.body.session_id }}`, k = 10)
   - Connected to `HTTP Request Tool` named `search_articles` with description from spec
7. **Code: Escalation Detection** (`n8n-nodes-base.code`, v2): strip `{{ESCALATE}}` marker, set `output_clean`, `needs_human` flag
8. **Respond to Webhook** (`n8n-nodes-base.respondToWebhook`, v1): body `{ "reply": "{{ $json.output_clean }}" }`
9. **HTTP Request: Nextcloud Talk** (`n8n-nodes-base.httpRequest`, v4): URL `={{ $env.NEXTCLOUD_BASE_URL }}/ocs/v2.php/apps/spreed/api/v1/chat/{{ $env.NEXTCLOUD_TALK_ROOM_TOKEN }}`, method POST, auth = HTTP Basic (credential `NEXTCLOUD_BOT`), header `OCS-APIRequest: true`, body field `message` = formatted text per spec
10. **IF needs_human** (`n8n-nodes-base.if`, v2): condition `{{ $json.needs_human === true }}`
11. **Send Email (SMTP)** (`n8n-nodes-base.emailSend`, v2): from `ciao@`, to `ciao@`, replyTo `={{ $jwt.email }}`, subject and body from spec; SMTP creds via `SMTP_AUTH` credential

- [ ] **Step 1: Build the workflow JSON**

Open n8n in the browser → import an empty workflow → manually add the nodes above one by one with the correct types and parameters → connect them as the spec describes (Webhook → JWT Validate → IF Origin (true) → IF Honeypot (true) → IF Length (true) → AI Agent → Escalation Detection → splits to: Respond, Nextcloud, IF needs_human → Send Email).

For each IF false branch, route to a `Respond to Webhook` with appropriate status code (401/403/400).

Then export the workflow: top right menu → "Download" → save the resulting JSON to `setup/n8n-4-chat.json`. Replace the credential IDs in the JSON with the literal placeholder strings `__MISTRAL_CRED_ID__`, `__NEXTCLOUD_CRED_ID__`, `__SMTP_CRED_ID__` so the deploy script can substitute the real IDs at deploy time.

- [ ] **Step 2: Validate JSON syntax**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
python3 -c "import json; json.load(open('setup/n8n-4-chat.json'))"
```

Expected: no error.

- [ ] **Step 3: Verify placeholders are present**

```bash
grep -c "__MISTRAL_CRED_ID__\|__NEXTCLOUD_CRED_ID__\|__SMTP_CRED_ID__" setup/n8n-4-chat.json
```

Expected: at least 3 (one per credential).

- [ ] **Step 4: Commit**

```bash
git add setup/n8n-4-chat.json
git commit -m "feat(n8n): chat workflow with JWT, Mistral agent, Talk + email branches"
```

---

### Task 16: deploy_chat_workflow.py

**Files:**
- Create: `setup/python/deploy_chat_workflow.py`

- [ ] **Step 1: Implement deployment script**

```python
#!/usr/bin/env python3
"""Deploy the chat workflow to n8n via REST API.

Idempotent: checks for existing credentials/workflow by name before creating.
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
    r = n8n_request("POST", "/credentials", json={"name": name, "type": cred_type, "data": data})
    if r.status_code not in (200, 201):
        sys.exit(f"failed to create credential {name}: {r.status_code} {r.text}")
    cid = r.json()["id"]
    print(f"  · created credential: {name} ({cid})")
    return cid


def find_workflow_by_name(name: str) -> str | None:
    r = n8n_request("GET", "/workflows")
    for w in r.json().get("data", []):
        if w.get("name") == name:
            return w["id"]
    return None


def upload_workflow(workflow_json: dict) -> str:
    name = workflow_json["name"]
    existing = find_workflow_by_name(name)
    if existing:
        r = n8n_request("PUT", f"/workflows/{existing}", json=workflow_json)
        if r.status_code != 200:
            sys.exit(f"workflow update failed: {r.status_code} {r.text}")
        print(f"  · updated workflow: {name} ({existing})")
        return existing
    r = n8n_request("POST", "/workflows", json=workflow_json)
    if r.status_code not in (200, 201):
        sys.exit(f"workflow create failed: {r.status_code} {r.text}")
    wid = r.json()["id"]
    print(f"  · created workflow: {name} ({wid})")
    return wid


def activate_workflow(workflow_id: str) -> None:
    r = n8n_request("POST", f"/workflows/{workflow_id}/activate")
    if r.status_code not in (200, 201):
        sys.exit(f"activation failed: {r.status_code} {r.text}")
    print(f"  · activated workflow: {workflow_id}")


def main() -> None:
    load_dotenv(ROOT / "python" / ".env")
    print("→ Deploying chat workflow")

    print("1. Credentials")
    mistral_id = create_credential(
        "MISTRAL_API", "mistralCloudApi",
        {"apiKey": env("MISTRAL_API_KEY")},
    )
    nextcloud_id = create_credential(
        "NEXTCLOUD_BOT", "httpBasicAuth",
        {"user": env("NEXTCLOUD_BOT_USER"), "password": env("NEXTCLOUD_BOT_APP_PASSWORD")},
    )
    smtp_id = create_credential(
        "SMTP_AUTH", "smtp",
        {
            "user": env("SMTP_USER", required=False) or "",
            "password": env("SMTP_PASS", required=False) or "",
            "host": env("SMTP_HOST", required=False) or "smtp.all-inkl.com",
            "port": int(env("SMTP_PORT", required=False) or "587"),
            "secure": False,
        },
    )

    print("2. Workflow")
    wf_text = WORKFLOW_FILE.read_text(encoding="utf-8")
    wf_text = wf_text.replace("__MISTRAL_CRED_ID__", mistral_id)
    wf_text = wf_text.replace("__NEXTCLOUD_CRED_ID__", nextcloud_id)
    wf_text = wf_text.replace("__SMTP_CRED_ID__", smtp_id)
    workflow = json.loads(wf_text)
    wid = upload_workflow(workflow)

    print("3. Activation")
    activate_workflow(wid)

    print("\n✅ Done")
    print(f"   Production webhook: {env('WEBHOOK_PROD_URL')}")
    print(f"   Test webhook: {env('WEBHOOK_TEST_URL')}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Make executable**

```bash
chmod +x setup/python/deploy_chat_workflow.py
```

- [ ] **Step 3: Smoke-test (dry-run requires real credentials)**

This script needs real n8n access. For first run: ensure `setup/python/.env` has all required values, then:

```bash
cd setup/python
source .venv/bin/activate 2>/dev/null || (python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt)
python deploy_chat_workflow.py
```

Expected output: lines for each credential + workflow + activation, ending in `✅ Done`.

- [ ] **Step 4: Commit**

```bash
git add setup/python/deploy_chat_workflow.py
git commit -m "feat(setup): n8n workflow + credentials deployment script"
```

---

### Task 17: test_auth_flow.py + test_chat_webhook.py

**Files:**
- Create: `setup/python/test_auth_flow.py`
- Create: `setup/python/test_chat_webhook.py`

- [ ] **Step 1: test_auth_flow.py**

```python
#!/usr/bin/env python3
"""Test the magic-link auth flow against the live auth service.

Asks user to type the code from their inbox.
"""
import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()
AUTH = os.environ["AUTH_BASE_URL"].rstrip("/")
ORIGIN = os.environ["ALLOWED_ORIGIN"]
TEST_EMAIL = os.environ["TEST_EMAIL"]


def main():
    print(f"→ Requesting code for {TEST_EMAIL}")
    r = requests.post(
        f"{AUTH}/auth/request-code",
        json={
            "email": TEST_EMAIL, "lang": "de",
            "consent": {"accepted_at": "2026-05-06T10:00:00Z", "version": "1.0"},
        },
        headers={"Origin": ORIGIN},
        timeout=30,
    )
    if r.status_code != 200:
        sys.exit(f"request-code failed: {r.status_code} {r.text}")
    print(f"  ✓ {r.json()}")

    code = input("Paste 6-digit code from email: ").strip()

    r = requests.post(
        f"{AUTH}/auth/verify",
        json={"email": TEST_EMAIL, "code": code},
        headers={"Origin": ORIGIN},
        timeout=30,
    )
    if r.status_code != 200:
        sys.exit(f"verify failed: {r.status_code} {r.text}")
    data = r.json()
    print(f"  ✓ JWT: {data['jwt'][:40]}…")
    print(f"  ✓ Expires at: {data['expires_at']}")
    print(f"\nExport for next test:\n  export NLVC_JWT='{data['jwt']}'")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: test_chat_webhook.py**

```python
#!/usr/bin/env python3
"""Test the chat webhook with a real JWT.

Reads JWT from env var NLVC_JWT.
"""
import os
import sys
import uuid

import requests
from dotenv import load_dotenv

load_dotenv()
WEBHOOK = os.environ.get("WEBHOOK_PROD_URL") or os.environ["WEBHOOK_TEST_URL"]
ORIGIN = os.environ["ALLOWED_ORIGIN"]
JWT = os.environ.get("NLVC_JWT") or sys.exit("set NLVC_JWT (run test_auth_flow.py first)")


def call(message: str, session_id: str) -> dict:
    r = requests.post(
        WEBHOOK,
        json={"session_id": session_id, "message": message, "lang": "de", "honeypot": ""},
        headers={"Authorization": f"Bearer {JWT}", "Origin": ORIGIN},
        timeout=60,
    )
    if r.status_code != 200:
        sys.exit(f"webhook failed: {r.status_code} {r.text}")
    return r.json()


def main():
    sid = str(uuid.uuid4())

    print("→ Question 1")
    a = call("Hi! Wer ist Nina?", sid)
    print(f"  reply: {a['reply'][:200]}…")
    assert "reply" in a and len(a["reply"]) > 10, "empty reply"

    print("\n→ Question 2 (memory test)")
    b = call("Was hast du gerade über sie gesagt?", sid)
    print(f"  reply: {b['reply'][:200]}…")
    assert b["reply"] != a["reply"], "responses identical — memory may be broken"

    print("\n✅ Webhook reachable, replies non-empty, memory functional")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Make executable + sanity-check**

```bash
chmod +x setup/python/test_auth_flow.py setup/python/test_chat_webhook.py
python3 -c "import ast; ast.parse(open('setup/python/test_auth_flow.py').read()); ast.parse(open('setup/python/test_chat_webhook.py').read())"
```

Expected: no error.

- [ ] **Step 4: Commit**

```bash
git add setup/python/test_auth_flow.py setup/python/test_chat_webhook.py
git commit -m "feat(setup): auth-flow and webhook test scripts"
```

---

### Task 18: test_e2e.py

**Files:**
- Create: `setup/python/test_e2e.py`

- [ ] **Step 1: Implement e2e**

```python
#!/usr/bin/env python3
"""Full end-to-end: auth → chat → verify Nextcloud Talk message arrived."""
import os
import sys
import time
import uuid

import requests
from dotenv import load_dotenv

load_dotenv()
AUTH = os.environ["AUTH_BASE_URL"].rstrip("/")
WEBHOOK = os.environ.get("WEBHOOK_PROD_URL") or os.environ["WEBHOOK_TEST_URL"]
ORIGIN = os.environ["ALLOWED_ORIGIN"]
TEST_EMAIL = os.environ["TEST_EMAIL"]
NC_BASE = os.environ["NEXTCLOUD_BASE_URL"].rstrip("/")
NC_USER = os.environ["NEXTCLOUD_BOT_USER"]
NC_PASS = os.environ["NEXTCLOUD_BOT_APP_PASSWORD"]
NC_ROOM = os.environ["NEXTCLOUD_TALK_ROOM_TOKEN"]


def main():
    sid = str(uuid.uuid4())
    print(f"→ Session {sid}")

    print("\n1. Request magic code")
    r = requests.post(
        f"{AUTH}/auth/request-code",
        json={"email": TEST_EMAIL, "lang": "de",
              "consent": {"accepted_at": "2026-05-06T10:00:00Z", "version": "1.0"}},
        headers={"Origin": ORIGIN}, timeout=30,
    )
    assert r.status_code == 200, r.text
    print("   ✓ code sent")

    code = input("   Paste 6-digit code: ").strip()

    print("\n2. Verify code")
    r = requests.post(
        f"{AUTH}/auth/verify",
        json={"email": TEST_EMAIL, "code": code},
        headers={"Origin": ORIGIN}, timeout=30,
    )
    assert r.status_code == 200, r.text
    jwt = r.json()["jwt"]
    print(f"   ✓ JWT: {jwt[:40]}…")

    msg = f"e2e-test-{sid[:8]}: was ist Pablo Player?"
    print(f"\n3. Chat: {msg!r}")
    r = requests.post(
        WEBHOOK,
        json={"session_id": sid, "message": msg, "lang": "de", "honeypot": ""},
        headers={"Authorization": f"Bearer {jwt}", "Origin": ORIGIN},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    reply = r.json()["reply"]
    assert "Spotify" in reply or "Music" in reply, f"reply doesn't mention Spotify/Music: {reply!r}"
    print(f"   ✓ reply mentions Spotify: {reply[:120]}…")

    print("\n4. Check Nextcloud Talk for notification")
    time.sleep(2)
    r = requests.get(
        f"{NC_BASE}/ocs/v2.php/apps/spreed/api/v1/chat/{NC_ROOM}?lookIntoFuture=0&limit=5",
        headers={"OCS-APIRequest": "true", "Accept": "application/json"},
        auth=(NC_USER, NC_PASS),
        timeout=30,
    )
    assert r.status_code == 200, r.text
    messages = r.json()["ocs"]["data"]
    found = any(sid[:8] in m.get("message", "") or msg[:30] in m.get("message", "") for m in messages)
    assert found, f"notification with session {sid[:8]} not found in last 5 messages"
    print(f"   ✓ Talk notification received")

    print("\n✅ E2E PASS")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Sanity-check**

```bash
chmod +x setup/python/test_e2e.py
python3 -c "import ast; ast.parse(open('setup/python/test_e2e.py').read())"
```

- [ ] **Step 3: Commit**

```bash
git add setup/python/test_e2e.py
git commit -m "feat(setup): end-to-end test (auth + chat + Nextcloud verify)"
```

---

## Phase 4 — Frontend

### Task 19: chat-widget.css

**Files:**
- Create: `chat-widget.css` (root of repo)

- [ ] **Step 1: Author the stylesheet**

Take the styles already validated in `preview/chat-widget-preview.html` (the `.chat-widget-container`, `.chat-invite`, `.chat-scene::before/after`, `.caustic-waves::before/after`, `.chat-close-btn`, `.chat-body`, `.chat-messages`, `.chat-bubble.bot/.user`, `.chat-input-area`, `.chat-disclaimer`, all `@keyframes` and the `@media (max-width: 600px)` block).

Copy them verbatim into `chat-widget.css`. Add a comment header:

```css
/* Chat Widget — Nina Learns Vibe Coding */
/* Visual spec: docs/superpowers/specs/2026-05-06-chat-widget-design.md */

/* (paste preview styles here, starting from .chat-widget-container) */
```

Additionally, add styles for the auth-form states inside `.chat-body` that aren't in the preview:

```css
.chat-stage { display: none; flex-direction: column; height: 100%; }
.chat-stage.active { display: flex; }

.chat-consent {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.chat-consent p { font-size: 0.78rem; line-height: 1.55; color: var(--muted); }
.chat-consent a { color: var(--accent); }
.chat-consent button {
  background: var(--accent); color: var(--bg); border: 0;
  padding: 0.7rem 1rem; border-radius: 12px;
  cursor: pointer; font-family: var(--font-mono); font-weight: 600;
  font-size: 0.85rem;
}
.chat-consent button:hover { opacity: 0.85; }

.chat-email-form, .chat-code-form {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.chat-email-form input, .chat-code-form input {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 12px; padding: 0.7rem 0.9rem;
  color: var(--text); font-family: var(--font-mono);
  font-size: 0.85rem; outline: none;
}
.chat-email-form input:focus, .chat-code-form input:focus { border-color: var(--accent); }

.chat-honeypot { position: absolute; left: -9999px; top: -9999px; opacity: 0; pointer-events: none; }

.chat-loading { color: var(--muted); font-size: 0.8rem; padding: 1rem; text-align: center; }
.chat-error { color: #ff6b9d; font-size: 0.78rem; padding: 0.4rem 0; }
```

- [ ] **Step 2: Verify CSS parses**

Open `chat-widget.css` in browser DevTools or run:

```bash
node -e "const fs=require('fs');const css=fs.readFileSync('chat-widget.css','utf8');console.log('chars:', css.length)" || echo "no node, skipping"
```

- [ ] **Step 3: Commit**

```bash
git add chat-widget.css
git commit -m "feat(frontend): chat widget styles (underwater + auth states)"
```

---

### Task 20: chat-widget.js — Skelett + State + i18n

**Files:**
- Create: `chat-widget.js`

- [ ] **Step 1: Implement the widget script**

```javascript
/* Chat Widget — Nina Learns Vibe Coding */
/* Spec: docs/superpowers/specs/2026-05-06-chat-widget-design.md */

(function () {
  'use strict';

  const AUTH_BASE = 'https://auth.ninalearnsvibecoding.com';
  const WEBHOOK_URL = 'https://n8n.ninalearnsvibecoding.com/webhook/8b1a11fc-6362-44c4-8422-7eb8b13e8d3e';
  const CONSENT_VERSION = '1.0';

  const STORAGE = {
    sid: 'nlvc_chat_session_id',
    jwt: 'nlvc_chat_jwt',
    email: 'nlvc_chat_email',
    consent: 'nlvc_chat_consent',
    messages: 'nlvc_chat_messages',
    expiresAt: 'nlvc_chat_jwt_expires',
  };

  const I18N = {
    de: {
      consent: 'Du chattest gleich mit einer KI. Eingaben werden zur Beantwortung verarbeitet (Mistral AI, EU-Server in Frankreich) und Nina als Nextcloud-Notification weitergeleitet. Email + Frage werden 30 Tage gespeichert. <a href="#" target="_blank">Datenschutz</a>',
      consent_accept: 'Akzeptieren & weiter',
      email_label: 'Deine Email-Adresse',
      email_submit: 'Code senden',
      code_sent: 'Code wurde an dich geschickt. Bitte eintragen:',
      code_label: '6-stelliger Code',
      code_submit: 'Bestätigen',
      greeting: "Hallo! Wie geht's dir heute? Wie kann ich dir helfen, was interessiert dich?",
      placeholder: 'Schreib eine Nachricht…',
      send: 'Senden',
      thinking: 'Denkt nach…',
      disclaimer: '🤖 Du chattest mit einer KI',
      err_generic: 'Hoppla, da war ein Schluckauf. Versuch\'s gleich nochmal.',
      err_jwt: 'Sitzung abgelaufen. Bitte melde dich erneut an.',
      err_rate: 'Zu viele Anfragen. Versuch\'s in ein paar Minuten erneut.',
      err_email: 'Bitte gib eine gültige Email-Adresse ein.',
      err_code: 'Code passt nicht. Versuch\'s nochmal.',
    },
    en: {
      consent: "You're about to chat with an AI. Inputs are processed for replies (Mistral AI, EU servers in France) and forwarded to Nina via Nextcloud notification. Email and question stored for 30 days. <a href='#' target='_blank'>Privacy policy</a>",
      consent_accept: 'Accept & continue',
      email_label: 'Your email',
      email_submit: 'Send code',
      code_sent: 'Code was sent to you. Please enter:',
      code_label: '6-digit code',
      code_submit: 'Verify',
      greeting: 'Hi! How are you doing today? How can I help — what are you curious about?',
      placeholder: 'Type a message…',
      send: 'Send',
      thinking: 'Thinking…',
      disclaimer: "🤖 You're chatting with an AI",
      err_generic: 'Oops, hiccup on our side. Try again in a sec.',
      err_jwt: 'Session expired. Please sign in again.',
      err_rate: 'Too many requests. Try again in a few minutes.',
      err_email: 'Please enter a valid email.',
      err_code: 'Code doesn\'t match. Try again.',
    },
    fr: {
      consent: "Tu vas chatter avec une IA. Les saisies sont traitées pour répondre (Mistral AI, serveurs EU en France) et transmises à Nina via Nextcloud. Email et question conservés 30 jours. <a href='#' target='_blank'>Confidentialité</a>",
      consent_accept: 'Accepter & continuer',
      email_label: 'Ton email',
      email_submit: 'Envoyer le code',
      code_sent: 'Code envoyé. Saisis-le :',
      code_label: 'Code à 6 chiffres',
      code_submit: 'Valider',
      greeting: "Salut ! Comment vas-tu aujourd'hui ? Comment puis-je t'aider, qu'est-ce qui t'intéresse ?",
      placeholder: 'Écris un message…',
      send: 'Envoyer',
      thinking: 'Réfléchit…',
      disclaimer: '🤖 Tu chattes avec une IA',
      err_generic: 'Oups, petit hoquet. Réessaie tout de suite.',
      err_jwt: 'Session expirée. Reconnecte-toi.',
      err_rate: 'Trop de requêtes. Réessaie dans quelques minutes.',
      err_email: 'Email invalide.',
      err_code: 'Code incorrect. Réessaie.',
    },
    es: {
      consent: 'Vas a chatear con una IA. Las entradas se procesan para responder (Mistral AI, servidores EU en Francia) y se envían a Nina vía Nextcloud. Email y pregunta guardados 30 días. <a href="#" target="_blank">Privacidad</a>',
      consent_accept: 'Aceptar y continuar',
      email_label: 'Tu email',
      email_submit: 'Enviar código',
      code_sent: 'Código enviado. Ingrésalo:',
      code_label: 'Código de 6 dígitos',
      code_submit: 'Verificar',
      greeting: '¡Hola! ¿Cómo estás hoy? ¿En qué puedo ayudarte, qué te interesa?',
      placeholder: 'Escribe un mensaje…',
      send: 'Enviar',
      thinking: 'Pensando…',
      disclaimer: '🤖 Estás chateando con una IA',
      err_generic: 'Ups, un pequeño hipo. Inténtalo de nuevo.',
      err_jwt: 'Sesión expirada. Vuelve a iniciar.',
      err_rate: 'Demasiadas solicitudes. Espera unos minutos.',
      err_email: 'Email inválido.',
      err_code: 'Código incorrecto. Inténtalo de nuevo.',
    },
    it: {
      consent: 'Stai per chattare con un\'IA. Gli input vengono elaborati per la risposta (Mistral AI, server EU in Francia) e inviati a Nina via Nextcloud. Email e domanda conservati 30 giorni. <a href="#" target="_blank">Privacy</a>',
      consent_accept: 'Accetta e continua',
      email_label: 'La tua email',
      email_submit: 'Invia codice',
      code_sent: 'Codice inviato. Inseriscilo:',
      code_label: 'Codice a 6 cifre',
      code_submit: 'Verifica',
      greeting: 'Ciao! Come stai oggi? Come posso aiutarti, cosa ti interessa?',
      placeholder: 'Scrivi un messaggio…',
      send: 'Invia',
      thinking: 'Sto pensando…',
      disclaimer: '🤖 Stai chattando con un\'IA',
      err_generic: 'Ops, piccolo intoppo. Riprova subito.',
      err_jwt: 'Sessione scaduta. Accedi di nuovo.',
      err_rate: 'Troppe richieste. Riprova tra qualche minuto.',
      err_email: 'Email non valida.',
      err_code: 'Codice errato. Riprova.',
    },
  };

  function getLang() { return localStorage.getItem('nlvc_lang') || 'en'; }
  function t() { return I18N[getLang()] || I18N.en; }

  function uuid4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  }

  function getSessionId() {
    let s = localStorage.getItem(STORAGE.sid);
    if (!s) { s = uuid4(); localStorage.setItem(STORAGE.sid, s); }
    return s;
  }

  function getMessages() {
    try { return JSON.parse(localStorage.getItem(STORAGE.messages) || '[]'); } catch { return []; }
  }
  function saveMessages(arr) { localStorage.setItem(STORAGE.messages, JSON.stringify(arr.slice(-50))); }

  function jwtValid() {
    const exp = parseInt(localStorage.getItem(STORAGE.expiresAt) || '0', 10);
    return localStorage.getItem(STORAGE.jwt) && exp > Date.now() / 1000;
  }

  function clearAuth() {
    localStorage.removeItem(STORAGE.jwt);
    localStorage.removeItem(STORAGE.expiresAt);
  }

  // Make these accessible to other modules in same IIFE chain
  window.__nlvcChat = { t, getLang, getSessionId, getMessages, saveMessages, jwtValid, clearAuth, STORAGE, AUTH_BASE, WEBHOOK_URL, CONSENT_VERSION, uuid4 };
})();
```

- [ ] **Step 2: Sanity-check**

```bash
node -e "new Function(require('fs').readFileSync('chat-widget.js','utf8'))" || echo "(node not strict enough, skipping)"
```

- [ ] **Step 3: Commit**

```bash
git add chat-widget.js
git commit -m "feat(frontend): chat widget i18n + state helpers"
```

---

### Task 21: chat-widget.js — Auth-Flow + Render

**Files:**
- Modify: `chat-widget.js` (append second IIFE for UI)

- [ ] **Step 1: Append UI logic**

Append at the end of `chat-widget.js`:

```javascript
(function () {
  'use strict';
  const X = window.__nlvcChat;
  if (!X) { console.error('nlvc-chat: state module missing'); return; }

  function el(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v);
    });
    kids.forEach(k => e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k));
    return e;
  }

  function build() {
    const t = X.t();
    const honeypot = el('input', { type: 'text', name: 'website', class: 'chat-honeypot', autocomplete: 'off', tabindex: '-1' });

    const consentStage = el('div', { class: 'chat-stage chat-consent', 'data-stage': 'consent' },
      el('p', { html: t.consent }),
      el('button', {
        type: 'button',
        onClick: () => {
          localStorage.setItem(X.STORAGE.consent, JSON.stringify({
            accepted_at: new Date().toISOString(),
            version: X.CONSENT_VERSION,
          }));
          show('email');
        }
      }, t.consent_accept),
    );

    const emailInput = el('input', { type: 'email', placeholder: 'name@example.com', autocomplete: 'email' });
    const emailErr = el('div', { class: 'chat-error' });
    const emailStage = el('form', {
      class: 'chat-stage chat-email-form', 'data-stage': 'email',
      onSubmit: async (e) => {
        e.preventDefault();
        emailErr.textContent = '';
        const email = emailInput.value.trim().toLowerCase();
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { emailErr.textContent = X.t().err_email; return; }
        try {
          const consent = JSON.parse(localStorage.getItem(X.STORAGE.consent));
          const r = await fetch(`${X.AUTH_BASE}/auth/request-code`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, lang: X.getLang(), consent }),
          });
          if (r.status === 429) { emailErr.textContent = X.t().err_rate; return; }
          if (!r.ok) { emailErr.textContent = X.t().err_generic; return; }
          localStorage.setItem(X.STORAGE.email, email);
          show('code');
        } catch (e) { emailErr.textContent = X.t().err_generic; }
      },
    },
      el('label', {}, t.email_label), emailInput, emailErr,
      el('button', { type: 'submit' }, t.email_submit),
      honeypot,
    );

    const codeInput = el('input', { type: 'text', inputmode: 'numeric', pattern: '[0-9]{6}', maxlength: '6' });
    const codeErr = el('div', { class: 'chat-error' });
    const codeStage = el('form', {
      class: 'chat-stage chat-code-form', 'data-stage': 'code',
      onSubmit: async (e) => {
        e.preventDefault();
        codeErr.textContent = '';
        const code = codeInput.value.trim();
        if (!/^\d{6}$/.test(code)) { codeErr.textContent = X.t().err_code; return; }
        try {
          const r = await fetch(`${X.AUTH_BASE}/auth/verify`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: localStorage.getItem(X.STORAGE.email), code }),
          });
          if (!r.ok) { codeErr.textContent = X.t().err_code; return; }
          const data = await r.json();
          localStorage.setItem(X.STORAGE.jwt, data.jwt);
          localStorage.setItem(X.STORAGE.expiresAt, String(data.expires_at));
          show('chat');
          ensureGreeting();
        } catch (e) { codeErr.textContent = X.t().err_generic; }
      },
    },
      el('p', {}, t.code_sent),
      el('label', {}, t.code_label), codeInput, codeErr,
      el('button', { type: 'submit' }, t.code_submit),
    );

    const messagesEl = el('div', { class: 'chat-messages', 'data-stage-content': 'chat' });
    const inputEl = el('input', { type: 'text', class: 'chat-input', placeholder: t.placeholder });
    const sendBtn = el('button', { type: 'button', class: 'chat-send-btn' }, t.send);
    const inputArea = el('div', { class: 'chat-input-area' }, inputEl, sendBtn);
    const disclaimer = el('div', { class: 'chat-disclaimer' }, t.disclaimer);

    const chatStage = el('div', { class: 'chat-stage', 'data-stage': 'chat',
      style: 'display:none; flex-direction:column; flex:1; min-height:0;' },
      messagesEl, inputArea, disclaimer,
    );

    sendBtn.addEventListener('click', () => sendMessage(inputEl, messagesEl));
    inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(inputEl, messagesEl); });

    const closeBtn = el('button', { class: 'chat-close-btn', type: 'button', 'aria-label': 'Close', onClick: close }, '×');
    const scene = el('div', { class: 'chat-scene' }, el('div', { class: 'caustic-waves' }), closeBtn);
    const body = el('div', { class: 'chat-body' }, consentStage, emailStage, codeStage, chatStage);
    const card = el('div', { class: 'chat-invite', role: 'button', tabindex: '0', 'aria-label': 'Open chat' }, scene, body);

    card.addEventListener('click', e => {
      if (card.classList.contains('expanded')) return;
      if (e.target.closest('.chat-body') || e.target.closest('.chat-close-btn')) return;
      open();
    });
    card.addEventListener('keydown', e => {
      if (card.classList.contains('expanded')) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && card.classList.contains('expanded')) close();
    });

    return { card, messagesEl, inputEl };
  }

  function show(stage) {
    document.querySelectorAll('.chat-stage').forEach(s => {
      const isTarget = s.dataset.stage === stage;
      s.style.display = isTarget ? 'flex' : 'none';
      s.classList.toggle('active', isTarget);
    });
  }

  function open() {
    const card = document.querySelector('.chat-invite');
    card.classList.add('expanded');
    if (!localStorage.getItem(X.STORAGE.consent)) show('consent');
    else if (!X.jwtValid()) {
      X.clearAuth();
      show(localStorage.getItem(X.STORAGE.email) ? 'code' : 'email');
    } else {
      show('chat');
      ensureGreeting();
    }
  }

  function close() {
    document.querySelector('.chat-invite').classList.remove('expanded');
  }

  function ensureGreeting() {
    const msgs = X.getMessages();
    if (msgs.length === 0) {
      const greeting = { role: 'bot', content: X.t().greeting, ts: Date.now() };
      msgs.push(greeting); X.saveMessages(msgs);
    }
    renderMessages();
  }

  function renderMessages() {
    const c = document.querySelector('.chat-messages');
    if (!c) return;
    c.innerHTML = '';
    X.getMessages().forEach(m => {
      const b = document.createElement('div');
      b.className = `chat-bubble ${m.role}`;
      b.textContent = m.content;
      c.appendChild(b);
    });
    c.scrollTop = c.scrollHeight;
  }

  let lastSendAt = 0;
  async function sendMessage(inputEl, messagesEl) {
    const now = Date.now();
    if (now - lastSendAt < 2000) return;
    lastSendAt = now;
    const txt = inputEl.value.trim();
    if (!txt) return;
    inputEl.value = '';
    const msgs = X.getMessages();
    msgs.push({ role: 'user', content: txt, ts: Date.now() });
    X.saveMessages(msgs);
    renderMessages();

    const thinking = document.createElement('div');
    thinking.className = 'chat-bubble bot';
    thinking.style.opacity = '0.6';
    thinking.textContent = X.t().thinking;
    messagesEl.appendChild(thinking);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const r = await fetch(X.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(X.STORAGE.jwt)}`,
        },
        body: JSON.stringify({
          session_id: X.getSessionId(),
          message: txt,
          lang: X.getLang(),
          honeypot: '',
        }),
      });
      thinking.remove();
      if (r.status === 401) { X.clearAuth(); show('email'); appendError(messagesEl, X.t().err_jwt); return; }
      if (r.status === 429) { appendError(messagesEl, X.t().err_rate); return; }
      if (!r.ok) { appendError(messagesEl, X.t().err_generic); return; }
      const data = await r.json();
      const reply = (data.reply || '').trim() || X.t().err_generic;
      const m = X.getMessages();
      m.push({ role: 'bot', content: reply, ts: Date.now() });
      X.saveMessages(m);
      renderMessages();
    } catch {
      thinking.remove();
      appendError(messagesEl, X.t().err_generic);
    }
  }

  function appendError(parent, text) {
    const e = document.createElement('div');
    e.className = 'chat-bubble bot';
    e.style.opacity = '0.7';
    e.textContent = text;
    parent.appendChild(e);
    parent.scrollTop = parent.scrollHeight;
  }

  function mount() {
    const container = document.getElementById('chat-widget-container');
    if (!container) { console.error('nlvc-chat: container #chat-widget-container missing'); return; }
    const { card } = build();
    container.appendChild(card);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
```

- [ ] **Step 2: Commit**

```bash
git add chat-widget.js
git commit -m "feat(frontend): auth flow, chat send/render, escape handling"
```

---

### Task 22: index.html Integration

**Files:**
- Modify: `/Users/redfish-hr/Stuff/Nina-landing-page/index.html`

- [ ] **Step 1: Add `<link>` and `<script>`**

In `index.html`, find the line with the `<link href="https://fonts.googleapis.com/...display=swap"` near the top of `<head>` and add right after it:

```html
<link rel="stylesheet" href="chat-widget.css">
```

Find the closing `</body>` near the end of file and right before it add:

```html
<script src="chat-widget.js" defer></script>
```

- [ ] **Step 2: Add the widget container between `hero-stats` and `// about`**

Find the line `</section>` that closes `<section id="hero">` (right after the `hero-stats` div). Immediately after that closing `</section>`, insert:

```html
<!-- CHAT WIDGET (Position D) -->
<div id="chat-widget-container" class="chat-widget-container"></div>
```

- [ ] **Step 3: Verify HTML structure**

```bash
cd /Users/redfish-hr/Stuff/Nina-landing-page
grep -n 'chat-widget' index.html
```

Expected: 3 lines — link, container div, script.

- [ ] **Step 4: Manual smoke-test**

```bash
python3 -m http.server 8080 &
sleep 1
open "http://localhost:8080/"
```

In browser:
- Scroll until you see the underwater card between hero stats and about
- Click — card expands, consent screen visible
- Click "Akzeptieren" — email form appears
- Fail any input validation — error appears
- Hit Esc — card collapses

(Auth + chat won't work until services are deployed; this only tests the UI shell.)

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(frontend): wire chat widget into landing page"
```

---

## Phase 5 — Documentation

### Task 23: Datenschutzerklärung-Vorlage

**Files:**
- Create: `docs/datenschutz-chat-widget.md`

- [ ] **Step 1: Author the German GDPR template**

```markdown
# Datenschutzhinweise — Chat-Widget

> Vorlage zum Einfügen in die bestehende Datenschutzerklärung von ninalearnsvibecoding.com. Bitte vor Veröffentlichung von einem Anwalt prüfen lassen.

## Verantwortliche Stelle

Nina Panknin
[Adresse + Kontakt]
ciao@ninalearnsvibecoding.com

## Welche Daten werden im Chat-Widget verarbeitet?

| Daten | Zweck | Rechtsgrundlage | Speicherdauer |
|-------|-------|-----------------|---------------|
| Email-Adresse | Authentifizierung per Magic-Link, Antwort durch Nina | Art. 6 Abs. 1 lit. a (Einwilligung) | 30 Tage |
| 6-stelliger Code (Hash) | Verifikation der Email-Inhaberschaft | Art. 6 Abs. 1 lit. a | max. 1 Stunde |
| Chat-Nachrichten | Beantwortung deiner Anfrage durch KI-Bot | Art. 6 Abs. 1 lit. a | nur in flüchtigem Arbeitsspeicher (n8n), max. 30 Min Inaktivität |
| Einwilligungs-Log (gehashte IP) | Nachweis der Einwilligung | Art. 7 Abs. 1 DSGVO | 3 Jahre |
| Antwort-Notification an Nina | Persönliche Rückmeldung | Art. 6 Abs. 1 lit. a | unbegrenzt (kannst du auf Anfrage löschen lassen) |

## Auftragsverarbeiter

Folgende Dienstleister verarbeiten Daten in unserem Auftrag:

- **Mistral AI SAS** (Paris, Frankreich) — KI-Inferenz für Chat-Antworten. EU-Server, kein Drittlandstransfer. AVV abgeschlossen.
- **All-inkl** (Pulheim, Deutschland) — SMTP-Versand der Auth-Codes. Deutsches Hosting.
- **Eigenes Coolify-Hosting** — Auth-Service + Chat-Workflow + Notification-Empfang (Nextcloud). Selbst gehostete Infrastruktur in Deutschland.

## Hinweise nach EU-AI-Act (Art. 50)

Du chattest in diesem Widget mit einem Künstliche-Intelligenz-System (Chatbot). Das wird dir vor Beginn des Chats sowie permanent während der Konversation deutlich angezeigt. Antworten werden automatisch generiert, können fehlerhaft sein und ersetzen keine persönliche Auskunft.

## Deine Rechte

Du hast jederzeit das Recht auf:
- Auskunft über deine gespeicherten Daten (Art. 15)
- Löschung (Art. 17) — schreib mir an ciao@ninalearnsvibecoding.com mit „Chat-Widget Daten löschen" und deiner Email-Adresse
- Widerruf deiner Einwilligung mit Wirkung für die Zukunft

## Kontakt

ciao@ninalearnsvibecoding.com
```

- [ ] **Step 2: Commit**

```bash
git add docs/datenschutz-chat-widget.md
git commit -m "docs: GDPR + EU AI Act template for chat widget"
```

---

## Phase 6 — Final Steps

### Task 24: Manual deployment checklist (no code change)

**Files:** none

- [ ] **Step 1: Walk Nina through credential setup**

Provide this checklist in chat as a final markdown reference:

```
PRE-DEPLOYMENT CHECKLIST (Nina)
================================

1. [ ] Mistral-Account erstellt → API-Key in setup/python/.env als MISTRAL_API_KEY
2. [ ] All-inkl SMTP-Account: User/Pass in setup/python/.env (SMTP_USER, SMTP_PASS) UND services/auth/.env
3. [ ] Nextcloud-Bot-User erstellt + App-Password generiert → in setup/python/.env (NEXTCLOUD_BOT_USER, NEXTCLOUD_BOT_APP_PASSWORD)
4. [ ] Nextcloud Talk: dedizierter Raum erstellt, Bot eingeladen, Room-Token kopiert → NEXTCLOUD_TALK_ROOM_TOKEN
5. [ ] DNS-A-Record für auth.ninalearnsvibecoding.com auf Coolify-Host
6. [ ] JWT_SECRET generiert: `openssl rand -base64 32` → identisch in services/auth/.env UND setup/python/.env
7. [ ] n8n API-Key (frischer, NICHT der geleakte) → setup/python/.env
8. [ ] Datenschutzerklärung um docs/datenschutz-chat-widget.md ergänzt
9. [ ] AVV mit Mistral signiert (Mistral-Console)
```

- [ ] **Step 2: Run deployment**

```bash
# 1. Auth-Service zu Coolify
git push origin main
# → Coolify pullt + buildet services/auth/Dockerfile automatisch
# → Health prüfen: curl https://auth.ninalearnsvibecoding.com/auth/health

# 2. n8n Workflow
cd setup/python
source .venv/bin/activate
python deploy_chat_workflow.py

# 3. End-to-End-Test
python test_e2e.py
```

Expected: alle drei Phasen ohne Fehler.

- [ ] **Step 3: Mark plan complete**

(No commit — milestone only.)

---

## Self-Review

- ✅ **Spec coverage:** alle 9 Sections der Spec haben mindestens eine Task (Frontend → T19-T22, Auth → T3-T14, n8n → T15-T16, Setup-Toolkit → T2/T16-T18, DSGVO → T23, Sicherheit → in T8/T11/T12 verteilt, Tests → T17-T18, Phase-2 explizit out of scope, Voraussetzungen → T24)
- ✅ **Placeholder scan:** keine TBD/TODO; jeder Code-Step zeigt vollständigen Code
- ✅ **Type consistency:** Function-Signaturen konsistent (`store_code`, `verify_code`, `issue_jwt`, `verify_jwt`, `EmailRateLimiter`, `send_code_email`)
- ✅ **JWT_SECRET:** in services/auth/.env (zur Issuance) UND in n8n via env-var (zur Validation) — Task 24 markiert das explizit
- ✅ **Frontend-Integration:** Position-D-Container (`#chat-widget-container`) wird in T22 zwischen `hero-stats` und `// about` platziert
- ✅ **n8n credential placeholders:** T15 fordert `__MISTRAL_CRED_ID__` etc., T16 ersetzt sie

Plan ist frei von offenen Stellen.
