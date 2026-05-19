# Setup · Bewerbung lemon.markets

Vor dem Deploy auf Coolify: 3 n8n-Workflows importieren + ggf. CV-PDF neu rendern + Coolify-Deploy.

---

## 1 · Drei n8n-Workflows importieren

Alle drei JSONs liegen neben der `index.html`:

| Datei | Was es macht | Webhook |
|---|---|---|
| `page-visit-workflow.json` | Telegram-Push bei jedem Page-Visit | `POST /webhook/page-visit-lemon-markets` |
| `qr-workflow.json` | Server-side QR-Code-Generation | `GET /webhook/qr-lemon-markets` |
| `cv-download-workflow.json` | CV-PDF-Lieferung mit Telegram-Push bei Download | `GET /webhook/cv-lemon-markets` |

**Für jeden Workflow im n8n-UI:**
1. n8n öffnen → **Import Workflow** → JSON-Datei wählen
2. Beim Telegram-Node: Credential **„Telegram account 2"** verbinden
3. **Activate Workflow** (Toggle oben rechts)
4. Webhook-URL kopieren und checken, ob sie passt

Die drei resultierenden URLs sind:

```
https://n8n.ninalearnsvibecoding.com/webhook/page-visit-lemon-markets
```

```
https://n8n.ninalearnsvibecoding.com/webhook/qr-lemon-markets
```

```
https://n8n.ninalearnsvibecoding.com/webhook/cv-lemon-markets
```

> Diese URLs sind in der `index.html` bereits eingetragen — du brauchst sie nur kopieren, falls du sie irgendwo testen willst.

---

## 2 · index.html · CONFIG-Block — schon vollständig gefüllt

Datei: `index.html` — ganz oben im `<script>`-Block ist alles drin:

```js
const CONFIG = {
  TRACKING_WEBHOOK:  'https://n8n.ninalearnsvibecoding.com/webhook/page-visit-lemon-markets',
  CAL_LINK:          'https://cal.ninalearnsvibecoding.com/nina/30min?embed=true&theme=dark',
  CV_DOWNLOAD_URL:   'https://n8n.ninalearnsvibecoding.com/webhook/cv-lemon-markets',
  QR_API_URL:        'https://n8n.ninalearnsvibecoding.com/webhook/qr-lemon-markets',
  PAGE_URL:          'https://ninalearnsvibecoding.com/bewerbung/lemon-markets/',
  MUSIC_URL:         '',
  MUSIC_VOLUME:      0.18
};
```

| Key | Status | Wenn leer / falsch |
|---|---|---|
| `TRACKING_WEBHOOK` | ✅ gesetzt | Tracking aus |
| `CAL_LINK` | ✅ gesetzt — bitte prüfen ob Cal-URL stimmt | Placeholder bleibt |
| `CV_DOWNLOAD_URL` | ✅ gesetzt | Fallback auf statisches PDF `./cv-nina-panknin.pdf` |
| `QR_API_URL` | ✅ gesetzt | Fallback auf api.qrserver.com |
| `PAGE_URL` | ✅ gesetzt | für QR-Daten |

---

## 3 · Dateien im Ordner — alle bereit

```
Nina-landing-page/bewerbung/lemon-markets/
├── index.html                      ✅ Dashboard (DE/EN)
├── cv-nina-panknin.md              ✅ CV-Quelle
├── cv-nina-panknin.pdf             ✅ CV-PDF (gerendert)
├── cv-nina-panknin.html            ✅ HTML-Zwischenform (kann gelöscht werden)
├── anschreiben.md                  ✅ Anschreiben-Quelle
├── anschreiben.pdf                 ✅ Anschreiben-PDF (gerendert)
├── anschreiben.html                ✅ HTML-Zwischenform (kann gelöscht werden)
├── cv-style.css                    ✅ PDF-Styling
├── zertifikat-ki-analyst.pdf       ✅ KI-Analyst-Zertifikat
├── zertifikat-ki-berater.pdf       ✅ KI-Berater-Zertifikat
├── pablo.png                       ✅ Pablo-Bild
├── femhit-logo.svg                 ✅ FEMhit-Logo
├── page-visit-workflow.json        ✅ n8n Import-Template
├── qr-workflow.json                ✅ n8n Import-Template
└── cv-download-workflow.json       ✅ n8n Import-Template
```

