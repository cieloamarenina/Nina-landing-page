# Setup · Bewerbung Mirantus Health

Vor dem Deploy auf Coolify: 3 n8n-Workflows importieren + CONFIG-Block füllen + CV-PDF reinlegen.

---

## 1 · Drei n8n-Workflows importieren

Alle drei Dateien liegen neben der `index.html`:

| Datei | Was es macht | Webhook |
|---|---|---|
| `page-visit-workflow.json` | Telegram-Push bei jedem Page-Visit | `POST /webhook/page-visit-mirantus-health` |
| `qr-workflow.json` | Server-side QR-Code-Generation | `GET /webhook/qr-mirantus-health` |
| `cv-download-workflow.json` | CV-PDF-Lieferung mit Telegram-Push bei Download | `GET /webhook/cv-mirantus-health` |

**Für jeden Workflow:**
1. n8n öffnen → **Import Workflow** → JSON-Datei wählen
2. Beim Telegram-Node: Credential **„Telegram account 2"** verbinden
3. **Activate Workflow** (Toggle oben rechts)
4. Webhook-URL kopieren

Die drei resultierenden URLs sehen so aus:
```
https://n8n.ninalearnsvibecoding.com/webhook/page-visit-mirantus-health
https://n8n.ninalearnsvibecoding.com/webhook/qr-mirantus-health
https://n8n.ninalearnsvibecoding.com/webhook/cv-mirantus-health
```

> Hinweis: Page-Visit-Endpoint ist absichtlich ohne Token (rate-limited, CORS-geschützt). CV-Download und QR sind public-by-design (PDF soll runtergeladen werden können).

---

## 2 · index.html · CONFIG-Block füllen

Datei: [`index.html`](./index.html) — ganz oben im `<script>`-Block:

```js
const CONFIG = {
  TRACKING_WEBHOOK:  'https://n8n.ninalearnsvibecoding.com/webhook/page-visit-mirantus-health',
  CAL_LINK:          'https://cal.ninalearnsvibecoding.com/nina/30min?embed=true&theme=dark',
  CV_DOWNLOAD_URL:   'https://n8n.ninalearnsvibecoding.com/webhook/cv-mirantus-health',
  QR_API_URL:        'https://n8n.ninalearnsvibecoding.com/webhook/qr-mirantus-health',
  CV_URL:            './cv-nina-panknin.pdf',
  PAGE_URL:          'https://ninalearnsvibecoding.com/bewerbung/mirantus-health/',
  MUSIC_URL:         '',
  MUSIC_VOLUME:      0.18
};
```

| Key | Wert | Wenn leer |
|---|---|---|
| `TRACKING_WEBHOOK` | Page-Visit-URL | Tracking aus |
| `CAL_LINK` | Cal.com Embed-URL | Placeholder bleibt |
| **`CV_DOWNLOAD_URL`** | **n8n CV-Endpoint** | **Fallback auf statisches PDF (`CV_URL`)** |
| **`QR_API_URL`** | **n8n QR-Endpoint** | **Fallback auf api.qrserver.com** |
| `CV_URL` | Pfad zur PDF (Fallback) | Egal wenn `CV_DOWNLOAD_URL` gesetzt |
| `PAGE_URL` | öffentliche URL | für QR-Daten |
| `MUSIC_URL` | Pfad zur MP3 | Music-Button macht nur „wackel" |

---

## 3 · CV-PDF reinlegen

Lebenslauf als `cv-nina-panknin.pdf` in diesen Ordner legen:

```
Nina-landing-page/bewerbung/mirantus-health/cv-nina-panknin.pdf
```

**Wichtig:** Der CV-Download-Workflow holt die PDF per HTTP-Request von der Live-URL, also die PDF muss nach dem Coolify-Deploy unter `https://ninalearnsvibecoding.com/bewerbung/mirantus-health/cv-nina-panknin.pdf` erreichbar sein.

Zertifikate sind schon drin:
- `zertifikat-ki-analyst.pdf` ✅
- `zertifikat-ki-berater.pdf` ✅

---

## 4 · Was du jetzt live bekommst (BAAM-Faktor)

Mit den drei n8n-Workflows gibst du Mirantus ein **Demo-Live-System**:

| Aktion | Was passiert |
|---|---|
| Sie öffnen die Seite | 🔥 *„Mirantus-Health-Bewerbung gerade geöffnet!"* — Telegram-Push an Nina |
| Sie scrollen weiter | Visitor-Counter erhöht sich, weitere Visits = stille Pushs |
| Sie scannen den QR | 📥 *„CV-Download · Mirantus Health"* + Source: `qr` → Telegram-Push |
| Sie klicken Download | 📥 *„CV-Download · Mirantus Health"* + Source: `button` → Telegram-Push |
| Sie buchen Termin | Cal.com → eigene Notification |

**= Du weißt jederzeit, wo im Funnel sie gerade sind.** Genau das Setup, das du bei Mirantus einbauen würdest. Live-Demo deiner Skills.

---

## 5 · Hintergrundmusik (optional)

Lizenzfreie Lo-Fi-Loops findest du auf:
- **pixabay.com/music/** (Royalty-Free, kein Account nötig) — empfohlen
- **freemusicarchive.org**
- **incompetech.com** (Kevin MacLeod, CC-BY)

MP3 als `lofi-loop.mp3` in den Ordner legen und in `CONFIG.MUSIC_URL` eintragen.

---

## 6 · Deployment (Coolify)

Wie üblich — direkt im Coolify-Interface deployen, **kein git push**.
Erreichbar unter: `https://ninalearnsvibecoding.com/bewerbung/mirantus-health/`

---

## 7 · Test-Checklist vor dem Versenden

- [ ] Drei n8n-Workflows importiert + aktiv
- [ ] CONFIG-Block mit allen URLs gefüllt
- [ ] CV-PDF im Ordner und nach Deploy erreichbar unter `…/mirantus-health/cv-nina-panknin.pdf`
- [ ] Seite öffnen im Inkognito → Page-Visit-Push kommt
- [ ] CV-Button klicken → PDF lädt + Download-Push kommt
- [ ] QR-Code scannen → CV lädt + Download-Push kommt mit `src=qr`
- [ ] Beide Zertifikat-Karten öffnen die PDFs
- [ ] Sprache-Toggle DE/EN funktioniert
- [ ] Cal.com-Embed zeigt Slots
- [ ] Pablo klicken → Sprechblase erscheint 🐕
- [ ] Mobile-Ansicht prüfen (iPhone Safari)

---

## 8 · Was an Mirantus Health verschickt wird

1. **Anschreiben** ([`anschreiben.md`](./anschreiben.md) → als PDF exportieren) — verweist auf das Dashboard
2. **Lebenslauf** ([`cv-nina-panknin.md`](./cv-nina-panknin.md) → als PDF rendern)
3. **Zertifikat KI-Analystin** ✅ liegt im Ordner
4. **Zertifikat KI-Beraterin** ✅ liegt im Ordner
5. **Bewerbungs-Dashboard-URL** als Link im Anschreiben + im Karriereportal-Freitextfeld

> Mirantus verlangt Bewerbung über ihr Karriereportal — mit Gehaltsvorstellung (**55–60k**), Anschreiben, CV, Zeugnissen.

---

**Erwartete Wirkung:** sie öffnen die URL → Telegram-Push → du weißt wann's losgeht. Sie laden CV → noch ein Push. Sie buchen Termin → bestätigt das Interesse. Closed-Loop-Bewerbung.
