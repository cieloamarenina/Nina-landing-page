# Vibe Coding Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** News Blog über Vibe Coding auf ninalearnsvibecoding.com — Teaser auf Landing Page + volle Blog-Übersicht + Artikel-Detail-Template, verwaltet über `articles.json`.

**Architecture:** JSON-basiertes Mini-CMS: alle Artikel in `articles.json`, JavaScript fetcht und rendert sie dynamisch. `article.html` liest den Artikel-Slug aus `?slug=` URL-Parameter. Keine Build-Tools, kein Backend.

**Tech Stack:** Vanilla HTML, CSS, JavaScript (fetch + URLSearchParams). Syne + JetBrains Mono Fonts (bereits in index.html geladen).

---

## Dateistruktur

```
Nina-landing-page/
├── index.html         ← MODIFY: Nav-Link + #blog-teaser Abschnitt
├── blog.html          ← CREATE: Artikel-Übersicht
├── article.html       ← CREATE: Artikel-Detail-Template
└── articles.json      ← CREATE: Artikel-Daten (Mini-CMS)
```

---

## Task 1: articles.json erstellen

**Files:**
- Create: `articles.json`

- [ ] **Step 1: Datei anlegen**

```json
[
  {
    "slug": "was-ist-vibe-coding",
    "title": "Was ist Vibe Coding — und warum ich damit angefangen habe",
    "date": "2026-04-27",
    "tag": "Vibe Coding",
    "excerpt": "Programmieren ohne klassischen Dev-Background? Mit KI als Co-Pilot geht das. Was Vibe Coding bedeutet und wie ich damit gestartet bin.",
    "gradient": "135deg, #0d1320 0%, #7c3aed 100%",
    "content": "<p>Vibe Coding ist die Idee, dass du mit einer KI als Co-Pilot programmieren kannst — auch ohne klassisches Entwickler-Hintergrundwissen. Du beschreibst, was du willst. Die KI schreibt den Code. Du verstehst genug, um zu steuern, zu debuggen und weiterzudenken.</p><p>Für mich begann das mit einem einfachen Experiment: Ich wollte einen kleinen Automatisierungs-Workflow bauen, hatte aber keine Ahnung von Python. Claude hat mir nicht nur den Code geschrieben, sondern erklärt, was er tut — und warum.</p><p>Das hat alles verändert. Ich bin keine Entwicklerin. Aber ich baue jetzt Dinge, die funktionieren.</p>"
  },
  {
    "slug": "erster-n8n-workflow",
    "title": "Mein erster n8n Workflow: LinkedIn-Posts automatisieren",
    "date": "2026-04-20",
    "tag": "n8n",
    "excerpt": "Keine Ahnung von Nodes, trotzdem deployed. So habe ich meinen ersten Workflow gebaut — mit viel Claude und wenig Schlaf.",
    "gradient": "135deg, #0d1320 0%, #00d4ff 50%, #0d1320 100%",
    "content": "<p>n8n ist ein Open-Source Workflow-Automatisierungstool, das du selbst hosten kannst. Nodes verbinden sich zu Workflows — klingt einfach, ist es aber anfangs überhaupt nicht.</p><p>Mein Ziel: Automatisch LinkedIn-Posts aus meinen Notizen generieren und vorbereiten. Erster Versuch: kompletter Misserfolg. Zweiter Versuch: auch. Dritter Versuch mit Claude als Navigator: es hat funktioniert.</p><p>Was ich gelernt habe: n8n-Fehler sind oft subtil. Claude hilft beim Debuggen, aber du musst die richtigen Fragen stellen. Der Schlüssel war, den Fehler-Output direkt in den Chat zu kopieren statt ihn zu beschreiben.</p>"
  },
  {
    "slug": "claude-code-erste-schritte",
    "title": "Claude Code: Meine ersten Wochen mit dem KI-Terminal",
    "date": "2026-04-15",
    "tag": "Claude Code",
    "excerpt": "Ein Terminal, das denkt. Claude Code hat mein Verhältnis zum Code-Schreiben komplett verändert. Was ich gelernt habe.",
    "gradient": "135deg, #0d1320 0%, #f59e0b 100%",
    "content": "<p>Claude Code ist ein CLI-Tool, das Claude direkt in dein Terminal bringt — mit Zugriff auf deine Dateien, dein Git, deine gesamte Projektstruktur. Kein Copy-Paste mehr zwischen Chat und Editor.</p><p>Die ersten Tage waren überwältigend. Claude kann Dateien lesen, schreiben, Befehle ausführen — und dabei immer im Kontext deines Projekts bleiben. Das ist ein fundamentaler Unterschied zum normalen Chat.</p><p>Mein größtes Learning: Claude Code ist kein Auto-Pilot. Es ist ein extrem fähiger Kollege, der genau so gut ist wie deine Fähigkeit, ihm zu erklären, was du willst. Kommunikation ist alles.</p>"
  }
]
```

