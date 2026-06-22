# Aether — Wetter-App

Immersive, mobile-first Wetter-PWA: Bogen-Fenster-Hero mit Stadt-Foto (umschaltbar auf echte Live-Cam), wetter-reaktive Animation, 16-Tage-Vorhersage weltweit, Sonnenstand, Städte-Vergleich, Weltkarte mit Live-Temperaturen, Regenradar, „Traumwetter"-Karte, **6 Sprachen** (DE/EN/ES/FR/IT/HE inkl. RTL) und Ninas ziehbarer Pablo-Musikplayer. Reines HTML/CSS/JS, kein Build-Step, kein eigenes Backend (außer dem n8n-Key-Proxy).

## Lokal starten

```bash
npm run serve     # python3 -m http.server 8777
```

Dann http://localhost:8777 öffnen. (Über einen echten Server, nicht `file://` — sonst blocken Embeds.)

## Sicherheit / API-Keys — n8n-Proxy

**Das Frontend enthält KEINE Keys.** Windy (Live-Cams) und Pexels (Stadt-Fotos) werden über einen **n8n-Proxy** aufgerufen; die Keys liegen serverseitig und kommen nie in den Browser.

- **n8n-Workflow:** „Aether Wetter-App — API Proxy (Windy + Pexels)", ID `7d46REne5EqGKHWx` auf `https://n8n.ninalearnsvibecoding.com`.
- **Webhook:** `GET /webhook/wx-proxy?type=cam&lat=&lon=` (Windy) bzw. `?type=photo&q=` (Pexels). CORS offen (`allowedOrigins: *`).
- **Frontend-Config:** `config.js` enthält nur die öffentliche Proxy-URL (kein Secret) → ist committet.
- **Keys (Quelle der Wahrheit):** `.env` (gitignored) — siehe `.env.example`. Dieselben Keys sind im n8n-Workflow hinterlegt.
- **Open-Meteo** (Wetter, Geocoding, Luftqualität) und **RainViewer** (Radar) brauchen keinen Key.

Wenn der Proxy mal nicht erreichbar ist: Wetter/Charts/Karte laufen weiter (Open-Meteo direkt), nur Live-Cam + Stadt-Foto fallen auf den animierten Wetter-Gradient zurück.

## Tests

```bash
npm test          # node --test — 27 Unit-Tests für die Logik-Module
```

Getestet: URL-Builder, Wetter-Code-Mapping, AQI/Formatter, Caching, Parser, i18n (6-Sprach-Parität), Favoriten, Drag-Mathe, Windy-Parser.

## Struktur

```
index.html · css/styles.css · config.js (nur Proxy-URL, kein Secret)
js/  app.js api.js weather-codes.js format.js i18n.js drag.js
     hero.js panel.js charts.js weather-fx.js search.js favorites.js sun.js
     dream.js nav.js compare.js worldmap.js radar.js pablo.js
i18n/ de|en|es|fr|it|he.json
sw.js · manifest.json · icons/ · img/pablo.png
.env (gitignored, Keys) · .env.example
docs/superpowers/specs|plans/  (Design-Spec + Pläne)
```

## In die Landingpage einbauen (`/wetter`)

Self-contained, relative Pfade — Drop-in:

```bash
cp -r <weather-app> /Users/redfish-hr/Stuff/Nina-landing-page/wetter
```

- Menüpunkt in `index.html` (nav-links) ergänzen: `<li><a href="wetter/index.html" data-i18n="nav.weather">Wetter</a></li>`.
- Da `config.js` keine Secrets mehr enthält, ist **keine Geheimnis-Injektion nötig** — die statischen Dateien laufen direkt.
- Deployen via bestehendem Flow: Push auf `origin/main` → Coolify Auto-Deploy (~4–6 Min). Erreichbar unter `…/wetter`.

## Als iPhone-App installieren / teilen

- **Teilen:** einfach die URL verschicken — läuft in jedem Browser.
- **iPhone-App:** in Safari öffnen → **Teilen → Zum Home-Bildschirm**. Dank `manifest.json` + Service Worker: eigenes App-Icon, Vollbild, App-Shell offline-fähig — wie eine native App.

## Features

Start (Hero-Foto + Live-Toggle · stündlich · Parameter · 16-Tage aufklappbar · Sonnenstand · Traumwetter · Charts) · **Karte** (Weltkarte, 30 Städte Live-Temps) · **Radar** (RainViewer animiert) · **Vergleich** (zwei Städte).

## Ehrliche Grenzen

- **Live-Cam-Bild:** ~400px, erneuert sich ~1×/Min (kein flüssiges Video). Nicht jeder Ort hat eine Cam → Foto-Fallback.
- **Pablo-Musik:** läuft im App-Vordergrund; bei gesperrtem iPhone pausiert Web-Audio (iOS-Grenze).
- **Proxy-Abhängigkeit:** Live-Cam + Foto brauchen den n8n-Proxy; fällt er aus, bleibt der Rest der App nutzbar.
