# Generic Bewerbungs-Template

Eine zentrale Dashboard-Seite, parametrisiert via URL.

## Aufruf

```
https://ninalearnsvibecoding.com/bewerbung/firma/?firma=Bayer+AG&stelle=AI+Engineer&match=92&slug=bayer-ag
```

## URL-Parameter

| Param | Beispiel | Pflicht | Zweck |
|---|---|---|---|
| `firma` | `Bayer+AG` | ✓ | Wird im Hero, About, EU-Section, Personal-Note eingesetzt |
| `stelle` | `AI+Engineer` | – | Hero-Tag (Position), Default: „AI Automation Specialist" |
| `match` | `92` | – | Match-Score in Hero, Default: 98% |
| `slug` | `bayer-ag` | – | Tracking-Slug (auto aus `firma` falls leer) |
| `anschreiben` | URL-encoded | – | Überschreibt den Personal-Note-Body |

## Wie das im Marco-Workflow funktioniert

1. **Mistral schreibt** Anschreiben + Match-Score
2. **Workflow generiert Slug** aus Firmenname (z.B. „Bayer AG" → `bayer-ag`)
3. **Workflow baut URL** mit Query-Params:
   ```
   https://ninalearnsvibecoding.com/bewerbung/firma/?firma=Bayer+AG&stelle=AI+Engineer&match=92&slug=bayer-ag
   ```
4. **HTML-Mail** an Firma enthält diesen Link
5. **Firma klickt** → Template lädt → URL-Param-Loader personalisiert die Seite live
6. **Tracking-Webhook** kriegt `slug` mit → Telegram-Push „Bayer AG · Visit #1"

## Vorteile gegenüber pro-Firma-Ordner

- **Eine Datei, infinite Bewerbungen** — Updates am Template wirken sofort für alle
- **Kein Datei-Schreiben aus n8n** — kein SSH, kein Git-Commit-Fragility
- **Stateless Frontend, API-driven** — moderne Architektur (Marco-pitchbar)
- **Audit-Trail in NocoDB** — `slug` ist eindeutige Verknüpfung

## Easycosmetic-Bewerbung bleibt eigenständig

`/bewerbung/easycosmetic/` ist die manuelle „Spotlight-Bewerbung" mit
firmenspezifischen Inhalten (Apex Protocol Erwähnung, etc.).
Dieses Template ist die **automatisch generierte** Variante für alle
anderen Firmen aus dem Workflow.
