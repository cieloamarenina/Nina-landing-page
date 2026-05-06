# Vibe Coding News Blog — Design Spec
**Datum:** 2026-04-27

## Übersicht

Erweiterung von `ninalearnsvibecoding.com` um einen News Blog über Vibe Coding. Der Blog integriert sich nahtlos in das bestehende Dark-Tech-Design der Landing Page.

## Struktur

**Option B: Teaser auf Landing Page + volle /blog Seite**

```
Nina-landing-page/
├── index.html       ← bestehend, erhält neuen #blog-teaser Abschnitt
├── blog.html        ← NEU: Artikel-Übersicht aller Posts
├── article.html     ← NEU: Artikel-Template, liest ?slug= aus URL
└── articles.json    ← NEU: alle Artikel-Daten (Mini-CMS)
```

## Content-Verwaltung

`articles.json` ist das einzige Pflegeobjekt. Neuer Artikel = neues Objekt in der Datei.

```json
[
  {
    "slug": "erster-n8n-workflow",
    "title": "Wie ich meinen ersten n8n Workflow gebaut habe",
    "date": "2026-04-27",
    "tag": "n8n",
    "excerpt": "Kurze Beschreibung für die Karten-Vorschau",
    "gradient": "135deg, #0d1320 0%, #7c3aed 100%",
    "content": "<p>Voller Artikel-Text als HTML-String</p>"
  }
]
```

3 Starter-Artikel werden mit ausgeliefert (über Vibe Coding, n8n, Claude Code).

## Seiten-Design

### index.html — Neuer Abschnitt `#blog-teaser`

- Section-Tag: `// LATEST POSTS`
- 3 neueste Artikel aus `articles.json` als Karten-Grid (3 Spalten, responsive 1 Spalte mobile)
- CTA-Button: `Alle Artikel →` → `blog.html`
- Positionierung: nach dem bestehenden `#tools`-Abschnitt, vor dem Footer

### blog.html — Artikel-Übersicht

- Gleicher Nav + Footer wie `index.html` (Copy & Paste, kein Shared Template nötig)
- Hero: Titel `VIBE CODING NEWS`, kurzer Subtitel
- Grid alle Artikel aus `articles.json` (2–3 Spalten, responsive)
- Karten-Stil B: Gradient-Bereich oben (Cyan/Lila), darunter Tag + Titel + Excerpt + Datum

### article.html — Artikel-Template

- Liest `?slug=mein-artikel` aus URL, findet Eintrag in `articles.json`
- Hero mit Artikel-Titel, Tag-Badge, Datum
- Inhalt: zentriert, max-width 700px, JetBrains Mono, gute Zeilenhöhe
- `← Zurück zum Blog` Link oben links
- Falls Slug nicht gefunden: 404-Meldung im Stil der Seite

## Design-System (identisch zur Landing Page)

| Variable | Wert |
|----------|------|
| `--bg` | `#080c14` |
| `--card` | `#111827` |
| `--border` | `#1e2d45` |
| `--accent` | `#00d4ff` |
| `--accent2` | `#7c3aed` |
| `--text` | `#e8f0fe` |
| `--muted` | `#6b7fa3` |
| Font Display | Syne 700/800 |
| Font Mono | JetBrains Mono 300/400/600 |

Karten-Hover: `translateY(-3px)` + Cyan border-color.
Grid-Overlay (body::before) und Glassmorphism-Nav werden 1:1 übernommen.

## Nicht im Scope

- CMS-Backend (NocoDB, n8n-Integration)
- Kommentarfunktion
- RSS-Feed
- Suche / Filterung
- Mehrsprachigkeit (nur Deutsch)
