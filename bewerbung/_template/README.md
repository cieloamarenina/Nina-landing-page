# `_template/` · Generisches Bewerbungs-Dashboard

**Stand:** 19.05.2026 abends · vorbereitet für Phase 4 (Auto-Generation pro Stelle)

---

## Was hier liegt

Dieses Verzeichnis ist die **Vorlage** für alle automatisch generierten Bewerbungs-Dashboards. Der n8n-Workflow `Bewerbungsworkflow v1 — Abschluss Marco` lädt die `index.html` per HTTP, ersetzt die `{{PLACEHOLDER}}` mit Mistral-Output und committet das Result in `bewerbung/<slug>/index.html`.

## Placeholder-Liste

| Placeholder | Wert von Mistral-Output | Beispiel |
|---|---|---|
| `{{FIRMA}}` | `firma_aus_anzeige` (voll) | „Mirantus Health" |
| `{{FIRMA_SHORT}}` | Firmenname kurz | „Mirantus" |
| `{{SLUG}}` | `slug` | „mirantus-health" |
| `{{POSITION}}` | `gesuchte_position` (kurz) | „Operations Manager" |
| `{{POSITION_TAG}}` | Hero-Tag in Caps | „OPERATIONS MANAGER · PEOPLE OPERATIONS" |
| `{{HERO_STACK}}` | Stack-Subtitle | „Employee Lifecycle · DATEV · Process Automation" |
| `{{NOTE_BODY}}` | Hero-Anschreiben-Snippet (4-6 Sätze) | siehe Mirantus-Beispiel |
| `{{MATRIX_ITEMS_HTML}}` | Komplette Skill-Matrix als HTML | siehe unten |
| `{{MATRIX_FOOT_PRIMARY}}` | Footer-Statement | „6/6 Kern-Anforderungen erfüllt + zwei Bonus-Skills…" |
| `{{SALARY}}` | Gehaltsvorstellung | „55.000 – 60.000 € brutto/Jahr" |

## `{{MATRIX_ITEMS_HTML}}` — Mistral muss das generieren

Pro `matrix_item` aus Mistral-Output erzeugt n8n einen Block:

```html
<div class="matrix-row">
  <div class="matrix-req"><span class="arr">→</span> {{REQ}}</div>
  <div class="matrix-proof">{{PROOF_HTML}}</div>
  <div class="matrix-tick">✓</div>
</div>
```

Für `source: "nina_first"` Items: `<span class="arr">★</span>` und `<div class="matrix-tick">★</div>`.

`PROOF_HTML` darf `<strong>...</strong>` Highlights enthalten — Mistral generiert das mit.

## Was NICHT als Placeholder ausgewiesen ist

- **i18n EN-Übersetzungen** (Zeilen ~1610-1640) — für Phase 4 v1 reicht DE. Falls Mistral später beide Sprachen liefern soll: zusätzliches Schema-Feld `*_en`.
- **CONFIG-Block Webhook-URLs** — bleiben generic mit `{{SLUG}}` falls die Webhooks pro Slug auflösbar sind. Sonst per Code-Node nach Template-Render durch konkrete URLs ersetzen.
- **Pablo-SVG, Confetti-JS, Cal.com-Embed** — bleiben unverändert (allgemeine UI-Features).

## Auto-Generation-Pipeline (n8n Phase 4)

```
Mistral-Output (JSON)
       ↓
Code-Node "Render HTML"
  - HTTP GET https://raw.githubusercontent.com/cieloamarenina/Nina-landing-page/main/bewerbung/_template/index.html
  - String-Replace pro Placeholder mit Mistral-Daten
  - Erzeuge MATRIX_ITEMS_HTML aus matrix_items-Array
       ↓
HTTP-Node "GitHub Commit"
  - PUT https://api.github.com/repos/cieloamarenina/Nina-landing-page/contents/bewerbung/{{slug}}/index.html
  - Header: Authorization: token <GitHub PAT>
  - Body: { message: "Bewerbung: {{firma}} {{position}}", content: base64(rendered_html) }
       ↓
Nina: Telegram-Push → "Senden" → Mail mit Dashboard-Link
       ↓
Nina: klickt Coolify-Redeploy manuell (Memory feedback-deployment)
```

## Was Mirantus-Beispiel beweist

Die aktuelle `bewerbung/mirantus-health/index.html` ist eine **manuell gerenderte Instanz** dieses Templates. Sieh sie als „so soll das Auto-Generierte aussehen". Mistral-Output war:
- firma_aus_anzeige: „Mirantus Health GmbH"
- gesuchte_position: „Operations Manager"
- matrix_items: 6 anzeige_first + 2 nina_first (AI-Bonus + DATEV-Bonus)
