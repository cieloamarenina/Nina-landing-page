# Chat Widget für ninalearnsvibecoding.com — Design Spec

**Datum:** 2026-05-06
**Status:** Draft → Review

## Ziel

Ein eingebettetes Chat-Widget auf der Landing-Page, über das Besucher Fragen zu Nina, ihrem Stack, ihren Inhalten und Produkten stellen. Ein KI-Agent in n8n beantwortet live, jede Anfrage löst parallel eine Nextcloud-Talk-Notification an Nina aus. Zugang nur nach E-Mail-Verifikation per Magic-Link.

DSGVO- und EU-AI-Act-konform: keine USA-Datentransfers, dokumentierte Einwilligung, Datenminimierung, Transparenz-Hinweis.

## Architektur-Übersicht

```
┌─────────────┐    1. Email + Code      ┌─────────────────────┐
│   Browser   │◀──────────────────────▶│  Auth-Service       │
│  (Widget)   │                         │  FastAPI (Python)   │
│             │    2. JWT (24h)         │  + SQLite           │
│             │◀───────────────────────▶│  + SMTP             │
│             │                         └─────────────────────┘
│             │
│             │    3. Chat + JWT        ┌──────────────────────────┐
│             │◀──────────────────────▶ │  n8n Workflow            │
│             │                         │  - JWT-Validierung       │
│             │                         │  - Origin/Rate-Limit     │
└─────────────┘                         │  - AI Agent              │
                                        │     (Mistral Large, EU)  │
                                        │     + Memory             │
                                        │     + Article-Tool       │
                                        │  - Branch:               │
                                        │    A) Reply              │
                                        │    B) Nextcloud Talk     │
                                        └──────────────────────────┘

┌──────────────────────────────────────────┐
│  Setup-Toolkit (Python)                  │
│   ├─ deploy_chat_workflow.py             │
│   ├─ deploy_auth_service.py (Coolify)    │
│   └─ test_e2e.py                         │
└──────────────────────────────────────────┘
```

## Komponenten

### 1. Frontend-Widget

**Dateien**
- `chat-widget.css` (neu)
- `chat-widget.js` (neu)
- `index.html` (Edit: `<link>`/`<script>` einbinden, Container-Div)
- Optional Phase 2: auch in `blog.html`, `article.html`

**Visuelles Design — „Underwater + Sun"**

*Position auf der Seite*
Eingebettet **zwischen `hero-stats` und `<section id="about">`** als visueller Übergang. Mittig zentriert, eigener Container `<div class="chat-widget-container">` mit `padding: 6rem 2rem`. Scrollt mit der Seite (kein `position: fixed`). Auf Mobile gleiche Position, volle Breite mit `max-width: 320px` und Auto-Margins.

*Stage 1 — Idle (vor Klick)*
- Kleine Card mittig in ihrem Container (~280×200px desktop, ~320×220px mobile, `border-radius: 24px`)
- Hintergrund: radialer Verlauf — Tiefseeblau außen (`#0a1628`), in der Mitte oben heller Türkis-Sonnenspot (`#00d4ff` → transparent)
- Pseudo-Element für **Lichtstrahlen** (`conic-gradient` aus dem Sonnen-Spot, leicht transparent)
- Pseudo-Element für **Caustic-Wellen** am unteren Rand (animiert via `@keyframes`, ~15s loop)
- Sanftes „Atmen" der Sonne (scale 1.0 → 1.05 → 1.0, 4s Loop)
- Subtle Outer-Glow (`box-shadow: 0 0 40px rgba(0,212,255,0.2)`)
- Kein Text, kein Button — nur das Bild als Einladung

*Stage 2 — Beim Klick*
- Modal-Panel öffnet sich **zentriert auf dem Viewport** (`position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)`)
- Backdrop: `rgba(8,12,20,0.7)` mit `backdrop-filter: blur(8px)` über der gesamten Seite
- Panel-Größe: 360×540px desktop, fullscreen auf Mobile (≤600px)
- Animation: Card „fliegt" von ihrer Original-Position zum Viewport-Zentrum (~400ms ease-out, FLIP-Technik)
- Bild wird **Header** des Panels (~160px hoch), behält Sonnen-/Caustic-Animationen
- Unter dem Bild blendet der Inhalts-Bereich ein:
  - Bei erstem Öffnen: **DSGVO-Consent + Magic-Link-Email-Form**
  - Wenn JWT in localStorage: **Chat-Eingabe + Message-List**