> **DATEV-Zertifikat:** liegt aktuell nicht als PDF vor. Im Dashboard ist es als Text-Card ohne Download-Link drin. Falls du das PDF hast, einfach als `datev-zertifikat-lohn-gehalt.pdf` in den Ordner legen — ich kann den Card-Link dann nachziehen.

---

## 4 · Was passiert nach Deploy (Live-Demo-Effekt)

| Aktion bei lemon.markets | Was passiert bei dir |
|---|---|
| Sie öffnen den Link | 🔥 *„lemon.markets-Bewerbung gerade geöffnet!"* — Telegram-Push |
| Sie scrollen weiter | Visitor-Counter erhöht sich; weitere Visits = stille Pushs |
| Sie scannen den QR | 📥 *„CV-Download · lemon-markets"* mit `src=qr` → Telegram-Push |
| Sie klicken Download | 📥 *„CV-Download · lemon-markets"* mit `src=button` → Telegram-Push |
| Sie buchen Cal.com-Termin | Cal.com → eigene Notification |

**= Closed-Loop-Bewerbung.** Live-Demo deiner Skills für eine People-Ops-Stelle, die explizit nach „Automation & project improvements" fragt.

---

## 5 · Deployment (Coolify via Git)

```bash
git add bewerbung/lemon-markets/
git commit -m "Add lemon-markets application"
git push origin main
```

Coolify pullt automatisch von `cieloamarenina/Nina-landing-page:main` und baut (~15-30 Sek).
**Webhook triggert oft nicht zuverlässig** → in Coolify-UI „Redeploy" klicken, wenn der neue Commit-SHA dort nicht innerhalb 1 Min auftaucht.

Endpoint danach: `https://ninalearnsvibecoding.com/bewerbung/lemon-markets/`

---

## 6 · Test-Checklist vor dem Versenden

- [ ] Drei n8n-Workflows importiert + aktiv
- [ ] Cal.com-URL stimmt (cal.ninalearnsvibecoding.com erreichbar)
- [ ] Seite öffnen im Inkognito → Page-Visit-Push kommt
- [ ] CV-Button klicken → PDF lädt + Download-Push kommt
- [ ] QR-Code scannen → CV lädt + Download-Push kommt mit `src=qr`
- [ ] Beide Zertifikat-Karten öffnen die PDFs
- [ ] Sprache-Toggle DE/EN funktioniert
- [ ] Cal.com-Embed zeigt Slots
- [ ] Pablo klicken → Sprechblase erscheint 🐕
- [ ] Mobile-Ansicht prüfen (iPhone Safari)
- [ ] Match-Matrix zeigt alle 10 Reihen korrekt

---

## 7 · Was an lemon.markets verschickt wird

1. **Anschreiben** (`anschreiben.pdf`) — verweist auf das Dashboard
2. **Lebenslauf** (`cv-nina-panknin.pdf`)
3. **Zertifikat KI-Analystin** ✅ liegt im Ordner
4. **Zertifikat KI-Beraterin** ✅ liegt im Ordner
5. **DATEV-Zertifikat Lohn & Gehalt** — sofern du das als PDF hast (sonst im Anschreiben/CV als Text erwähnt)
6. **Dashboard-URL** als Link im Anschreiben

**Versand-Adresse:** `talent@lemon.markets.com`

> lemon.markets verlangt keine Bewerbung über ein Karriereportal — direkter Mail-Versand ist möglich.

---

## 8 · Re-Render der PDFs (falls du CV/Anschreiben editierst)

```bash
cd Nina-landing-page/bewerbung/lemon-markets
pandoc cv-nina-panknin.md -o cv-nina-panknin.html --standalone --css=cv-style.css
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf=cv-nina-panknin.pdf "file://$(pwd)/cv-nina-panknin.html"
```

Analog für `anschreiben.md`.

---

**Erwartete Wirkung:** Sie öffnen die URL → Telegram-Push. Sie laden CV → noch ein Push. Sie buchen Termin → bestätigt das Interesse. Du weißt jederzeit, wo im Funnel sie sind. Closed-Loop-Bewerbung für eine People-Ops-Rolle, die genau dieses Mindset sucht.
