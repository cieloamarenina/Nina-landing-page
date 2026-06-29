# People-Ops Inbox-Triage — Automatisierungs-Demo für Digistore24

Ein **importierbarer Architektur-Prototyp** für einen n8n-basierten People-Operations-Workflow zu einem Prozess, den Digistore24 **wörtlich in der Stellenanzeige nennt**: *„Du bearbeitest die Inbox … Fragen zu Urlaub, Verträgen oder Benefits."*

> **Ehrlicher Status:** Das interaktive Dashboard demonstriert den vollständigen Freigabeprozess mit simulierten Daten. Die produktive n8n-Integration (echter Wait-/Resume-Schritt nach der Telegram-Freigabe, Versand erst nach tatsächlichem Approve) ist **konzeptionell vorbereitet, aber noch nicht live in n8n importiert oder ausgeführt.** Die JSON-Datei zeigt die Architektur, nicht einen produktionsfertigen Workflow.

---

## Ausgangslage

Mitarbeiteranfragen (Urlaub, Verträge, Benefits, Bescheinigungen) landen unsortiert in einer Inbox. Jede wird manuell gelesen, kategorisiert, recherchiert und beantwortet — repetitiv, zeitintensiv, schlecht dokumentiert.

## Lösung

Ein n8n-Workflow übernimmt die Triage, der Mensch behält die Kontrolle:

1. **Anfrage rein** — per Webhook (oder IMAP/Formular) erfasst
2. **KI klassifiziert + entwirft** — Mistral AI ordnet einer Kategorie zu und schreibt einen Antwortentwurf (strukturiertes JSON, mit Konfidenz)
3. **Freigabe-Logik** — heikle/vertragliche Themen *oder* niedrige Konfidenz → **Human-in-the-Loop**; klare Routinefälle → direkter Entwurf
4. **Telegram-Freigabe** — Entwurf wird zur Prüfung gesendet, nichts geht ungeprüft raus
5. **Versand** — freigegebene Antwort per SMTP
6. **Audit-Trail** — jeder Vorgang in NocoDB protokolliert (Kategorie, Konfidenz, Status, Zeitstempel)

## Nutzen

- **Weniger Verwaltung, mehr System** — Routine wird automatisiert, der Mensch entscheidet nur noch, wo es zählt
- **Governance eingebaut** — Human-in-the-Loop + lückenloser Audit-Trail (DSGVO-/Nachvollziehbarkeit)
- **Datenbasis** — die NocoDB-Logs liefern direkt Kennzahlen fürs HR-Reporting (Anfragevolumen, Kategorien, Bearbeitungszeit)
- **Skalierbar & übertragbar** — dasselbe Muster funktioniert für Onboarding-Schritte, Bescheinigungen, Offboarding-Checklisten

---

## Technik

`n8n (self-hosted) · Mistral AI · Telegram (Human-in-the-Loop) · SMTP · NocoDB (Audit-Trail) · REST/Webhook`

Workflow-Datei: [`people-ops-inbox-triage.json`](people-ops-inbox-triage.json) — in n8n importierbar (Architektur-Vorlage).

> Hinweis: Die JSON skizziert die Knoten-Architektur. Für einen echten Human-in-the-Loop fehlt noch ein Wait-/Resume-Schritt (Approve-/Reject-Callback per Webhook), damit der SMTP-Versand erst *nach* tatsächlicher Freigabe erfolgt. Credentials und NocoDB-Tabelle werden beim Import gesetzt; `active: false`.

---

## Für Anschreiben / CV (1–2 Sätze)

> *„Als Arbeitsprobe habe ich einen interaktiven People-Ops-Prototyp gebaut: Mitarbeiteranfragen werden klassifiziert, datenschutzgeprüft und beantwortet, heikle Fälle gehen über eine Human-in-the-Loop-Freigabe, jeder Vorgang landet im Audit-Trail. Genau das Muster, mit dem sich wiederkehrende People-Operations-Aufgaben standardisieren lassen."*