*Stage 3 — Während Chat*
- Sonne im Header pulsiert weiter
- Caustic-Wellen am Rand des Eingabefelds
- Neue Nachrichten erscheinen mit „Bläschen-Effekt" (scale 0.8 → 1, opacity 0 → 1, 250ms)

*Stage 4 — Schließen*
- X im Header → Panel collabiert zurück zur kleinen Card
- Konversation + JWT bleiben in localStorage

**Auth-Sub-Flow im Widget**
1. Erstmaliger Klick → Consent-Bildschirm:
   ```
   Du chattest mit einem KI-Bot. Eingaben werden zur Beantwortung
   verarbeitet (Mistral AI, EU-Server in Frankreich) und Nina als
   Nextcloud-Notification weitergeleitet. Email + Frage werden 30 Tage
   gespeichert, dann gelöscht.
   [Datenschutz] [Akzeptieren & weiter]
   ```
2. Nach Consent → Email-Eingabe → POST `/auth/request-code`
3. „Code wurde an deine Mail geschickt" → 6-stelliger Code-Input
4. Code-Submit → POST `/auth/verify` → JWT in localStorage
5. Chat freigeschaltet → Bot-Begrüßung erscheint sofort

**Bot-Begrüßung** (statisch im Frontend, kein API-Call, sofort sichtbar):

| Sprache | Text |
|---------|------|
| **de** | „Hallo! Wie geht's dir heute? Wie kann ich dir helfen, was interessiert dich?" |
| **en** | „Hi! How are you doing today? How can I help — what are you curious about?" |
| **fr** | „Salut ! Comment vas-tu aujourd'hui ? Comment puis-je t'aider, qu'est-ce qui t'intéresse ?" |
| **es** | „¡Hola! ¿Cómo estás hoy? ¿En qué puedo ayudarte, qué te interesa?" |
| **it** | „Ciao! Come stai oggi? Come posso aiutarti, cosa ti interessa?" |

**Persistenter KI-Hinweis im Chat** (EU-AI-Act Art. 50 Transparenzpflicht):
- Subtiler Footer-Banner unter der Message-List, immer sichtbar:
  - de: „🤖 Du chattest mit einer KI"
  - en: „🤖 You're chatting with an AI"
  - fr: „🤖 Tu chattes avec une IA"
  - es: „🤖 Estás chateando con una IA"
  - it: „🤖 Stai chattando con un'IA"
- Style: kleine Schrift (`0.7rem`), `color: var(--muted)`, mittig zentriert, `padding: 0.4rem`
- Bot-Bubbles bekommen zusätzlich kleines KI-Avatar-Icon (Underwater-Sonne als Mini-Icon), damit jede Bot-Antwort als KI erkennbar ist

**i18n-Keys** (analog zum bestehenden `TRANSLATIONS`-Objekt):
`chat.invite_alt`, `chat.title`, `chat.consent_text`, `chat.consent_accept`, `chat.intro_email_label`, `chat.intro_email_submit`, `chat.code_sent`, `chat.code_input`, `chat.code_submit`, `chat.greeting`, `chat.placeholder`, `chat.send`, `chat.thinking`, `chat.ai_disclaimer`, `chat.error_generic`, `chat.error_jwt`, `chat.error_rate_limit`. Alle in 5 Sprachen.

**State (localStorage)**

| Key | Inhalt |
|------|--------|
| `nlvc_chat_session_id` | UUID |
| `nlvc_chat_jwt` | JWT (24h) |
| `nlvc_chat_email` | verifizierte Email |
| `nlvc_chat_consent` | `{ accepted_at, version }` |
| `nlvc_chat_messages` | `[{ role, content, ts }]` |

**Webhook-Request-Format**
```json
POST {WEBHOOK_URL}
Authorization: Bearer <JWT>
{
  "session_id": "uuid",
  "message": "Wie funktioniert Pablo Player?",
  "lang": "de",
  "honeypot": ""
}
```

