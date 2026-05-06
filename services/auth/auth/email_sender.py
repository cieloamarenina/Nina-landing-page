from email.message import EmailMessage
from pathlib import Path

import aiosmtplib


I18N_DIR = Path(__file__).parent / "i18n"

SUBJECTS = {
    "de": "Dein Code: {code}",
    "en": "Your code: {code}",
    "fr": "Ton code : {code}",
    "es": "Tu código: {code}",
    "it": "Il tuo codice: {code}",
}


def render_template(lang: str, code: str) -> str:
    """Load HTML template for `lang`; fall back to English if not found."""
    path = I18N_DIR / f"code_email.{lang}.html"
    if not path.exists():
        path = I18N_DIR / "code_email.en.html"
    return path.read_text(encoding="utf-8").replace("{code}", code)


def _build_subject(lang: str, code: str) -> str:
    template = SUBJECTS.get(lang, SUBJECTS["en"])
    return template.format(code=code)


async def send_code_email(
    to: str,
    code: str,
    lang: str,
    host: str,
    port: int,
    user: str,
    password: str,
    sender: str,
) -> None:
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to
    msg["Subject"] = _build_subject(lang, code)
    msg.set_content(f"Your code: {code}\n(Open this email in HTML to see the styled version.)")
    msg.add_alternative(render_template(lang, code), subtype="html")

    await aiosmtplib.send(
        msg,
        hostname=host,
        port=port,
        username=user,
        password=password,
        start_tls=True,
    )
