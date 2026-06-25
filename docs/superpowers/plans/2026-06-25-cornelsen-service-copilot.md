# Cornelsen Service Center AI Copilot — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. This is a static-frontend + n8n-workflow build; verification is browser-based, not unit-test based.

**Goal:** Eine live vorführbare Web-Demo (`bewerbung/cornelsen/index.html`), die eine Kundennachricht per n8n+GPT in Kategorie/Dringlichkeit/Team/Antwortentwurf klassifiziert — mit garantiertem Offline-Fallback.

**Architecture:** Statische `index.html` (Vanilla HTML/CSS/JS, kein Build) ruft per `fetch` einen n8n-Webhook (`/webhook/cornelsen-triage`) auf, der GPT strukturiert aufruft und JSON zurückgibt. Bei Timeout (>8s) oder Fehler rendert eingebautes JS ein vorbereitetes Fallback-Ergebnis.

**Tech Stack:** HTML/CSS/JS (kein Framework), n8n (Webhook → OpenAI → Respond to Webhook), Coolify-Static-Deploy auf ninalearnsvibecoding.com.

## Global Constraints

- Optik: hell, seriös, Cornelsen-Blau (#0a3d91 / #1456b8), viel Weißraum. KEIN dunkles Neon-Theme.
- Nur synthetische Beispieldaten; keine echten Kundendaten, kein Versand, kein Login.
- Jeder Antwortentwurf trägt sichtbar „Freigabe durch Mitarbeitende erforderlich".
- 8 Kategorien exakt wie in der Spec; Dringlichkeit ∈ {Niedrig, Mittel, Hoch}.
- Webhook-Basis: `https://n8n.ninalearnsvibecoding.com`.
- Die Demo darf NIE von der Backend-Verfügbarkeit abhängen (Fallback Pflicht).

---

### Task 1: Frontend-Grundgerüst + Optik + Eingabe

**Files:**
- Create: `bewerbung/cornelsen/index.html`

**Produces:** Eine ladbare Seite mit Header, Eingabe-Textarea (`#msg`), Button „Anfrage analysieren" (`#analyze`), 3 Beispiel-Chips, leerer Ergebnis-Container (`#result`), Footer-Disclaimer.

- [ ] Seitenstruktur + CSS (helles Cornelsen-Blau-Theme, responsive, system-fonts) schreiben.
- [ ] Hero: Titel „Service Center · AI Copilot", ein Satz Einordnung, „Mensch entscheidet"-Hinweis.
- [ ] Eingabe-Textarea + Analyse-Button + 3 klickbare Beispiel-Chips (befüllen Textarea).
- [ ] Leerer `#result`-Container + Footer-Disclaimer.
- [ ] Verifizieren: Datei im Browser öffnen, Layout sauber, Chips füllen Textarea.

### Task 2: Ergebnis-Rendering + Fallback-Datensatz

**Files:**
- Modify: `bewerbung/cornelsen/index.html` (JS-Block)

**Consumes:** DOM aus Task 1.
**Produces:** JS-Funktion `renderResult(data)` und Objekt `FALLBACKS` (3 handkuratierte Beispiele + 1 generisches Sonstiges-Ergebnis).

- [ ] `renderResult(data)`: rendert Kategorie-Badge, Dringlichkeit (farbcodiert), Team, Begründung, fehlende Infos (Liste), Antwortentwurf (in Box mit „Freigabe erforderlich"-Badge).
- [ ] `FALLBACKS`-Objekt mit exakt den 3 Spec-Beispielen + generischem Fallback (Kategorie „Sonstiges / manuelle Prüfung").
- [ ] Beispiel-Chips rufen direkt `renderResult(FALLBACKS[key])` → garantiert perfektes Ergebnis ohne Backend.
- [ ] Verifizieren: Klick auf jeden der 3 Chips zeigt vollständige, korrekte Ergebnis-Karte.

### Task 3: Live-Aufruf des n8n-Webhooks mit Timeout + Fallback

**Files:**
- Modify: `bewerbung/cornelsen/index.html` (JS-Block)

**Consumes:** `renderResult`, `FALLBACKS` aus Task 2.
**Produces:** `analyze()` an `#analyze`-Button gebunden.

- [ ] `analyze()`: liest Textarea, zeigt Lade-Spinner, `fetch(WEBHOOK_URL, {method:POST, body:{message}})` mit `AbortController` (8s Timeout).
- [ ] Bei Erfolg: `renderResult(json)`. Bei Fehler/Timeout: passendes Fallback (Chip-Match per Text, sonst generisch) + dezenter Hinweis „Demo-Modus".
- [ ] `WEBHOOK_URL = https://n8n.ninalearnsvibecoding.com/webhook/cornelsen-triage` als Konstante oben.
- [ ] Verifizieren: bei falscher URL greift Fallback < 9s; Demo bleibt vorführbar.
- [ ] Commit: `feat(cornelsen): AI Copilot Web-Demo + Fallback`.

### Task 4: n8n-Workflow (Webhook → OpenAI → Respond, CORS)

**Files:**
- Create: n8n-Workflow via API (Backup-JSON nach `bewerbung/cornelsen/n8n-cornelsen-triage.json`)

**Consumes:** erwartetes JSON-Schema aus Task 2.
**Produces:** aktiver Webhook `cornelsen-triage`, der das Ergebnis-Objekt liefert.

- [ ] Workflow bauen: Webhook (POST, responseMode „responseNode") → OpenAI Chat (GPT, JSON-Modus, System-Prompt mit 8 Kategorien + Team-Mapping) → Respond to Webhook (JSON + CORS-Header `Access-Control-Allow-Origin: *`).
- [ ] OPTIONS/Preflight behandeln (CORS) oder `*`-Header an Respond-Node setzen.
- [ ] Aktivieren via REST API (MCP-Write schlägt auf dieser Instanz fehl → direkter PUT, siehe Memory n8n-write-via-direct-api).
- [ ] Workflow-JSON als Backup ins Repo legen.
- [ ] Verifizieren: `curl` gegen Webhook mit Beispielnachricht liefert valides JSON mit allen 7 Feldern.

### Task 5: Frontend↔Backend Ende-zu-Ende + Deploy

**Files:**
- Modify: `bewerbung/cornelsen/index.html` (nur falls Feldnamen angepasst werden müssen)

- [ ] Lokal: Freitext eingeben → echtes GPT-Ergebnis erscheint (oder sauberer Fallback).
- [ ] Commit + Push `feat/cornelsen-copilot` → ggf. nach `main` mergen für Coolify-Auto-Deploy.
- [ ] Verifizieren: `https://ninalearnsvibecoding.com/bewerbung/cornelsen/` lädt, 3 Chips + Freitext funktionieren live.

## Self-Review

- Spec-Abdeckung: Hero/Botschaft (T1), Ergebnis-Objekt + 8 Kategorien + Mapping + 3 Beispiele (T2), Live-GPT + Fallback (T3/T4), Deploy/URL (T5). ✓
- Keine Platzhalter; Feldnamen (`kategorie, dringlichkeit, team, begruendung, fehlende_infos, antwortentwurf, freigabe_hinweis`) konsistent zwischen T2/T3/T4. ✓
- Reihenfolge schützt die Demo: Frontend+Fallback zuerst (T1–T3), Backend danach (T4–T5). ✓