**Response-Format**
```json
{ "reply": "Pablo Player ist ein Spotify-Player im Header, der Ninas Playlists ..." }
```

**Bei Fehler**
- 401 (JWT abgelaufen) → Widget zeigt erneut Magic-Link-Form
- 403 (Origin/Rate-Limit) → Fehler-Bubble „Bitte später nochmal"
- 5xx → „Hoppla, da war ein Schluckauf. Versuch's gleich nochmal."

### 2. Auth-Service (FastAPI / Python)

**Verzeichnis**: `services/auth/`

**Stack**: FastAPI, SQLite (file-based), python-jose (JWT), aiosmtplib

**Endpoints**

| Methode | Pfad | Body | Response |
|---------|------|------|----------|
| POST | `/auth/request-code` | `{ email, lang, consent: { accepted_at, version } }` | `{ status: "code_sent" }` |
| POST | `/auth/verify` | `{ email, code }` | `{ jwt, expires_at }` |
| GET | `/auth/health` | — | `{ status: "ok" }` |

**Logik**

`/auth/request-code`:
- Validiert Email-Format
- Rate-Limit: max 3 Codes pro Email pro 10min
- Generiert 6-stelligen numerischen Code
- Speichert `bcrypt(code)` + email + `now()` + `attempts=0` + `used=false` in SQLite
- Sendet Email via SMTP (HTML-Template mehrsprachig: de/en/fr/es/it nach `lang`)

`/auth/verify`:
- Findet jüngsten unbenutzten, nicht-abgelaufenen Code für Email (TTL 10min)
- Erhöht `attempts`, max 5 Versuche
- Bei Match: markiert Code als `used`, erstellt JWT mit Claims `{ sub: email, iat, exp: now+24h, jti: uuid }`
- JWT signiert mit `JWT_SECRET` (HS256)

**SQLite-Schema**
```sql
CREATE TABLE magic_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,  -- unix timestamp
  attempts INTEGER DEFAULT 0,
  used INTEGER DEFAULT 0
);
CREATE INDEX idx_codes_email ON magic_codes(email, created_at DESC);

CREATE TABLE consent_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  accepted_at INTEGER NOT NULL,
  consent_version TEXT NOT NULL,
  ip_hash TEXT NOT NULL  -- SHA256(IP + salt), für Audit ohne Klartext-IP
);
```

**Cleanup-Job** (in-process, alle 5min):
- Löscht magic_codes älter als 1h (used oder unused)

**.env (Auth-Service)**
```
JWT_SECRET=<random 32 bytes>
JWT_EXPIRES_HOURS=24
SQLITE_PATH=/data/auth.db
SMTP_HOST=smtp.all-inkl.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Nina Learns Vibe Coding <ciao@ninalearnsvibecoding.com>"
ALLOWED_ORIGIN=https://ninalearnsvibecoding.com
RATE_LIMIT_PER_EMAIL=3
RATE_LIMIT_WINDOW_MIN=10
```

**Deployment**: Docker-Container in Coolify, eigene Subdomain `auth.ninalearnsvibecoding.com`. CORS auf `ALLOWED_ORIGIN` beschränkt.

### 3. n8n Workflow `setup/n8n-4-chat.json`

**Nodes (in dieser Reihenfolge)**

1. **Webhook Trigger** (POST, CORS für `https://ninalearnsvibecoding.com`, Methods: POST, OPTIONS)

2. **JWT-Validierung** (Code Node, JS):
   - Liest `Authorization: Bearer <token>`
   - Verifiziert Signatur mit `JWT_SECRET` (env-var in n8n)
   - Prüft `exp`
   - Bei Fehler: 401 + stop
   - Bei Erfolg: legt `email` aus JWT in Workflow-Context

3. **Origin-Check** (IF Node)
   - `{{ $json.headers.origin === 'https://ninalearnsvibecoding.com' }}`
   - False → 403

4. **Rate-Limit-Check** (Code Node mit n8n Static Data):
   - In-memory Map `email → [timestamps]`
   - Max 30 req/h pro Email
   - Bei Überschreitung: 429

5. **Honeypot-Check** (IF Node)
   - `{{ $json.body.honeypot === '' }}`
   - Andernfalls: silent 200 OK ohne Verarbeitung

