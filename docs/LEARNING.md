# Learning-Seite — Design, Datenmodell & 4-Phasen-Plan

> Neuer Menüpunkt **„Learning"** auf ninalearnsvibecoding.com — ein nach Themen sortiertes Lern-Nachschlagewerk (Claude Code, n8n, RSS, AI-Skills …) in **allen 5 Sprachen** (EN/DE/FR/IT/ES).
> Stand: 2026-05-31

## Inhaltsverzeichnis

1. [Überblick](#1-überblick)
2. [Architektur](#2-architektur)
3. [Datenmodell (`learnings.json`)](#3-datenmodell-learningsjson)
4. [Kategorien & Content-Bestand](#4-kategorien--content-bestand)
5. [Mehrsprachigkeit (i18n)](#5-mehrsprachigkeit-i18n)
6. [`.env` / `.env.example`](#6-env--envexample)
7. [4-Phasen-Plan](#7-4-phasen-plan)
8. [Deploy & Test](#8-deploy--test)
9. [Neues Learning hinzufügen (Anleitung)](#9-neues-learning-hinzufügen-anleitung)

---

## 1. Überblick

- **Was:** Eigenständige Unterseite `learning.html`, verlinkt im Hauptmenü als „Learning".
- **Look:** Gleiches Dark-Design wie der Rest der Seite, ruhige **Inter**-Schrift für Lesetext, **Syne** für Überschriften, klares Blau `#2f6fed` (Akzent) neben dem Cyan `#00d4ff`.
- **Aufbau:** Inhalte nach **Kategorien** gruppiert; jede Kategorie zeigt ein **Inhaltsverzeichnis** von Einträgen. Klick auf einen Eintrag **klappt den Text auf** (Accordion).
- **Befüllung:** Inhalte liegen in `learnings.json` — neue Learnings = neuer JSON-Eintrag, kein Code-Edit nötig.
- **Vorbild-Vorschau:** `preview/learning-preview.html` (freigegeben).

## 2. Architektur

```
index.html ──(Menü-Link „Learning")──▶ learning.html
                                          │  fetch('learnings.json')
                                          ▼
                                     learnings.json  ◀── (später optional: n8n/NocoDB-Push)
```

- **`learning.html`** — statische Seite. Lädt `learnings.json` per `fetch`, rendert Kategorien + Accordion, eigener 5-Sprachen-Switcher (synct über `localStorage` `nlvc_lang`, identisch zur Hauptseite).
- **`learnings.json`** — einzige Datenquelle. Array von Learning-Einträgen mit `translations` pro Sprache.
- **Kein neuer Server.** Rein statisch, deployt über die bestehende Coolify-Chain (git push → Manual Deploy).

## 3. Datenmodell (`learnings.json`)

```jsonc
[
  {
    "id": "ai-news-rss-system",        // eindeutig, kebab-case
    "category": "ai-news",             // Kategorie-Schlüssel (siehe §4)
    "meta": { "cost": "free", "time": "daily" },  // optionale Chips
    "tags": ["RSS", "Claude", "n8n"],
    "date": "2026-05-27",
    "translations": {
      "en": {
        "title": "Global AI News RSS System",
        "lead": "300 curated RSS feeds + a master prompt …",
        "steps": [ { "t": "Paste", "d": "Master prompt first …" }, … ],
        "table": [ ["Agent", "Launch a subagent …"], … ],   // alternativ zu steps
        "takeaway": "300 feeds become one curated list …"
      },
      "de": { … }, "fr": { … }, "it": { … }, "es": { … }
    }
  }
]
```

- Ein Eintrag nutzt **entweder `steps`** (nummerierte Anleitung) **oder `table`** (Referenztabelle wie „Tools mit Claude Code") — oder beides.
- Kategorie-Labels selbst sind ebenfalls übersetzt (kleines `categories`-Objekt im JSON oder im i18n-Block).

## 4. Kategorien & Content-Bestand

| Kategorie (`key`) | Learning | Quelle | Form |
|---|---|---|---|
| **KI-News & Automatisierung** (`ai-news`) | Global AI News RSS System | PDF (20 S.) | Steps |
| **Claude Code** (`claude-code`) | Tools mit Claude Code (Befehle: Agent, Bash, Edit, Glob, Grep, Read/Write, TodoWrite, WebFetch/WebSearch …) | Anthropic-Kurs | Tabelle |
| **Claude Code** | Setup · Hooks · MCP · SDK (Kurs-Überblick) | Anthropic-Kurs | Steps |
| **Claude Code** | Three Ways to Run Agents (Sub-Agent · Agent Team · Dynamic Workflow) | Charlie Hills | Steps |
| **n8n** (`n8n`) | AI Chatbot — Zero Code mit n8n (7 Schritte) | Infografik | Steps |
| **AI Skills & Frameworks** (`ai-skills`) | SCQA Writing, Content Repurposing, Tone & Style, Long-form Summary, Structured Copywriting, Hook Generator, Excalidraw, Infographic Builder, Flowchart Builder, UI/UX Advisor, Deep Research Synthesizer, Source Validation, Competitive Intelligence, Knowledge Structuring, Video Script, Video Editing, Caption Formatter, Code Review, Workflow Automation, Skill Creator, DevOps Assistant | Skills-Sammlung | Kurz-Karten |

> **Stand:** Alle 4 Kategorien mit **28 Einträgen** sind in **allen 5 Sprachen** gebaut (inkl. der ~22 AI-Skills). Weitere Learnings kommen nach und nach über neue JSON-Einträge dazu.

## 5. Mehrsprachigkeit (i18n)

- **Seiten-Chrome** (Menü, Überschriften, Buttons): über `data-i18n` + eigener `TRANSLATIONS`-Block in `learning.html` (gleiches Muster wie `index.html`).
- **Menü-Eintrag** in `index.html`: neuer Key `nav.learning` in **alle 5** Sprachblöcke + `<li>`-Link in der Nav.
- **Learning-Inhalte:** pro Eintrag `translations.{en,de,fr,it,es}` im JSON.
- **Sprachwahl** wird via `localStorage` `nlvc_lang` geteilt → wer auf der Startseite DE wählt, sieht Learning auch in DE.

## 6. `.env` / `.env.example`

Platzhalter für später (aktuell ungenutzt, hält Setup konsistent):

```bash
# --- Learning page ---
LEARNING_DATA_VERSION=1                       # Cache-Busting für learnings.json
LEARNING_INGEST_WEBHOOK_URL=                  # optional: n8n-Webhook, um learnings.json künftig automatisch zu befüllen
```

## 7. 4-Phasen-Plan

| Phase | Inhalt | Dateien |
|---|---|---|
| **1 · Daten/Backend** | `learnings.json` mit Schema anlegen; Start-Inhalte (RSS-System, Tools-Tabelle, n8n-Chatbot, Setup/Hooks/MCP, Three Ways to Run Agents) **in allen 5 Sprachen** | `learnings.json` |
| **2 · Frontend** | `learning.html` bauen: Kategorien-Accordion, Inhaltsverzeichnis, Aufklappen, Tabellen-Render, Sprach-Switcher, lädt JSON | `learning.html` |
| **3 · Menü/i18n** | `nav.learning` in alle 5 `TRANSLATIONS`-Blöcke + Menü-Link in `index.html` | `index.html` |
| **4 · Doku/Deploy** | Diese `LEARNING.md` finalisieren, `.env`/`.env.example` ergänzen, Version-Bump, lokal testen, committen | `docs/LEARNING.md`, `.env*`, `version.json` |

> ✅ Alle Phasen umgesetzt — inkl. der ~22 AI-Skills in 5 Sprachen. Nächste Learnings einfach als JSON-Eintrag ergänzen (§9).

## 8. Deploy & Test

- **Lokal testen:** `python3 -m http.server` im Repo-Root, dann `localhost:<port>/learning.html` — Sprachen, Aufklappen, Tabellen prüfen.
- **Deploy:** `git push` → Coolify Manual Deploy (bestehende Chain).
- **Smoke-Test live:** Menü-Link sichtbar in allen 5 Sprachen, JSON lädt, keine Konsolen-Fehler.

## 9. Neues Learning hinzufügen (Anleitung)

1. Neuen Eintrag in `learnings.json` ergänzen (`id`, `category`, `tags`, `translations` für alle 5 Sprachen).
2. Für eine neue Kategorie: Kategorie-Label in allen 5 Sprachen hinterlegen.
3. `LEARNING_DATA_VERSION` hochzählen (Cache-Busting).
4. `git push` → Deploy. Fertig — keine HTML-Änderung nötig.
