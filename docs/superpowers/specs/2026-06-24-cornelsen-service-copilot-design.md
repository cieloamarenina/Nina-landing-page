# Cornelsen Service Center — AI Copilot (Design / Spec)

**Datum:** 2026-06-24
**Anlass:** Vorstellungsgespräch Cornelsen Verlag, Fr 26.06.2026, 10:00 Uhr
**Gesprächspartnerinnen:** Christine Haase (Leiterin Service Center), Marie Wertenbruch (Sachbearbeiterin Service Center), Josefina Nagy (Recruiting Partnerin)
**Ziel:** Greifbarer, im Gespräch live vorzeigbarer Prototyp, der KI-Unterstützung im Service-Alltag zeigt — als Gesprächsöffner, nicht als fertige Lösung.

## Leitidee

Ein **Service Center AI Copilot**: Eine Kundennachricht wird eingegeben, die KI analysiert sie und schlägt **Kategorie, Dringlichkeit, zuständiges Team, Begründung, fehlende Infos und einen Antwortentwurf** vor. Die finale Prüfung bleibt bewusst bei der Sachbearbeitung („Mensch behält die Kontrolle").

Botschaft: **Unterstützung der Mitarbeitenden, nicht autonome Kundenkommunikation.**

## Umfang: C-light

- **A (Hauptdemo):** Web-Demo funktioniert vollständig und ist der Wow-Moment.
- **B (technischer Beweis):** n8n verarbeitet die Anfrage real (echter GPT-Call, strukturiertes JSON).
- Routing wird **angezeigt**, aber nicht an echte Postfächer geschickt.
- Antworten werden nur **vorgeschlagen**, nie automatisch versendet.
- Ausschließlich **synthetische Beispieldaten**.

## Architektur

```
Browser (statische index.html)          n8n (n8n.ninalearnsvibecoding.com)
┌──────────────────────────┐            ┌─────────────────────────────┐
│  Eingabe-Textfeld         │  POST      │  Webhook /cornelsen-triage  │
│  [Anfrage analysieren]    │ ─────────▶ │         ↓                   │
│  3 Beispiel-Chips         │            │  OpenAI (GPT, JSON-Output)  │
│                           │ ◀───────── │         ↓                   │
│  Ergebnis-Karte rendert   │  JSON      │  Respond to Webhook (CORS)  │
└──────────────────────────┘            └─────────────────────────────┘
        │ Fallback bei Timeout/Fehler ──▶ lokale Demo-Ergebnisse (eingebaut)
```

### Frontend
- Eine einzelne Datei: `bewerbung/cornelsen/index.html`.
- Vanilla HTML/CSS/JS, kein Build-Step — identischer Stil zum Rest der Seite (vgl. `bewerbung/blum-ventures/index.html`).
- Liegt neben den bereits vorhandenen Bewerbungsdokumenten (CV, Anschreiben, Zertifikate).
- Wird über Coolify als Teil von ninalearnsvibecoding.com ausgeliefert → URL: `https://ninalearnsvibecoding.com/bewerbung/cornelsen/`.

### Backend
- n8n-Workflow, Webhook-Pfad `cornelsen-triage` auf `https://n8n.ninalearnsvibecoding.com`.
- Nodes: **Webhook** (POST) → **OpenAI** (GPT, erzwungenes JSON) → **Respond to Webhook** (mit CORS-Headern, da Cross-Origin von ninalearnsvibecoding.com).
- OpenAI-Credential ist in n8n bereits hinterlegt.
- Kein Versand, kein Postfach, kein Ticketsystem.

### Fallback (Pflicht)
- Schlägt der Webhook fehl oder antwortet nicht innerhalb von **8 Sekunden**, rendert das Frontend ein vorbereitetes Ergebnis aus eingebautem JS.
- Für die 3 Beispiel-Chips sind die Fallback-Ergebnisse handkuratiert und perfekt.
- Für freien Text gibt es ein generisches, würdevolles Fallback-Ergebnis (Kategorie „Sonstiges / manuelle Prüfung").
- **Die Live-Demo darf nie von der Verfügbarkeit des Backends abhängen.**

## Ergebnis-Datenstruktur

Die KI liefert exakt dieses Objekt:

```json
{
  "kategorie": "Zugang zu digitalen Produkten",
  "dringlichkeit": "Hoch",
  "team": "Digital-Support",
  "begruendung": "Kundin hat bezahlt, kann das E-Book aber nicht öffnen …",
  "fehlende_infos": ["Bestellnummer", "Verwendeter Webcode"],
  "antwortentwurf": "Sehr geehrte Frau …",
  "freigabe_hinweis": "Freigabe durch Mitarbeitende erforderlich"
}
```

- `dringlichkeit` ∈ { `Niedrig`, `Mittel`, `Hoch` }
- `kategorie` ∈ den 8 unten gelisteten Werten (exakt).

### Kategorie → Team-Mapping (fest im KI-Prompt)

| Kategorie | Empfohlenes Team |
|---|---|
| Bestellung, Versand oder Rechnung | Auftrags- & Rechnungsservice |
| Registrierung und Benutzerkonto | Kundenkonto-Service |
| Zugang zu digitalen Produkten | Digital-Support |
| Webcode oder Lizenz | Lizenzservice |
| Technisches Problem | Technischer Support |
| Produkt- oder Programmanfrage | Produktberatung |
| Datenschutz / rechtliche Frage | Datenschutz & Recht |
| Sonstiges / manuelle Prüfung | Service Center (manuelle Sichtung) |

## Vorbereitete Beispiele (Klick-Chips)

1. „Ich habe den Mathe-Arbeitsheft-Zugang gekauft, aber mein Webcode funktioniert nicht." → **Webcode oder Lizenz**, Hoch
2. „Meine bestellten Hefte sind nach zwei Wochen immer noch nicht da." → **Bestellung, Versand oder Rechnung**, Mittel
3. „Ich möchte wissen, welche Daten Sie über mein Lehrerkonto speichern." → **Datenschutz / rechtliche Frage**, Mittel

## Auftritt & Botschaft

- Cornelsen-nahe, ruhige Optik: klares Blau, viel Weißraum, seriös. Kein verspielter „KI-Bot".
- Sichtbarer Badge „Freigabe durch Mitarbeitende erforderlich" an jedem Antwortentwurf.
- Fußzeile: „Konzeptioneller Prototyp · synthetische Beispieldaten · keine echten Kundendaten · keine automatische Versendung."

## Bewusst nicht enthalten (YAGNI bis Freitag)

Keine echten Postfächer, kein Versand, kein Ticketsystem, keine 8 echten Routing-Pfade, keine echten Kundendaten, kein Login. Nur: Webhook rein → sauberes Ergebnis raus.

## Umsetzungsreihenfolge

1. **Frontend komplett fertig + Fallback** — läuft auch ganz ohne n8n (die Versicherung).
2. **n8n-Workflow** anschließen (echter GPT-Call, CORS, JSON).
3. Nur bei Restzeit: kleines Logging/Counter.

## Gesprächs-Framing (vorbereitete Sätze)

> „Ich wollte nicht nur theoretisch über mögliche Anwendungsfälle sprechen. Deshalb habe ich einen kleinen konzeptionellen Prototyp gebaut. Über eine Weboberfläche kann eine Serviceanfrage eingegeben werden. Ein n8n-Workflow analysiert das Anliegen, schlägt Kategorie, Priorität und zuständiges Team vor und erstellt einen Antwortentwurf. Die finale Prüfung bleibt bewusst bei der Sachbearbeitung."

> „Da ich Ihre tatsächlichen Prozesse, Systeme und Qualitätsanforderungen noch nicht kenne, ist das ausdrücklich keine fertige Lösung, sondern ein Gesprächsöffner."

## Erfolgskriterien

- Web-Demo lädt sofort, drei Beispiele liefern auf Klick ein überzeugendes Ergebnis.
- Freier Text wird real von GPT über n8n klassifiziert.
- Bei Backend-Ausfall bleibt die Demo vollständig vorführbar (Fallback).
- Optik wirkt seriös und Cornelsen-nah; „Mensch entscheidet"-Botschaft ist sichtbar.