6. **Message-Length-Check** (IF Node)
   - `{{ $json.body.message.length <= 1500 }}`

7. **AI Agent** (Langchain Agent Node)
   - **Modell**: Nativer **Mistral Cloud Chat Model**-Node, Modell `mistral-large-latest` (Credential: `MISTRAL_API`)
   - **Memory**: Window Buffer Memory, Key = `{{ $json.body.session_id }}`, Window = 10
   - **Email** kommt aus JWT-Claim `sub` (im Origin-Check-Node in Workflow-Context gesetzt), NICHT aus Request-Body
   - **System-Prompt** (statisch im Node):
     ```
     Du bist der freundliche AI-Assistent auf ninalearnsvibecoding.com — der
     Lern- und Portfolio-Site von Nina. Antworte in {{ $json.body.lang }}.

     Über Nina:
     - Lernt n8n & Vibecoding (KI-gestütztes Coden), baut öffentlich
     - AI Analyst & AI Consultant aus Berlin
     - Stack: Coolify (Hosting), All-inkl (Domain), Postgres, NocoDB, n8n
     - Aktuelle Projekte: Lern-Site, LinkedIn-Workflow, Mail-Workflow
     - LinkedIn: https://www.linkedin.com/in/ninapankninberlin/

     Was die Site bietet:
     - Blog mit Vibe-Coding-Artikeln (Suche via Tool verfügbar)
     - Pablo Player: Spotify-Music-Player im Header mit Ninas Playlists
       (z.B. „Nina is coding") + kuratierten Spotify-Playlists (z.B. Venice, Alesis)
     - Mehrsprachig (de/en/fr/es/it)

     Tonalität: locker, ehrlich, technisch wenn nötig. Sei konkret, nicht
     marketing-blumig. Erfinde keine Features, die du nicht aus dem Tool
     ableiten kannst.

     Verhalten:
     - Wenn jemand mehr über Nina als Person erfahren möchte, weise auf
       LinkedIn hin: https://www.linkedin.com/in/ninapankninberlin/
     - Wenn du eine Frage NICHT beantworten kannst, beginne deine Antwort
       mit dem Marker `{{ESCALATE}}` (für Workflow-Detection) gefolgt von:
       "Diese Frage kann ich nicht sicher beantworten — Nina meldet sich
       persönlich bei dir auf {{ $jwt.email }}."
     ```
   - **Tool**: `search_articles` — HTTP-Request-Tool, fetcht `https://ninalearnsvibecoding.com/articles.json`, filtert nach Stichwort (case-insensitive Substring auf Titel + Excerpt + Sprache), gibt Top-3 zurück (Titel, Slug, Excerpt). Tool-Description: „Sucht in Ninas Blog-Artikeln. Nutze, wenn die Frage zu konkreten Vibe-Coding-Themen, Tools oder Konzepten passt."

8. **Escalation-Detection** (Code Node)
   - Prüft ob AI-Output mit `{{ESCALATE}}` beginnt
   - Strippt den Marker aus der Antwort (Visitor sieht ihn nicht)
   - Setzt Flag `needs_human = true|false` in Workflow-Context

