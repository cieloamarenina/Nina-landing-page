# n8n Workflow-Patterns · Cheat-Sheet

Alle 3 produktiven Workflows aus der easycosmetic-Bewerbung im Detail.
Übertragbar 1:1 auf eigene Workflows (z.B. Marco-Abschlussprojekt).

---

## 🎯 Workflow 1 · Page-Visit Tracker

**Use Case:** Jemand öffnet meine Bewerbungs-Seite → ich krieg Telegram-Push.

**Webhook-URL:** `POST /webhook/page-visit-easycosmetic`

### Node-Reihenfolge (Top-Down im Canvas)

```
1. Webhook · Page Visit                  (n8n-nodes-base.webhook)
   └─► splittet in 2 Pfade:
       ├─ a) Respond 204                 (n8n-nodes-base.respondToWebhook)
       │     ↳ antwortet SOFORT, blockiert Browser nicht
       │
       └─ b) Normalize Payload           (n8n-nodes-base.set)
              ↳ baut body → flat fields
              ↓
              IF · Is First Visit?       (n8n-nodes-base.if)
              ↓
              ┌────────────┴─────────────┐
            TRUE                       FALSE
              ↓                          ↓
        Telegram · First Visit    Telegram · Repeat Visit
        (laute Notification)      (stille, disable_notification: true)
```

### Wichtige Parameter

**Webhook:**
- HTTP Method: `POST`
- Path: `page-visit-easycosmetic`
- Response Mode: `Using 'Respond to Webhook' Node`
- Allowed Origins: `https://ninalearnsvibecoding.com` (CORS)

**Set Node:**
- Felder: `page`, `timestamp`, `referrer`, `source`, `user_agent`, `screen`, `language`, `visitor_token`, `visit_count`, `ip_hint`
- Werte: aus `$json.body.<field>` mit Fallbacks

**IF Node:**
- Condition: `$json.visit_count` equals `1` (Number)

**Telegram Nodes:**
- Chat ID: `486622230` (Nina)
- Parse Mode: `Markdown`
- Erster Visit: full notification mit allem Kontext
- Repeat: `disable_notification: true` (kein Sound)

### Pattern dahinter

🧠 **Respond First, Process Later** — der `respondToWebhook` ist die ERSTE Aktion.
Browser bekommt sofort `204`, kein Timeout. Tracking läuft asynchron im Hintergrund.

🧠 **Conditional Notification** — erster Visit = laut, Wiederholungen = stumm.
Du wirst nicht von 50 Pushs erschlagen wenn jemand 10× auf F5 drückt.

---

## 🎯 Workflow 2 · QR-Code Generator

**Use Case:** Browser fragt QR-Bild an → wir holen's server-side und liefern es zurück.

**Webhook-URL:** `GET /webhook/qr-easycosmetic`

### Node-Reihenfolge

```
1. Webhook · QR Request           (httpMethod: GET)
   ↓
2. Parse Query Params             (Set)
   ↳ data, size, color, bgcolor mit Defaults
   ↓
3. Fetch QR Image                 (HTTP Request)
   ↳ holt von api.qrserver.com
   ↳ responseFormat: 'file', outputPropertyName: 'qrImage'
   ↓
4. Respond QR Image               (Respond to Webhook)
   ↳ respondWith: 'binary'
   ↳ Headers: Content-Type, Cache-Control, CORS
```

### Wichtige Parameter

**HTTP Request Node:**
- URL: `=https://api.qrserver.com/v1/create-qr-code/?size={{$json.size}}x{{$json.size}}&data={{encodeURIComponent($json.data)}}&...`
- Response Format: `file`
- Output Property: `qrImage`

**Respond Node:**
- Respond With: `Binary`
- Body: `={{ $binary.qrImage }}`
- Headers:
  - `Content-Type: image/png`
  - `Cache-Control: public, max-age=86400` (1 Tag Cache)

### Pattern dahinter

🧠 **API als Proxy** — externer Service wird über deine n8n-URL ausgeliefert.
Vorteile: eigene URL in Source-Code, Caching möglich, später austauschbar
ohne Frontend-Änderung.

🧠 **Binary-Response** — n8n kann nicht nur JSON zurückgeben, sondern auch
PNG/PDF/CSV. Key: `responseFormat: 'file'` im HTTP Request + `respondWith: 'binary'` im Respond.

---

## 🎯 Workflow 3 · CV-Download mit Tracking

**Use Case:** Jemand klickt CV-Download oder scannt QR → CV wird geliefert, ich krieg Push „CV runtergeladen".

**Webhook-URL:** `GET /webhook/cv-easycosmetic`

### Node-Reihenfolge

```
1. Webhook · CV Request                   (GET)
   ↓
2. Capture Visit Context                  (Set)
   ↳ source, user_agent, referrer, timestamp, ip_hint
   ↓
   ┌──────────────────┴──────────────────┐
   ↓                                     ↓
3a. Telegram · Download Alert       3b. Fetch CV-PDF
    (sofort Push an Nina)                (HTTP Request zur Live-PDF-URL)
                                          ↓
                                     4. Respond PDF
                                          (Respond to Webhook · binary)
                                          ↳ Content-Disposition: attachment
```

