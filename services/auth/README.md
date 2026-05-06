# Auth-Service (FastAPI)

Magic-Link Authentication für das Chat-Widget.
- Versendet 6-stelligen Code per Email
- Verifiziert Code → gibt 24h-JWT zurück
- DSGVO-konform, EU-Hosting

## Endpoints

| Methode | Pfad | Body | Response |
|---------|------|------|----------|
| GET | `/auth/health` | — | `{ "status": "ok" }` |
| POST | `/auth/request-code` | `{ email, lang, consent: { accepted_at, version } }` | `{ "status": "code_sent" }` |
| POST | `/auth/verify` | `{ email, code }` | `{ "jwt", "expires_at" }` |

## Local Development

```bash
cd services/auth
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.sample .env
# .env mit echten SMTP- und JWT-Werten füllen

uvicorn auth.main:app --reload --port 8000
```

## Tests

```bash
pytest -v
```

## Deployment auf Coolify

1. **Application erstellen**: Type "Dockerfile", Repository = dieses Repo
2. **Build context**: `/services/auth`
3. **Domain**: `auth.ninalearnsvibecoding.com`
4. **Port**: `8000`
5. **Persistent Volume**: `/data` → für SQLite-DB
6. **Environment-Variablen** aus `.env.sample`:
   - `JWT_SECRET` — `openssl rand -base64 32` (muss identisch in n8n env sein!)
   - `SMTP_USER`, `SMTP_PASS` — All-inkl SMTP-Daten
   - Rest mit Defaults aus `.env.sample` ok
7. **Healthcheck**: ist im Dockerfile, Coolify erkennt automatisch

## Sicherheit

- Codes als bcrypt-Hash gespeichert (nicht im Klartext)
- Code-Lifetime 10min, max 5 Versuche
- Rate-Limit 3 Codes pro Email pro 10min
- IP nur als SHA256-Hash im Audit-Log (kein Klartext-IP)
- CORS auf `ALLOWED_ORIGIN` beschränkt