9. **Split** (drei parallele Branches)

   **Branch A — Respond to Webhook** (immer)
   - Body: `{ "reply": "{{ $json.output_clean }}" }` (ohne `{{ESCALATE}}`-Marker)
   - Headers: `Access-Control-Allow-Origin: https://ninalearnsvibecoding.com`

   **Branch B — Nextcloud Talk Bot** (immer, jede Nachricht)
   - HTTP-Request an Nextcloud Talk API: `POST /ocs/v2.php/apps/spreed/api/v1/chat/{room-token}`
   - Auth: Basic Auth mit Bot-User-Account / App-Password (Credential: `NEXTCLOUD_BOT`)
   - Header: `OCS-APIRequest: true`
   - Body:
     ```
     {{ needs_human ? '⚠️ NEEDS HUMAN REPLY' : '💬 Chat-Nachricht' }}
     Email: {jwt.email}
     Sprache: {lang}
     Frage: {message}
     ────
     AI-Antwort: {output_clean}
     Session: {session_id}
     ```

   **Branch C — Email an `ciao@ninalearnsvibecoding.com`** (NUR bei `needs_human = true`)
   - SMTP-Send via `Send Email` Node (gleiche SMTP-Credentials wie Auth-Service)
   - **From**: `Chat-Bot <ciao@ninalearnsvibecoding.com>`
   - **To**: `ciao@ninalearnsvibecoding.com`
   - **Reply-To**: `{jwt.email}` ← so kannst du in der Mail direkt auf „Antworten" klicken
   - **Subject**: `[Chat-Widget] Bot braucht Hilfe — {jwt.email}`
   - **Body** (HTML):
     ```
     Hi Nina,

     der Chat-Bot konnte einer Anfrage nicht weiterhelfen. Bitte selbst zurückmelden:

     Visitor:   {jwt.email}
     Sprache:   {lang}
     Frage:     {message}

     Bot-Antwort: {output_clean}
     Session:     {session_id}

     Klick "Antworten" und schreib direkt zurück — Reply-To zeigt auf den Visitor.
     ```

10. **Error-Branch** (Wenn AI-Agent fehlschlägt)
    - Trotzdem Nextcloud-Notification + Email an `ciao@` mit Fehler-Hinweis
    - Reply an Webhook: „Ich kann gerade nicht antworten. Nina hat deine Frage erhalten und meldet sich bei dir."

### 4. Setup-Toolkit (Python)

**Verzeichnis**: `setup/python/`

**Dateien**
```
setup/python/
├── .env.sample
├── .gitignore                  (lokal)
├── requirements.txt
├── deploy_chat_workflow.py
├── deploy_auth_service.py      (build + push Docker, Coolify-Trigger)
├── test_auth_flow.py
├── test_chat_webhook.py
└── test_e2e.py                 (Auth → Chat → Verify Nextcloud)
```

**`.env.sample`**
```
# n8n
N8N_BASE_URL=https://n8n.ninalearnsvibecoding.com
N8N_API_KEY=
WEBHOOK_TEST_URL=https://n8n.ninalearnsvibecoding.com/webhook-test/8b1a11fc-6362-44c4-8422-7eb8b13e8d3e
WEBHOOK_PROD_URL=https://n8n.ninalearnsvibecoding.com/webhook/8b1a11fc-6362-44c4-8422-7eb8b13e8d3e

# Auth-Service
AUTH_BASE_URL=https://auth.ninalearnsvibecoding.com
JWT_SECRET=
COOLIFY_API_URL=
COOLIFY_API_TOKEN=
COOLIFY_AUTH_APP_UUID=

# Mistral (AI-Provider)
MISTRAL_API_KEY=
MISTRAL_MODEL=mistral-large-latest

# Nextcloud Talk
NEXTCLOUD_BASE_URL=https://cloud.ninalearnsvibecoding.com
NEXTCLOUD_BOT_USER=nina-bot
NEXTCLOUD_BOT_APP_PASSWORD=
NEXTCLOUD_TALK_ROOM_TOKEN=

# Sicherheit
ALLOWED_ORIGIN=https://ninalearnsvibecoding.com

# Test
TEST_EMAIL=ninapankninberlin@gmail.com
```

**`.gitignore`** (root, ergänzt)
```
setup/python/.env
services/auth/.env
services/auth/data/
__pycache__/
*.pyc
.venv/
```

**`deploy_chat_workflow.py`** — vollautomatisches Setup gegen n8n REST API
1. Lädt `.env`
2. Validiert dass `N8N_API_KEY`, `MISTRAL_API_KEY`, `NEXTCLOUD_*` gesetzt sind
3. **Legt Credentials in n8n an** (idempotent, prüft auf existierenden Namen):
   - `MISTRAL_API` (Type `mistralCloudApi`) → POST `/api/v1/credentials`
   - `NEXTCLOUD_BOT` (Type `httpBasicAuth`, User+App-Password) → POST `/api/v1/credentials`
4. Liest `setup/n8n-4-chat.json`, ersetzt Credential-Platzhalter durch echte IDs
5. POST `/api/v1/workflows` (oder PATCH wenn `name` schon existiert, idempotent)
6. Aktiviert: POST `/api/v1/workflows/{id}/activate`
7. Output: Workflow-ID + Webhook-URL für Test und Production