- [ ] **Step 2: Im Browser testen**

Öffne `articles.json` direkt im Browser (oder via `python3 -m http.server 8080` im Projektordner, dann `http://localhost:8080/articles.json`).
Erwartung: Valides JSON wird angezeigt, kein Parse-Fehler.

- [ ] **Step 3: Commit**

```bash
git add articles.json
git commit -m "feat: add articles.json with 3 starter articles"
```

---

## Task 2: blog.html erstellen

**Files:**
- Create: `blog.html`

- [ ] **Step 1: Datei erstellen**

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%230d1320'/><text x='2' y='22' font-family='monospace' font-weight='bold' font-size='13' fill='%2300d4ff'>NLC</text></svg>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog — Nina Learns Vibe Coding</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@300;400;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #080c14;
    --surface: #0d1320;
    --card: #111827;
    --border: #1e2d45;
    --accent: #00d4ff;
    --accent2: #7c3aed;
    --text: #e8f0fe;
    --muted: #6b7fa3;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 15px;
    line-height: 1.7;
    overflow-x: hidden;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 0;
  }

  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px, transparent 3px,
      rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px
    );
    pointer-events: none;
    z-index: 9999;
    opacity: 0.4;
  }

  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 1.2rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(8,12,20,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: 0.05em;
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
  }

  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    transition: color 0.2s;
  }

  .nav-links a:hover, .nav-links a.active { color: var(--accent); }

  main {
    position: relative;
    z-index: 1;
    padding: 8rem 2rem 6rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .section-tag {
    font-size: 0.65rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .section-tag::after {
    content: '';
    flex: 1;
    max-width: 60px;
    height: 1px;
    background: var(--accent);
    opacity: 0.4;
  }

  .page-title {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 6vw, 5rem);
    font-weight: 800;
    line-height: 1.0;
    letter-spacing: -0.03em;
    margin-bottom: 1rem;
  }

  .page-sub {
    font-size: 0.9rem;
    color: var(--muted);
    margin-bottom: 4rem;
    max-width: 500px;
  }

  .blog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .blog-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-top: 2px solid var(--accent);
    text-decoration: none;
    color: var(--text);
    display: flex;
    flex-direction: column;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    cursor: pointer;
  }

  .blog-card:hover {
    transform: translateY(-4px);
    border-top-color: var(--accent2);
    box-shadow: 0 8px 30px rgba(0,212,255,0.1);
  }

  .card-cover {
    height: 120px;
    flex-shrink: 0;
  }

  .card-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .card-tag {
    font-size: 0.62rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.6rem;
  }

  .card-title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 0.6rem;
    color: var(--text);
  }

  .card-excerpt {
    font-size: 0.72rem;
    color: var(--muted);
    line-height: 1.7;
    flex: 1;
  }

  .card-date {
    font-size: 0.62rem;
    color: var(--muted);
    letter-spacing: 0.1em;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
  }

  .loading {
    color: var(--muted);
    font-size: 0.8rem;
    letter-spacing: 0.1em;
  }

  footer {
    position: relative;
    z-index: 1;
    border-top: 1px solid var(--border);
    padding: 3rem 2rem;
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-logo {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--accent);
  }

  .footer-copy {
    font-size: 0.7rem;
    color: var(--muted);
    letter-spacing: 0.1em;
  }

  @media (max-width: 600px) {
    nav .nav-links { display: none; }
    footer { flex-direction: column; gap: 1rem; text-align: center; }
    .blog-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

<nav>
  <a href="index.html" class="nav-logo">NLC_</a>
  <ul class="nav-links">
    <li><a href="index.html#about">About</a></li>
    <li><a href="index.html#journey">Journey</a></li>
    <li><a href="index.html#tools">Stack</a></li>
    <li><a href="blog.html" class="active">Blog</a></li>
  </ul>
</nav>

<main>
  <div class="section-tag">// latest posts</div>
  <h1 class="page-title">Vibe Coding<br>News</h1>
  <p class="page-sub">Learnings, Tools und ehrliche Berichte aus dem Alltag des KI-gestützten Bauens.</p>

  <div class="blog-grid" id="blog-grid">
    <p class="loading">Lade Artikel...</p>
  </div>
</main>

<footer>
  <div class="footer-logo">NLC_</div>
  <div class="footer-copy">© 2026 Nina Panknin — Learning in Public</div>
</footer>

<script>
  fetch('articles.json')
    .then(r => r.json())
    .then(articles => {
      const grid = document.getElementById('blog-grid');
      grid.innerHTML = articles.map(a => `
        <a class="blog-card" href="article.html?slug=${a.slug}">
          <div class="card-cover" style="background: linear-gradient(${a.gradient})"></div>
          <div class="card-body">
            <div class="card-tag">${a.tag}</div>
            <div class="card-title">${a.title}</div>
            <div class="card-excerpt">${a.excerpt}</div>
            <div class="card-date">${formatDate(a.date)}</div>
          </div>
        </a>
      `).join('');
    })
    .catch(() => {
      document.getElementById('blog-grid').innerHTML =
        '<p class="loading">Artikel konnten nicht geladen werden.</p>';
    });

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
</script>
</body>
</html>
```

- [ ] **Step 2: Im Browser testen**

Starte lokalen Server: `python3 -m http.server 8080` im Projektordner.
Öffne `http://localhost:8080/blog.html`.
Erwartung: 3 Karten werden angezeigt, jede mit Gradient-Bereich, Tag, Titel, Excerpt, Datum. Hover zeigt translateY-Effekt. Kein "Lade Artikel..." Fehler.

- [ ] **Step 3: Commit**

```bash
git add blog.html
git commit -m "feat: add blog overview page"
```

---

## Task 3: article.html erstellen

**Files:**
- Create: `article.html`

- [ ] **Step 1: Datei erstellen**

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%230d1320'/><text x='2' y='22' font-family='monospace' font-weight='bold' font-size='13' fill='%2300d4ff'>NLC</text></svg>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Artikel — Nina Learns Vibe Coding</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@300;400;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #080c14;
    --surface: #0d1320;
    --card: #111827;
    --border: #1e2d45;
    --accent: #00d4ff;
    --accent2: #7c3aed;
    --text: #e8f0fe;
    --muted: #6b7fa3;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 15px;
    line-height: 1.7;
    overflow-x: hidden;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 0;
  }

  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px, transparent 3px,
      rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px
    );
    pointer-events: none;
    z-index: 9999;
    opacity: 0.4;
  }

  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 1.2rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(8,12,20,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: 0.05em;
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
  }

  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    transition: color 0.2s;
  }

  .nav-links a:hover { color: var(--accent); }

  main {
    position: relative;
    z-index: 1;
    padding: 8rem 2rem 6rem;
    max-width: 720px;
    margin: 0 auto;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--muted);
    text-decoration: none;
    font-size: 0.72rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 3rem;
    transition: color 0.2s;
  }

  .back-link:hover { color: var(--accent); }

  .article-tag {
    font-size: 0.62rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 1rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(0,212,255,0.08);
    border: 1px solid rgba(0,212,255,0.25);
    padding: 0.3rem 0.8rem;
  }

  .article-title {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin-bottom: 1rem;
  }

  .article-date {
    font-size: 0.7rem;
    color: var(--muted);
    letter-spacing: 0.1em;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border);
  }

  .article-content {
    font-size: 0.95rem;
    line-height: 2;
    color: var(--text);
  }

  .article-content p {
    margin-bottom: 1.5rem;
    color: #c8d8f0;
  }

  .article-content p:last-child { margin-bottom: 0; }

  .not-found {
    text-align: center;
    padding: 6rem 0;
  }

  .not-found h1 {
    font-family: var(--font-display);
    font-size: 3rem;
    color: var(--accent);
    margin-bottom: 1rem;
  }

  .not-found p {
    color: var(--muted);
    margin-bottom: 2rem;
  }

  .not-found a {
    color: var(--accent);
    text-decoration: none;
    border-bottom: 1px solid rgba(0,212,255,0.3);
  }

  footer {
    position: relative;
    z-index: 1;
    border-top: 1px solid var(--border);
    padding: 3rem 2rem;
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-logo {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--accent);
  }

  .footer-copy {
    font-size: 0.7rem;
    color: var(--muted);
    letter-spacing: 0.1em;
  }

  @media (max-width: 600px) {
    nav .nav-links { display: none; }
    footer { flex-direction: column; gap: 1rem; text-align: center; }
  }
