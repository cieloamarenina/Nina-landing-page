# Hand-Off: Hanteltraining_Nina · Workout-App

**Stand:** 31. Mai 2026
**Repo:** GitHub → Coolify Deploy
**Ziel-Route:** `https://ninalearnsvibecoding.com/hanteltraining/`
**Tech-Stack:** statisches HTML/JS/CSS (Frontend) + n8n + NocoDB (Backend, optional)

---

## 0 · Architektur

```
┌──────────────────────────────────────────────────────────────┐
│                    Coolify (Hetzner)                          │
│                                                                │
│   FRONTEND (statisch)        BACKEND (optional, Phase 2)     │
│   ├─ index.html              ├─ n8n Webhooks                 │
│   ├─ hanteltraining/         │   ├─ /workout-visit           │
│   │  ├─ index.html           │   └─ /workout-complete        │
│   │  └─ config.js            └─ NocoDB: nina_workouts        │
│   └─ assets/pablo.jpg                                         │
└──────────────────────────────────────────────────────────────┘
        ▲
        │ fetch (optional Background-Sync)
   Browser-Client + localStorage (primärer Cache)
```

### Frontend
- Statische HTML/JS/CSS, kein Build-Tool
- Coolify deployt aus GitHub als Static Site
- localStorage primär (offline-fähig)
- Optional: fetch zu n8n-Webhooks im Hintergrund

### Backend (Phase 2)
- n8n auf eigenem Coolify-Service
- 2 Webhooks: visit + complete
- NocoDB-Tabelle `nina_workouts`

### Konfiguration
- `.env` (Root, NICHT committen) = Single Source of Truth
- `hanteltraining/config.js` = Frontend-Config, aus `.env` synchronisiert
- Backend liest eigene Env in Coolify-Settings

---

## 1 · Aktueller Stand `hanteltraining/index.html`

Single-Page Workout-App, vollständig clientseitig:
- **4 Phasen** mit 16 Übungen (Warmup, Beine/Po, Bauch/Arme, Cool-down)
- Animierte SVG-Strichmännchen
- Set-Tracker mit localStorage
- Pausen-Timer (30-45s) + Hold-Timer für statische Übungen
- Workout-Stoppuhr live
- Verlauf-Modal mit Stats + Notes
- Pablo Player (Default-Variante mit 🐕 Emoji + Spotify-Embed, draggable, Playlist-Dropdown)
- Sound-Toggle, Toast-Notifications, Dark-Mode, mobile-responsive

Vanilla JS, Arial, CSS-Variablen für Farben.

---

## 2 · Frontend-Tasks (separate Commits)

### Task F1 — Workout-HTML deployen ✓
Bereits erledigt durch initialen `cp` + Commit oben.

### Task F2 — Pablo Player Swap [WICHTIG]

Auf der bestehenden Landingpage (`index.html` im Root) gibt es einen Pablo Player mit echtem Pablo-Foto + Spotify-Embed. Den 1:1 in `hanteltraining/index.html` übernehmen statt der Default-Variante mit Emoji.

**Schritt 1: Lies die Landingpage** und identifiziere:
- den Toggle-Button (Bild oder Foto, nicht Emoji)
- den Player-Container
- alle zugehörigen CSS-Klassen
- ggf. JS-Logik wenn er eigene hat

**Schritt 2: Ersetze in `hanteltraining/index.html`:**

Aktuelle Toggle-Button-Stelle:
```html
<button class="pablo-toggle" id="pablo-toggle" title="Pablo Player">🐕</button>
```
→ mit der echten Pablo-Variante (Bild via `src="../assets/pablo.jpg"` oder wo das Foto liegt — bitte Pfad anpassen)

Aktuelle Player-Container-Stelle:
```html
<div class="pablo-player" id="pablo-player">
  ...
</div>
```
→ mit Ninas echtem Player-Block

CSS-Klassen anpassen damit der Look konsistent ist.

**Wichtig erhalten bleiben (nicht refactorn):**
- Drag & Drop-Logik: `makePabloDraggable()`, `restorePabloPosition()`
- Playlist-Dropdown: `initPablolists()`, `changePablolist()`
- localStorage-Keys: `pablo_player_pos`, `pablo_playlist_idx`

**Falls die Landingpage-Implementation stark anders ist** (z.B. Custom-Audio-Player statt Spotify-Embed): Nina kurz fragen wie der Swap aussehen soll.

`git commit -m "feat: use real pablo player on workout page"`

### Task F3 — Menu-Button auf Landingpage [klein]

In der Landingpage `index.html` (Root) oben rechts in der Navigation einen Button/Link einbauen:
```html
<a href="/hanteltraining/" class="...">💪 Hanteltraining</a>
```

Style an die bestehenden Nav-Buttons anpassen.

`git commit -m "feat: add hanteltraining menu button to landing nav"`

### Task F4 — Echte Spotify-Playlists

In `hanteltraining/index.html` das Array `pabloPlaylists` durch Werte aus `config.js` ersetzen.

Aktuell hardcoded:
```js
const pabloPlaylists = [
  { id: '2R10VQvUU02ga3185KXjR6', name: 'Top All-Time' },
  ...
];
```

Refactored:
```js
const pabloPlaylists = window.NINA_CONFIG?.SPOTIFY_PLAYLISTS || [];
```

Echte Playlist-IDs aus Spotify-URL extrahieren: `https://open.spotify.com/playlist/XXX?si=...` → ID ist `XXX`. Nina muss diese liefern.

`git commit -m "feat: spotify playlists from config"`

### Task F5 — 5-Sprachen i18n (DE/EN/ES/FR/IT)

**Großer Brocken — in 3 Sub-Commits.**