**`test_chat_webhook.py`** — Curl-äquivalent in Python für Webhook-Tests (siehe Curl-Beispiele in Section 7).

**`test_e2e.py`** — End-to-End-Test
1. POST `/auth/request-code` mit `TEST_EMAIL`
2. (Mock-Mode für CI: SMTP capture, sonst manueller Code-Eintrag)
3. POST `/auth/verify` → JWT
4. POST Chat-Webhook mit JWT → erwartet `reply`
5. Prüft Nextcloud-Talk-Raum auf neue Bot-Message (via API)
6. Zweite Chat-Message mit gleicher session_id → prüft Memory-Funktion

### 5. DSGVO + EU-AI-Act Compliance

**Datenfluss-Inventar**

| Daten | Wo gespeichert | Dauer | Rechtsgrundlage |
|-------|----------------|-------|-----------------|
| Email | SQLite (Auth) | 30 Tage | Einwilligung |
| Code-Hash | SQLite (Auth) | 1h | Einwilligung |
| Consent-Log | SQLite (Auth) | 3 Jahre | gesetzliche Pflicht |
| Chat-History | n8n in-memory | bis Restart / 30min idle | Einwilligung |
| Notification | Nextcloud (DE-Host) | unbegrenzt (Nina löscht) | Einwilligung |
| Prompt-Daten | Mistral AI (FR/EU) | 0 (kein Training, kein Retention nach API-Call) | AVV |

**EU-AI-Act-Maßnahmen** (Limited-Risk gem. Art. 50)
- Eindeutiger Hinweis im Consent: „Du chattest mit einem KI-Bot"
- AI-Output mit subtilem KI-Marker (Bot-Avatar oder Disclaimer-Footer)

**Mistral-Setup**
- Account bei mistral.ai (FR-Firma, AVV unter EU-Recht)
- API-Key generiert für Workspace
- AVV/DPA in Mistral-Console heruntergeladen und unterschrieben
- Kein Schrems-II-Risiko, kein Daten-Transfer in Drittländer
- Mistral-Default: keine Speicherung der API-Inputs nach Inferenz, kein Training auf API-Daten

**Datenschutzerklärung**
- Vorlage-Markdown wird im Spec-Repo unter `docs/datenschutz-chat-widget.md` mitgeliefert
- Nina muss sie in ihre bestehende Datenschutzerklärung integrieren / ihren Anwalt schauen lassen

**Recht auf Löschung**
- MVP: Manuell — Nina kann SQLite-Eintrag und Nextcloud-Message löschen
- Phase 2: `/auth/delete-account` Endpoint

### 6. Sicherheits-Layer (Zusammenfassung)

| Schicht | Maßnahme |
|---------|----------|
| Auth | Magic-Link Email-Verifikation (kein Passwort) |
| Token | JWT HS256, 24h Lifetime, signiert |
| Webhook | JWT-Validierung als erste Node |
| Webhook | Origin-Check `https://ninalearnsvibecoding.com` |
| Webhook | Rate-Limit 30 req/h pro Email (in-memory) |
| Webhook | Honeypot-Field (`name="website"`, hidden) |
| Webhook | Hard-Limit Message 1500 Zeichen |
| Auth-Service | Rate-Limit 3 Codes/Email/10min |
| Auth-Service | Code 6-stellig, 10min TTL, max 5 Versuche |
| Auth-Service | bcrypt-Hash für Codes |
| Auth-Service | CORS auf `ALLOWED_ORIGIN` |
| Transport | TLS überall (Coolify + Cloudflare) |

**Bewusst _nicht_ drin:** Basic Auth auf Webhook (im Browser-Frontend Theater), Cloudflare Turnstile (Phase 2), Postgres-Persistierung Chat (Phase 2), DDoS-Schutz auf Layer 7 (Cloudflare-Standard reicht für MVP).

### 7. Test-Plan

