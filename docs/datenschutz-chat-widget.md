# Datenschutzhinweise — Chat-Widget

> **Vorlage** zum Einfügen in die bestehende Datenschutzerklärung von ninalearnsvibecoding.com.
> Bitte vor Veröffentlichung von einem Datenschutzbeauftragten / Anwalt prüfen lassen.

---

## Verantwortliche Stelle

Nina Panknin
[Adresse + Postleitzahl + Stadt]
ciao@ninalearnsvibecoding.com

## Welche Daten werden im Chat-Widget verarbeitet?

| Daten | Zweck | Rechtsgrundlage | Speicherdauer |
|-------|-------|-----------------|---------------|
| Email-Adresse | Authentifizierung per Magic-Link, persönliche Antwort durch Nina | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) | 30 Tage |
| 6-stelliger Code (bcrypt-Hash) | Verifikation der Email-Inhaberschaft | Art. 6 Abs. 1 lit. a DSGVO | maximal 1 Stunde |
| Chat-Nachrichten | Beantwortung deiner Anfrage durch KI-Bot | Art. 6 Abs. 1 lit. a DSGVO | nur in flüchtigem Arbeitsspeicher (n8n), max. 30 Min Inaktivität |
| Einwilligungs-Log (gehashte IP) | Nachweis der Einwilligung gem. Art. 7 Abs. 1 DSGVO | Art. 6 Abs. 1 lit. c DSGVO (rechtl. Pflicht) | 3 Jahre |
| Notification an Nina (Email / Nextcloud) | Persönliche Rückmeldung bei Bot-Eskalation | Art. 6 Abs. 1 lit. a DSGVO | unbegrenzt; auf Anfrage löschbar |

**Datenminimierung:** Klartext-IP-Adressen werden NICHT gespeichert — nur SHA-256-Hashes mit Salt zur Audit-Nachvollziehbarkeit. Cookies werden im Chat-Widget nicht gesetzt; ausschließlich `localStorage` zur Speicherung der Sitzung im Browser.

## Auftragsverarbeiter

Folgende Dienstleister verarbeiten Daten in unserem Auftrag:

- **Mistral AI SAS**, Paris, Frankreich — KI-Inferenz für Chat-Antworten. EU-Server in Frankreich, kein Drittlandstransfer (kein US-Routing). Auftragsverarbeitungsvertrag (AVV) abgeschlossen. Mistral speichert API-Eingaben nicht und nutzt sie nicht zum Training.
- **All-inkl.com (Pulheim, Deutschland)** — SMTP-Versand der Authentifizierungs-Codes. Deutscher Hostinganbieter, vollständig DSGVO-konform.
- **Eigene Infrastruktur (Coolify)** in Deutschland — Auth-Service, n8n-Workflow, Nextcloud-Notification-Empfang. Selbst gehostet auf deutschen Servern.

## Hinweise nach EU-AI-Act (Art. 50)

Du chattest in diesem Widget mit einem **Künstliche-Intelligenz-System (Chatbot)**. Das wird dir vor Beginn des Chats deutlich angezeigt sowie permanent während der Konversation als Hinweis-Banner. Antworten werden automatisch generiert, können fehlerhaft sein und ersetzen keine persönliche Auskunft. Bei sicherheitsrelevanten oder rechtlichen Fragen wende dich direkt an Nina unter `ciao@ninalearnsvibecoding.com`.

## Cookies / Browser-Speicher

Das Chat-Widget setzt **keine Cookies**. Folgende Daten werden in deinem Browser-`localStorage` gespeichert (nur lokal, nicht serverseitig zugänglich):

- `nlvc_chat_session_id` — anonyme UUID, identifiziert deine aktuelle Konversation
- `nlvc_chat_jwt` — Access-Token (24h gültig, vom Auth-Service ausgestellt)
- `nlvc_chat_email` — die von dir bestätigte Email für künftige Logins
- `nlvc_chat_consent` — Zeitpunkt und Version deiner Einwilligung
- `nlvc_chat_messages` — letzte 50 Nachrichten deiner Konversation

Du kannst diese Daten jederzeit über die Browser-Einstellungen (Daten löschen → localStorage) entfernen.

## Deine Rechte

Du hast jederzeit das Recht auf:

- **Auskunft** über deine gespeicherten Daten (Art. 15 DSGVO)
- **Löschung** (Art. 17 DSGVO) — schreib mir an `ciao@ninalearnsvibecoding.com` mit dem Betreff „Chat-Widget Daten löschen" und deiner Email-Adresse. Löschung erfolgt innerhalb von 7 Werktagen.
- **Datenübertragbarkeit** (Art. 20 DSGVO)
- **Widerruf der Einwilligung** mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)
- **Beschwerde bei einer Aufsichtsbehörde** (z.B. Berliner Beauftragte für Datenschutz und Informationsfreiheit)

## Sicherheit

- Übertragung ausschließlich verschlüsselt (TLS 1.2+)
- Codes werden als bcrypt-Hash gespeichert, niemals im Klartext
- JWT-Tokens sind kryptographisch signiert (HS256), Lifetime 24 Stunden
- Rate-Limiting verhindert Brute-Force-Versuche

## Kontakt

Bei Fragen zum Chat-Widget oder zur Datenverarbeitung:
**ciao@ninalearnsvibecoding.com**