#### F5a: i18n-Struktur + Sprach-Selector
- Translations-Object mit allen Strings in 5 Sprachen
- Sprach-Selector im Header (kompakte Tabs `DE EN ES FR IT`)
- localStorage-Key `nina_workout_lang` (Default aus `NINA_CONFIG.DEFAULT_LANG`)
- Verfügbare Sprachen aus `NINA_CONFIG.ENABLED_LANGS`

#### F5b: Render-Logik
- `renderPhase()` und `renderExercise()` lesen aus i18n-Bucket
- Live re-render bei Sprach-Wechsel
- `toLocaleDateString` mit Locale-Code

#### F5c: Übersetzungen einpflegen (~115 Strings × 5 Sprachen)

Übersetzungs-Scope:
- UI: Titel, Subtitle, Buttons, Progress-Labels, Tabs, Phasen-Meta, Modals, Stats, Toasts, Empty State
- 16 Übungen: jeweils Name, Reps, Weight, Description
- 4 Phasen: Titel + Meta

**Idiomatische Übersetzungen anatomischer Begriffe (wichtig!):**
| DE | EN | ES | FR | IT |
|---|---|---|---|---|
| Reiterhosen | saddlebags | cartucheras | culottes de cheval | cuscinetti |
| Hüftspeck | muffin top | michelines | poignées d'amour | maniglie dell'amore |
| Winkearme | bingo wings | brazos flácidos | bras qui pendent | braccia flaccide |

`git commit -m "feat: i18n support for 5 languages"`

### Task F6 — config.js anbinden

Erstelle `hanteltraining/config.js`:
```js
window.NINA_CONFIG = {
  DEFAULT_LANG: 'de',
  ENABLED_LANGS: ['de', 'en', 'es', 'fr', 'it'],
  SPOTIFY_PLAYLISTS: [
    { id: '2R10VQvUU02ga3185KXjR6', name: 'Top All-Time' }
    // weitere Playlists hier
  ],
  PABLO_IMAGE_PATH: '../assets/pablo.jpg',
  TRACKING_ENABLED: false,
  WEBHOOK_VISIT: '',
  WEBHOOK_COMPLETE: ''
};
```

In `hanteltraining/index.html` vor allen anderen Scripts einbinden:
```html
<script src="config.js"></script>
```

Werte werden manuell aus `.env` gesynct (oder per Coolify Pre-Deploy-Script).

`git commit -m "feat: config.js for frontend configuration"`

---

## 3 · Backend-Tasks (Phase 2, LATER — jetzt skippen)

Aktuell `TRACKING_ENABLED=false`. Frontend hat Stub-Hooks vorbereitet.

### Task B1 — NocoDB-Tabelle `nina_workouts`

Spalten:
| Name | Typ | Zweck |
|---|---|---|
| id | PK auto | |
| created_at | DateTime auto | |
| event_type | Select | `visit` oder `complete` |
| session_date | DateTime | |
| duration_min | Number | |
| sets_completed | Number | |
| sets_total | Number | |
| completion_pct | Number | |
| phases_json | LongText | |
| note | LongText | |
| user_agent | Text | |
| referrer | Text | |

### Task B2 — n8n-Workflow

Zwei Webhooks:
- `POST /webhook/workout-visit` → NocoDB Insert `event_type=visit`
- `POST /webhook/workout-complete` → NocoDB Insert `event_type=complete`

Body Schema von Frontend:
```json
{
  "event": "complete",
  "session_date": "2026-05-31T08:30:00Z",
  "duration": 28,
  "completed": 35,
  "total": 37,
  "phases": {...},
  "note": "..."
}
```

Schutz: Rate-Limiting in n8n, CORS-Restriction auf Domain.

### Task B3 — Tracking-Hooks aktivieren

In `saveWorkoutSession()` und beim Page-Load fetch-Calls einbauen wenn `NINA_CONFIG.TRACKING_ENABLED`.

---

## 4 · `.env` Spec

Siehe `.env.example`. Werte werden manuell in `hanteltraining/config.js` übertragen.

**Frontend (sichtbar im Browser, keine Secrets):**
- `DEFAULT_LANG`, `ENABLED_LANGS`
- `SPOTIFY_PLAYLISTS`
- `PABLO_IMAGE_PATH`
- `TRACKING_ENABLED`, `WEBHOOK_VISIT`, `WEBHOOK_COMPLETE`

**Backend (geheim, nur in n8n-Coolify):**
- `NOCODB_URL`, `NOCODB_API_TOKEN`, `NOCODB_TABLE_ID`, `NOCODB_PROJECT_ID`

---

## 5 · Verifikations-Checkliste

### Frontend
- [ ] `https://ninalearnsvibecoding.com/hanteltraining/` lädt
- [ ] Menu-Button auf Landingpage sichtbar oben rechts, linkt korrekt
- [ ] Pablo Player zeigt echtes Foto (nicht Emoji)
- [ ] Pablo Player draggable (Desktop + Mobile)
- [ ] Spotify-Playlists sind Ninas echte
- [ ] Sprach-Selector 5 Sprachen, alle vollständig
- [ ] Workout-Stoppuhr läuft, Hold-Timer haken automatisch ab
- [ ] Workout-Verlauf bleibt nach Reload
- [ ] Mobile-Layout sauber (iPhone + iPad)
- [ ] Console ohne Errors

---

## 6 · Constraints

- **Keine Build-Tools, keine npm** — vanilla HTML/JS/CSS
- **Schriftart Arial** (Ninas Preference)
- **Step-by-step** vorgehen, separate Commits pro Task
- **Minimal changes**, kein Refactoring unrelated Code
- **Bei Unklarheit oder zwei Ansätzen** kurz Nina fragen
- **Backend-Tasks B1-B3 jetzt skippen**, nur Frontend F1-F6
