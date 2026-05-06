# Setup-Toolkit (Python)

Automatisches Deployment des n8n-Chat-Workflows + End-to-End-Tests.

## Quickstart

```bash
cd setup/python
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.sample .env
# .env mit echten Werten füllen (n8n API-Key, Mistral, Nextcloud, JWT_SECRET)

python deploy_chat_workflow.py     # legt Credentials + Workflow in n8n an, aktiviert
python test_auth_flow.py           # Magic-Link-Flow gegen Auth-Service testen
python test_chat_webhook.py        # Chat-Webhook mit echtem JWT testen
python test_e2e.py                 # End-to-End: Auth → Chat → Nextcloud-Notification
```

## .env-Variablen

| Variable | Wozu |
|---|---|
| `N8N_BASE_URL` | URL deiner n8n-Instanz |
| `N8N_API_KEY` | n8n REST API-Key (Settings → API → Create) |
| `WEBHOOK_PROD_URL` | Production-Webhook (für Live-Calls) |
| `WEBHOOK_TEST_URL` | Test-Webhook (nur aktiv wenn Workflow im Editor offen) |
| `AUTH_BASE_URL` | Coolify-Domain des Auth-Service |
| `MISTRAL_API_KEY` | Mistral API-Key (mistral.ai → Console) |
| `NEXTCLOUD_BOT_USER` | User-Name des Nextcloud-Bots |
| `NEXTCLOUD_BOT_APP_PASSWORD` | App-Password (Nextcloud → Security) |
| `NEXTCLOUD_TALK_ROOM_TOKEN` | Token des Talk-Raums (URL-Suffix) |
| `JWT_SECRET` | gemeinsames Secret mit Auth-Service (`openssl rand -base64 32`) |
| `SMTP_*` | All-inkl SMTP-Daten (für Send-Email-Node in n8n) |
| `ALLOWED_ORIGIN` | https://ninalearnsvibecoding.com |
| `TEST_EMAIL` | Mail-Adresse für E2E-Tests |