| Test | Wie |
|------|-----|
| Auth-Service Health | `GET /auth/health` → 200 |
| Magic-Link Flow | `test_auth_flow.py` mit Mock-SMTP |
| JWT-Validierung | Webhook ohne JWT → 401, mit ungültigem JWT → 401 |
| Origin-Check | curl ohne Origin-Header → 403 |
| Rate-Limit | 31 Calls in 1h → 429 |
| AI-Antwort | Test-Frage → reply non-empty |
| Memory funktioniert | 2 Messages, gleiche session_id, zweite referenziert erste |
| Nextcloud-Notification | nach Test-Call: GET Talk-Raum → neue Bot-Message |
| Mehrsprachig | `lang=fr` → AI-Antwort in FR |
| DSGVO-Consent | ohne Consent → kein Code-Versand |
| Frontend visuell | manuell: Widget öffnen, Animation prüfen, Mobile-Layout (≤600px) |

### 7b. Curl-Referenz (manuelle Tests)

**Magic-Code anfordern**
```bash
curl -X POST https://auth.ninalearnsvibecoding.com/auth/request-code \
  -H "Content-Type: application/json" \
  -H "Origin: https://ninalearnsvibecoding.com" \
  -d '{
    "email": "ninapankninberlin@gmail.com",
    "lang": "de",
    "consent": { "accepted_at": "2026-05-06T10:00:00Z", "version": "1.0" }
  }'
```

**Code verifizieren → JWT erhalten**
```bash
curl -X POST https://auth.ninalearnsvibecoding.com/auth/verify \
  -H "Content-Type: application/json" \
  -H "Origin: https://ninalearnsvibecoding.com" \
  -d '{ "email": "ninapankninberlin@gmail.com", "code": "483921" }'
```

**Chat-Webhook callen mit JWT**
```bash
JWT="eyJhbGciOi..."
curl -X POST https://n8n.ninalearnsvibecoding.com/webhook/8b1a11fc-6362-44c4-8422-7eb8b13e8d3e \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -H "Origin: https://ninalearnsvibecoding.com" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Wie funktioniert Pablo Player?",
    "lang": "de",
    "honeypot": ""
  }'
```

**Test-Webhook (nur aktiv wenn Workflow im n8n-Editor offen + „Listen for Test Event")**: gleicher Aufruf, URL mit `/webhook-test/...` statt `/webhook/...`.

**Negative Tests** (alle sollen fehlschlagen):
- Ohne JWT → 401
- Falscher/abgelaufener JWT → 401
- Ohne Origin-Header → 403
- Honeypot ausgefüllt → silent 200 (Bot-Detection, AI antwortet nicht)
- Message > 1500 Zeichen → 400

### 8. Phase-2 Backlog (out of scope)

- Postgres-Chat-Persistierung (`chat_sessions`, `chat_messages`)
- NocoDB-View für Chat-Übersicht
- Cloudflare Turnstile als zusätzlicher Bot-Schutz
- Per-Session-Summary durch zweiten LLM-Call
- `/auth/delete-account`-Endpoint
- Returning-Visitor-Erkennung (gleiche Email = vorherige Konversation laden)
- Embedding-basierte Article-Suche (pgvector)
- Magic-Link auch als klickbarer Link (statt nur Code)
- Admin-Dashboard für Nina (Chats anschauen / löschen)

### 9. Offene Voraussetzungen (von Nina vor Implementation einzurichten)

**Blocker für Implementation:**
1. **Mistral-Account** auf [mistral.ai](https://mistral.ai) + API-Key generiert (Console → API Keys)
2. **Nextcloud-Bot-User** angelegt + App-Password generiert + dedizierter Talk-Raum erstellt + Bot-User in Raum eingeladen + Room-Token notiert
3. **SMTP-Zugang** All-inkl: Host, Port, User, Password für Absender `ciao@ninalearnsvibecoding.com`
4. **Coolify-Subdomain** für Auth-Service: `auth.ninalearnsvibecoding.com` (DNS-A-Record + Coolify-Application-Slot)
5. **n8n-API-Key** in n8n-Settings generiert (frischer Key, nur in lokale `.env`)

**Können parallel zur Implementation passieren:**
6. **Datenschutzerklärung** auf der Site um Chat-Abschnitt ergänzen (Vorlage liefere ich als `docs/datenschutz-chat-widget.md`)
7. **AVV/DPA** mit Mistral AI signieren (Download im Mistral-Dashboard)