</style>
</head>
<body>

<nav>
  <a href="index.html" class="nav-logo">NLC_</a>
  <ul class="nav-links">
    <li><a href="index.html#about">About</a></li>
    <li><a href="index.html#journey">Journey</a></li>
    <li><a href="index.html#tools">Stack</a></li>
    <li><a href="blog.html">Blog</a></li>
  </ul>
</nav>

<main id="article-main">
  <p style="color:var(--muted);font-size:0.8rem;">Lade Artikel...</p>
</main>

<footer>
  <div class="footer-logo">NLC_</div>
  <div class="footer-copy">© 2026 Nina Panknin — Learning in Public</div>
</footer>

<script>
  const slug = new URLSearchParams(window.location.search).get('slug');
  const main = document.getElementById('article-main');

  if (!slug) {
    showNotFound();
  } else {
    fetch('articles.json')
      .then(r => r.json())
      .then(articles => {
        const article = articles.find(a => a.slug === slug);
        if (!article) { showNotFound(); return; }
        document.title = `${article.title} — Nina Learns Vibe Coding`;
        main.innerHTML = `
          <a class="back-link" href="blog.html">← Zurück zum Blog</a>
          <div class="article-tag">${article.tag}</div>
          <h1 class="article-title">${article.title}</h1>
          <div class="article-date">${formatDate(article.date)}</div>
          <div class="article-content">${article.content}</div>
        `;
      })
      .catch(showNotFound);
  }

  function showNotFound() {
    main.innerHTML = `
      <div class="not-found">
        <h1>404</h1>
        <p>Dieser Artikel existiert nicht (mehr).</p>
        <a href="blog.html">← Zurück zum Blog</a>
      </div>
    `;
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
</script>
</body>
</html>
```

- [ ] **Step 2: Im Browser testen — Artikel laden**

Mit laufendem Server (`python3 -m http.server 8080`):
Öffne `http://localhost:8080/article.html?slug=was-ist-vibe-coding`.
Erwartung: Artikel-Titel, Tag, Datum und Content werden angezeigt. `← Zurück zum Blog` Link ist sichtbar.

- [ ] **Step 3: Im Browser testen — 404 Fall**

Öffne `http://localhost:8080/article.html?slug=gibts-nicht`.
Erwartung: "404 — Dieser Artikel existiert nicht (mehr)." mit Zurück-Link.

Öffne `http://localhost:8080/article.html` (ohne slug).
Erwartung: Gleiche 404-Meldung.

- [ ] **Step 4: Commit**

```bash
git add article.html
git commit -m "feat: add article detail template with slug routing"
```

---

## Task 4: index.html — Blog-Teaser + Nav-Link

**Files:**
- Modify: `index.html:843` (Nav-Link hinzufügen)
- Modify: `index.html:1086` (Blog-Teaser vor Footer einfügen)

- [ ] **Step 1: Nav-Link hinzufügen**

In `index.html` Zeile 843, nach dem Visitors-Link:

**Vorher (Zeile 843):**
```html
    <li><a href="#visitors" data-i18n="nav.visitors">Visitors</a></li>
```

**Nachher:**
```html
    <li><a href="#visitors" data-i18n="nav.visitors">Visitors</a></li>
    <li><a href="blog.html">Blog</a></li>
```

- [ ] **Step 2: Blog-Teaser CSS hinzufügen**

In `index.html`, direkt vor dem schließenden `</style>` Tag (vor Zeile ~829, dem `@media` Block), dieses CSS einfügen:

```css
  /* BLOG TEASER */
  #blog-teaser .teaser-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }

  .teaser-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-top: 2px solid var(--accent);
    text-decoration: none;
    color: var(--text);
    display: flex;
    flex-direction: column;
    transition: transform 0.2s, border-top-color 0.2s, box-shadow 0.2s;
  }

  .teaser-card:hover {
    transform: translateY(-4px);
    border-top-color: var(--accent2);
    box-shadow: 0 8px 30px rgba(0,212,255,0.1);
  }

  .teaser-cover {
    height: 100px;
    flex-shrink: 0;
  }

  .teaser-body {
    padding: 1.1rem;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .teaser-tag {
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.4rem;
  }

  .teaser-title {
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 0.4rem;
  }

  .teaser-excerpt {
    font-size: 0.7rem;
    color: var(--muted);
    line-height: 1.6;
    flex: 1;
  }

  .teaser-date {
    font-size: 0.6rem;
    color: var(--muted);
    margin-top: 0.8rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--border);
  }

  .blog-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    border: 1px solid rgba(0,212,255,0.4);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.75rem 1.75rem;
    text-decoration: none;
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
  }

  .blog-cta:hover {
    background: rgba(0,212,255,0.08);
    border-color: var(--accent);
    transform: translateY(-2px);
  }
```

- [ ] **Step 3: Blog-Teaser HTML einfügen**

In `index.html` nach Zeile 1086 (`</section>` Ende des visitors-Abschnitts), vor dem `<!-- FOOTER -->` Kommentar:

```html

<!-- BLOG TEASER -->
<section id="blog-teaser">
  <div class="section-header reveal">
    <div class="section-tag">// latest posts</div>
    <h2 class="section-title">Vibe Coding<br>News</h2>
  </div>
  <div class="teaser-grid reveal" id="teaser-grid">
    <p style="color:var(--muted);font-size:0.8rem;">Lade Artikel...</p>
  </div>
  <a href="blog.html" class="blog-cta reveal">Alle Artikel lesen →</a>
</section>

```

- [ ] **Step 4: Blog-Teaser JavaScript hinzufügen**

In `index.html`, direkt vor dem schließenden `</body>` Tag (Zeile 1663), diesen Script-Block hinzufügen:

```html
<script>
  fetch('articles.json')
    .then(r => r.json())
    .then(articles => {
      const grid = document.getElementById('teaser-grid');
      const latest = articles.slice(0, 3);
      grid.innerHTML = latest.map(a => `
        <a class="teaser-card" href="article.html?slug=${a.slug}">
          <div class="teaser-cover" style="background: linear-gradient(${a.gradient})"></div>
          <div class="teaser-body">
            <div class="teaser-tag">${a.tag}</div>
            <div class="teaser-title">${a.title}</div>
            <div class="teaser-excerpt">${a.excerpt}</div>
            <div class="teaser-date">${new Date(a.date).toLocaleDateString('de-DE', {day:'numeric', month:'long', year:'numeric'})}</div>
          </div>
        </a>
      `).join('');
    })
    .catch(() => {
      const grid = document.getElementById('teaser-grid');
      if (grid) grid.innerHTML = '';
    });
</script>
```

- [ ] **Step 5: Im Browser testen**

Mit laufendem Server `http://localhost:8080/`:
- Blog-Teaser Sektion ist sichtbar (nach Visitors-Sektion scrollen)
- 3 Karten werden angezeigt mit Gradient, Tag, Titel, Excerpt
- "Alle Artikel lesen →" Link führt zu `blog.html`
- "Blog" Link in Nav führt zu `blog.html`
- Klick auf eine Karte führt zur korrekten Artikel-Seite

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add blog teaser section and blog nav link to index.html"
```

---

## Task 5: Finaler Check

- [ ] **Step 1: Alle Seiten durchklicken**

Prüfe diesen Pfad komplett durch:
1. `http://localhost:8080/` → Blog-Teaser sichtbar → Karte anklicken → Artikel öffnet sich korrekt → `← Zurück zum Blog` → `blog.html` öffnet sich → alle 3 Karten sichtbar → Karte anklicken → Artikel öffnet sich
2. Nav-Link "Blog" auf `index.html` → führt zu `blog.html`
3. Nav-Link "NLC_" auf `blog.html` und `article.html` → führt zurück zu `index.html`

- [ ] **Step 2: Mobile prüfen**

Im Browser DevTools (F12 → Responsive Mode) auf 375px Breite:
- Blog-Karten stapeln sich (1 Spalte)
- Nav-Links auf index.html sind verborgen (mobil wird Nav ausgeblendet)
- Artikel-Seite ist gut lesbar

- [ ] **Step 3: Abschließender Commit**

```bash
git add .
git commit -m "feat: complete vibe coding blog — teaser, overview, article template"
```