### Wichtige Parameter

**HTTP Request Node:**
- URL: `https://ninalearnsvibecoding.com/bewerbung/easycosmetic/cv-nina-panknin.pdf`
- Response Format: `file`
- Output Property: `pdfFile`

**Respond Node:**
- Headers:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="CV-Nina-Panknin.pdf"`
  - `Cache-Control: public, max-age=3600`

### Pattern dahinter

🧠 **Parallele Branches** — Telegram-Push + PDF-Fetch laufen GLEICHZEITIG aus
demselben Set-Node. Spart Zeit.

🧠 **Tracking nebenher** — der eigentliche User-Flow (CV-Download) wird nicht
verzögert durch Tracking. Telegram läuft asynchron.

🧠 **Filename via Content-Disposition** — Browser benennt den Download nicht
nach der URL (wäre `cv-easycosmetic`), sondern nach unserem Header
(`CV-Nina-Panknin.pdf`). Sauberer für den User.

---

## 🏗️ Übertragbare Patterns für Marco-Workflow

Für deinen Bewerbungs-Workflow (Job-Scraper → AI → Approval → SMTP):

### 1. Schedule Trigger statt Webhook
- Cron: `0 11,15,20 * * *` (3× täglich)

### 2. Respond-First-Pattern bei Approval-Webhook
```
Telegram-Callback → respondToWebhook (sofort 200) → IF (send/discard) → SMTP/NocoDB
```

### 3. Error-Trigger separat
```
Error Trigger Node → Telegram Alarm + NocoDB-Log
```
→ Separater Workflow, läuft wenn ein produktiver Workflow crasht.

### 4. Sticky Notes für Doku
**Marco bewertet „Doku & Benennung":**
- Pro Workflow-Sektion eine Sticky Note auf Deutsch
- Erklärt WAS der Block tut und WARUM (DSGVO? Sicherheit? Performance?)
- Verschiedene Farben für verschiedene Layers (Trigger, Logic, Output, Monitoring)

### 5. Naming Convention
- Workflow-Namen mit Prefix: `🎯 BEWERBUNG · ...` oder `📊 MONITORING · ...`
- Findbar via n8n-Search

### 6. Header-Auth für interne Webhooks
- Bei Webhooks die nicht öffentlich sind: `Header Auth` als Authentication
- Token in n8n-Credential, nicht im Workflow-Body

### 7. CORS-Whitelist bei öffentlichen Webhooks
- `Allowed Origins: https://deine-domain.com` (nicht `*`)
- Schutz gegen Cross-Site-Spam

### 8. Markdown im Telegram-Text
- `parse_mode: 'Markdown'`
- Fett für wichtige Werte: `*Visit:* #{{ $json.visit_count }}`
- Code-Blöcke für IDs: `` `{{ $json.visitor_token }}` ``

### 9. NocoDB-Logging für Audit-Trail
- Jeder Execution → eine Zeile in NocoDB
- Felder: execution_id, timestamp, status, payload, response
- Marco-Argument: „EU AI Act Audit-Trail nachweisbar"

### 10. JSON-Workflow im Git-Repo
- Export pro Workflow als `*.json` → in Git committen
- Versions-Diff möglich, Backup, Reproduzierbar
- Bei Demo: live JSON-Datei vs. n8n-UI gleichzeitig zeigen

---

## 🧪 Test-Commands

### Page-Visit testen
```bash
curl -X POST https://n8n.ninalearnsvibecoding.com/webhook/page-visit-easycosmetic \
  -H "Content-Type: application/json" \
  -d '{"page":"test","visit_count":1,"source":"manual-test"}'
```

### QR-Code testen
```bash
curl -o /tmp/qr.png "https://n8n.ninalearnsvibecoding.com/webhook/qr-easycosmetic?data=https://test.com"
```

### CV-Download testen
```bash
curl -o /tmp/cv.pdf "https://n8n.ninalearnsvibecoding.com/webhook/cv-easycosmetic?src=manual-test"
```

---

## 📊 Architektur-Übersicht (für Präsentation)

```
                ┌──────────────────────────────┐
                │   Frontend (HTML/JS)         │
                │   bewerbung/easycosmetic/    │
                └───────────┬──────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
       page-visit       qr-code       cv-download
       (POST)           (GET)         (GET)
              │             │             │
              ▼             ▼             ▼
              ┌─────────────────────────────────┐
              │   n8n on Hetzner/Coolify        │
              │   - 3 aktive Workflows          │
              │   - Telegram-Notifications      │
              │   - CORS-Whitelist + Security   │
              └─────────────┬───────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Telegram an     │
                  │  Nina (Chat ID)  │
                  └──────────────────┘
```

---

**Source:** Bewerbung easycosmetic · 17.05.2026
**Live-URL:** https://ninalearnsvibecoding.com/bewerbung/easycosmetic/
**n8n:** https://n8n.ninalearnsvibecoding.com (Workflows mit Prefix `🎯 EASYCOSMETIC`)
