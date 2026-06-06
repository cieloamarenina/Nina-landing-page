from unittest.mock import AsyncMock, patch

import pytest

from auth.email_sender import (
    SUBJECTS,
    _build_subject,
    render_template,
    send_code_email,
)


def test_render_template_de():
    html = render_template("de", "123456")
    assert "123456" in html
    assert "Hallo" in html


def test_render_template_en():
    html = render_template("en", "987654")
    assert "987654" in html
    assert "Hi there" in html


def test_render_template_fallback_to_en():
    html = render_template("xx", "555555")
    assert "555555" in html
    assert "Hi there" in html


@pytest.mark.parametrize("lang", ["de", "en", "fr", "es", "it"])
def test_render_template_all_languages(lang):
    html = render_template(lang, "424242")
    assert "424242" in html


@pytest.mark.parametrize("lang", ["de", "en", "fr", "es", "it"])
def test_build_subject_per_language(lang):
    subject = _build_subject(lang, "123456")
    assert "123456" in subject
    assert subject == SUBJECTS[lang].format(code="123456")


def test_build_subject_unknown_lang_falls_back_to_en():
    assert _build_subject("xx", "123456") == SUBJECTS["en"].format(code="123456")


@pytest.mark.asyncio
async def test_send_code_email_has_plaintext_and_html_parts():
    with patch("auth.email_sender.aiosmtplib.send", new_callable=AsyncMock) as mock_send:
        await send_code_email(
            to="a@b.de",
            code="222333",
            lang="en",
            host="smtp.test",
            port=587,
            user="u",
            password="p",
            sender="Test <noreply@test.de>",
        )
    msg = mock_send.await_args.args[0]
    assert msg["Subject"] == "Your code: 222333"
    # Multipart: a text/plain fallback plus the styled text/html alternative.
    types = {part.get_content_type() for part in msg.walk()}
    assert "text/plain" in types
    assert "text/html" in types


@pytest.mark.asyncio
async def test_send_code_email_calls_smtp():
    with patch("auth.email_sender.aiosmtplib.send", new_callable=AsyncMock) as mock_send:
        await send_code_email(
            to="a@b.de",
            code="111111",
            lang="de",
            host="smtp.test",
            port=587,
            user="u",
            password="p",
            sender="Test <noreply@test.de>",
        )
    mock_send.assert_awaited_once()
    msg = mock_send.await_args.args[0]
    assert msg["To"] == "a@b.de"
    assert "111111" in msg.as_string()
