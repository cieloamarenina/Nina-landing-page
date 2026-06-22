# Penalty Challenge — Teilen + Bestenliste

**Datum:** 2026-06-22
**Datei:** `penalty/index.html` (single-file, Three.js, 6 Sprachen inkl. Hebräisch-RTL)
**Anlass:** Community-Feedback (Silvio) — Bestenliste + Teilen-Button für mehr „Suchtpotenzial".

## Ziel

Mehr Wiederspielanreiz und virale Reichweite, ohne Backend-Risiko. Drei Bausteine, alles client-seitig in der bestehenden Single-File-Seite. Kein neuer Server-Endpunkt, keine neue Dependency.

## 1. Persistenter Rekord (Bugfix)

Heute: `let best=null` lebt nur im RAM → der „Best"-Wert im Scoreboard verschwindet bei jedem Reload.

- Beim Laden aus `localStorage['nlvc_penalty_best']` einlesen (Zahl oder null).
- In `endOfRound()` (Solo-Zweig) nach Rekord-Check persistieren.
- `renderBest()` bleibt unverändert; zeigt jetzt den echten Allzeit-Rekord.

## 2. Lokale Bestenliste

- Storage-Key `localStorage['nlvc_penalty_scores']` = JSON-Array, Top 5, absteigend nach Score.
- Eintrag: `{ goals, target, shooter (Flagge), keeper (Flagge), ts (Zeitstempel) }`.
- Nur **Solo** schreibt Einträge (Duo/Cup haben keinen vergleichbaren Einzel-Score).
- Anzeige im Endscreen `#final`, unter der Bewertung, nur im Solo-Fall.
- Neuer Eintrag wird hervorgehoben. Liste komplett i18n (neue Keys, alle 6 Sprachen).
- Defensive Lese-/Schreib-Wrapper (try/catch) wie beim bestehenden `nlvc_lang`-Zugriff.

## 3. Teilen-Button

- Neuer Button im Endscreen, neben „Neues Spiel".
- Zeichnet eine quadratische **Score-Karte** (Canvas ~1080×1080): Spiel-Titel, großer Score,
  Matchup-Flaggen, Bewertungstext, Seiten-URL. Stil passend zum Spiel (dunkel, Akzentfarben).
- Teilen-Strategie, abgestuft:
  1. `navigator.canShare({files})` verfügbar → Karte als PNG-Blob via `navigator.share`.
  2. Sonst `navigator.share({text,url})` (Text-only nativ).
  3. Sonst Clipboard: vorformulierter Text + Link, kurze „Kopiert ✓"-Bestätigung.
- Funktioniert in allen Modi; Text passt sich an: Solo = Score, Duo = Duell-Ergebnis, Cup = Runde/Titel.
- Alle Strings i18n.

## i18n

Neue Keys in `I18N` für **alle 6 Sprachen** (en, de, fr, it, es, he):
`board`/`share`/`leaderboard`-Bereich, u.a.: `share.btn`, `share.copied`, `share.text`,
`lb.title`, `lb.empty`, `lb.you`. Hebräisch mit korrektem RTL (Liste folgt der bestehenden
`html[dir=rtl]`-Logik; Flaggen/Zahlen bleiben wie im Spiel sinnvoll angeordnet).

## Bewusst weggelassen (YAGNI)

Globale Online-Rangliste, Namens-Eingabe, Server-Endpunkte, Moderation. Begründung: viraler
Effekt kommt primär vom Teilen-Button; globale Liste bringt Cheat-/Spam-/Moderationsrisiko und
das n8n+Postgres-Netz ist fragil. Späteres Upgrade möglich, falls Traffic es rechtfertigt.

## Technik / Deploy

Alles in `penalty/index.html`. Kein Backend. Deploy: Push nach `origin/main` → Coolify
auto-deploy (~4–6 Min). Verifikation lokal im Browser vor dem Push.
