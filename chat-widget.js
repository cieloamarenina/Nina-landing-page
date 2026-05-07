/* Chat Widget — Nina Learns Vibe Coding */
/* Spec: docs/superpowers/specs/2026-05-06-chat-widget-design.md */

(function () {
  'use strict';

  // ==========================================================================
  // CONFIG — replace these URLs in production / staging if different
  // ==========================================================================
  const AUTH_BASE = 'https://auth.ninalearnsvibecoding.com';
  const WEBHOOK_URL = 'https://n8n.ninalearnsvibecoding.com/webhook/8b1a11fc-6362-44c4-8422-7eb8b13e8d3e';
  const CONSENT_VERSION = '1.0';
  const VERSION_URL = '/version.json';
  const VERSION_CHECK_INTERVAL_MS = 60_000;

  const STORAGE = {
    sid: 'nlvc_chat_session_id',
    jwt: 'nlvc_chat_jwt',
    email: 'nlvc_chat_email',
    consent: 'nlvc_chat_consent',
    messages: 'nlvc_chat_messages',
    expiresAt: 'nlvc_chat_jwt_expires',
  };

  // ==========================================================================
  // i18n
  // ==========================================================================
  const I18N = {
    de: {
      consent: 'Du chattest gleich mit einer KI. Eingaben werden zur Beantwortung verarbeitet (Mistral AI, EU-Server in Frankreich) und Nina per Email weitergeleitet. Email + Frage werden 30 Tage gespeichert.',
      consent_accept: 'Akzeptieren & weiter',
      email_label: 'Deine Email-Adresse',
      email_submit: 'Code senden',
      code_sent: 'Code wurde an dich geschickt. Bitte eintragen:',
      code_label: '6-stelliger Code',
      code_submit: 'Bestätigen',
      greeting: "Hallo! Wie geht's dir heute? Wie kann ich dir helfen, was interessiert dich?",
      placeholder: 'Schreib eine Nachricht…',
      send: 'Senden',
      thinking: 'Denkt nach…',
      disclaimer: '🤖 Du chattest mit einer KI',
      err_generic: "Hoppla, da war ein Schluckauf. Versuch's gleich nochmal.",
      err_jwt: 'Sitzung abgelaufen. Bitte melde dich erneut an.',
      err_rate: "Zu viele Anfragen. Versuch's in ein paar Minuten erneut.",
      err_email: 'Bitte gib eine gültige Email-Adresse ein.',
      err_code: "Code passt nicht. Versuch's nochmal.",
      tooltip: 'Chat mit mir 💬',
    },
    en: {
      consent: "You're about to chat with an AI. Inputs are processed for replies (Mistral AI, EU servers in France) and forwarded to Nina by email. Email and question stored for 30 days.",
      consent_accept: 'Accept & continue',
      email_label: 'Your email',
      email_submit: 'Send code',
      code_sent: 'Code was sent. Please enter:',
      code_label: '6-digit code',
      code_submit: 'Verify',
      greeting: 'Hi! How are you doing today? How can I help — what are you curious about?',
      placeholder: 'Type a message…',
      send: 'Send',
      thinking: 'Thinking…',
      disclaimer: "🤖 You're chatting with an AI",
      err_generic: 'Oops, hiccup on our side. Try again in a sec.',
      err_jwt: 'Session expired. Please sign in again.',
      err_rate: 'Too many requests. Try again in a few minutes.',
      err_email: 'Please enter a valid email.',
      err_code: "Code doesn't match. Try again.",
      tooltip: 'Chat with me 💬',
    },
    fr: {
      consent: "Tu vas chatter avec une IA. Les saisies sont traitées pour répondre (Mistral AI, serveurs EU en France) et transmises à Nina par e-mail. Email et question conservés 30 jours.",
      consent_accept: 'Accepter & continuer',
      email_label: 'Ton email',
      email_submit: 'Envoyer le code',
      code_sent: 'Code envoyé. Saisis-le :',
      code_label: 'Code à 6 chiffres',
      code_submit: 'Valider',
      greeting: "Salut ! Comment vas-tu aujourd'hui ? Comment puis-je t'aider, qu'est-ce qui t'intéresse ?",
      placeholder: 'Écris un message…',
      send: 'Envoyer',
      thinking: 'Réfléchit…',
      disclaimer: '🤖 Tu chattes avec une IA',
      err_generic: 'Oups, petit hoquet. Réessaie tout de suite.',
      err_jwt: 'Session expirée. Reconnecte-toi.',
      err_rate: 'Trop de requêtes. Réessaie dans quelques minutes.',
      err_email: 'Email invalide.',
      err_code: 'Code incorrect. Réessaie.',
      tooltip: 'Chatte avec moi 💬',
    },
    es: {
      consent: 'Vas a chatear con una IA. Las entradas se procesan para responder (Mistral AI, servidores EU en Francia) y se envían a Nina por email. Email y pregunta guardados 30 días.',
      consent_accept: 'Aceptar y continuar',
      email_label: 'Tu email',
      email_submit: 'Enviar código',
      code_sent: 'Código enviado. Ingrésalo:',
      code_label: 'Código de 6 dígitos',
      code_submit: 'Verificar',
      greeting: '¡Hola! ¿Cómo estás hoy? ¿En qué puedo ayudarte, qué te interesa?',
      placeholder: 'Escribe un mensaje…',
      send: 'Enviar',
      thinking: 'Pensando…',
      disclaimer: '🤖 Estás chateando con una IA',
      err_generic: 'Ups, un pequeño hipo. Inténtalo de nuevo.',
      err_jwt: 'Sesión expirada. Vuelve a iniciar.',
      err_rate: 'Demasiadas solicitudes. Espera unos minutos.',
      err_email: 'Email inválido.',
      err_code: 'Código incorrecto. Inténtalo de nuevo.',
      tooltip: 'Chatea conmigo 💬',
    },
    it: {
      consent: "Stai per chattare con un'IA. Gli input vengono elaborati per la risposta (Mistral AI, server EU in Francia) e inviati a Nina via email. Email e domanda conservati 30 giorni.",
      consent_accept: 'Accetta e continua',
      email_label: 'La tua email',
      email_submit: 'Invia codice',
      code_sent: 'Codice inviato. Inseriscilo:',
      code_label: 'Codice a 6 cifre',
      code_submit: 'Verifica',
      greeting: 'Ciao! Come stai oggi? Come posso aiutarti, cosa ti interessa?',
      placeholder: 'Scrivi un messaggio…',
      send: 'Invia',
      thinking: 'Sto pensando…',
      disclaimer: "🤖 Stai chattando con un'IA",
      err_generic: 'Ops, piccolo intoppo. Riprova subito.',
      err_jwt: 'Sessione scaduta. Accedi di nuovo.',
      err_rate: 'Troppe richieste. Riprova tra qualche minuto.',
      err_email: 'Email non valida.',
      err_code: 'Codice errato. Riprova.',
      tooltip: 'Chatta con me 💬',
    },
  };

  // ==========================================================================
  // State helpers
  // ==========================================================================
  function getLang() {
    return localStorage.getItem('nlvc_lang') || 'en';
  }

  function t() {
    return I18N[getLang()] || I18N.en;
  }

  function uuid4() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  function getSessionId() {
    let s = localStorage.getItem(STORAGE.sid);
    if (!s) {
      s = uuid4();
      localStorage.setItem(STORAGE.sid, s);
    }
    return s;
  }

  function getMessages() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.messages) || '[]');
    } catch {
      return [];
    }
  }

  function saveMessages(arr) {
    localStorage.setItem(STORAGE.messages, JSON.stringify(arr.slice(-50)));
  }

  function jwtValid() {
    const exp = parseInt(localStorage.getItem(STORAGE.expiresAt) || '0', 10);
    return !!localStorage.getItem(STORAGE.jwt) && exp > Date.now() / 1000;
  }

  function clearAuth() {
    localStorage.removeItem(STORAGE.jwt);
    localStorage.removeItem(STORAGE.expiresAt);
  }

  // ==========================================================================
  // DOM helper
  // ==========================================================================
  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'class') e.className = v;
        else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'style') e.setAttribute('style', v);
        else if (v != null) e.setAttribute(k, v);
      });
    }
    kids.flat().forEach(k => {
      if (k == null) return;
      e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
    });
    return e;
  }

  // ==========================================================================
  // Build widget
  // ==========================================================================
  let card, messagesEl, inputEl, lastSendAt = 0;

  function build() {
    const tx = t();

    // Stage: consent
    const consentStage = el('div', { class: 'chat-stage', 'data-stage': 'consent' },
      el('div', { class: 'chat-consent' },
        el('p', { html: tx.consent }),
        el('button', {
          type: 'button',
          onClick: () => {
            localStorage.setItem(STORAGE.consent, JSON.stringify({
              accepted_at: new Date().toISOString(),
              version: CONSENT_VERSION,
            }));
            show('email');
          },
        }, tx.consent_accept)
      )
    );

    // Stage: email
    const emailInput = el('input', {
      type: 'email',
      placeholder: 'name@example.com',
      autocomplete: 'email',
      required: 'required',
    });
    const emailErr = el('div', { class: 'chat-error' });
    const honeypot = el('input', {
      type: 'text', name: 'website', class: 'chat-honeypot',
      autocomplete: 'off', tabindex: '-1',
    });
    const emailForm = el('form', {
      class: 'chat-email-form',
      onSubmit: async (e) => {
        e.preventDefault();
        emailErr.textContent = '';
        const email = emailInput.value.trim().toLowerCase();
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          emailErr.textContent = t().err_email;
          return;
        }
        try {
          const consent = JSON.parse(localStorage.getItem(STORAGE.consent) || '{}');
          const r = await fetch(`${AUTH_BASE}/auth/request-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, lang: getLang(), consent }),
          });
          if (r.status === 429) { emailErr.textContent = t().err_rate; return; }
          if (!r.ok) { emailErr.textContent = t().err_generic; return; }
          localStorage.setItem(STORAGE.email, email);
          show('code');
        } catch {
          emailErr.textContent = t().err_generic;
        }
      },
    },
      el('label', null, tx.email_label),
      emailInput,
      emailErr,
      honeypot,
      el('button', { type: 'submit' }, tx.email_submit)
    );
    const emailStage = el('div', { class: 'chat-stage', 'data-stage': 'email' }, emailForm);

    // Stage: code
    const codeInput = el('input', {
      type: 'text',
      inputmode: 'numeric',
      pattern: '[0-9]{6}',
      maxlength: '6',
      placeholder: '123456',
    });
    const codeErr = el('div', { class: 'chat-error' });
    const codeForm = el('form', {
      class: 'chat-code-form',
      onSubmit: async (e) => {
        e.preventDefault();
        codeErr.textContent = '';
        const code = codeInput.value.trim();
        if (!/^\d{6}$/.test(code)) {
          codeErr.textContent = t().err_code;
          return;
        }
        try {
          const r = await fetch(`${AUTH_BASE}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: localStorage.getItem(STORAGE.email),
              code,
            }),
          });
          if (!r.ok) {
            codeErr.textContent = t().err_code;
            return;
          }
          const data = await r.json();
          localStorage.setItem(STORAGE.jwt, data.jwt);
          localStorage.setItem(STORAGE.expiresAt, String(data.expires_at));
          show('chat');
          ensureGreeting();
        } catch {
          codeErr.textContent = t().err_generic;
        }
      },
    },
      el('p', null, tx.code_sent),
      el('label', null, tx.code_label),
      codeInput,
      codeErr,
      el('button', { type: 'submit' }, tx.code_submit)
    );
    const codeStage = el('div', { class: 'chat-stage', 'data-stage': 'code' }, codeForm);

    // Stage: chat
    messagesEl = el('div', { class: 'chat-messages' });
    inputEl = el('input', { type: 'text', class: 'chat-input', placeholder: tx.placeholder });
    const sendBtn = el('button', { type: 'button', class: 'chat-send-btn' }, tx.send);
    const inputArea = el('div', { class: 'chat-input-area' }, inputEl, sendBtn);
    const disclaimer = el('div', { class: 'chat-disclaimer' }, tx.disclaimer);
    const chatStage = el('div', { class: 'chat-stage', 'data-stage': 'chat' },
      messagesEl, inputArea, disclaimer
    );

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

    // Scene + close button
    const closeBtn = el('button', {
      class: 'chat-close-btn', type: 'button',
      'aria-label': 'Close',
      onClick: (e) => { e.stopPropagation(); close(); },
    }, '×');
    const scene = el('div', { class: 'chat-scene' },
      el('div', { class: 'caustic-waves' }),
      closeBtn
    );

    const body = el('div', { class: 'chat-body' },
      consentStage, emailStage, codeStage, chatStage
    );

    card = el('div', {
      class: 'chat-invite',
      role: 'button',
      tabindex: '0',
      'aria-label': 'Open chat',
    }, scene, body);

    card.addEventListener('click', e => {
      if (card.classList.contains('expanded')) return;
      if (e.target.closest('.chat-body') || e.target.closest('.chat-close-btn')) return;
      open();
    });
    card.addEventListener('keydown', e => {
      if (card.classList.contains('expanded')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && card.classList.contains('expanded')) close();
    });

    return card;
  }

  // ==========================================================================
  // Stage management
  // ==========================================================================
  function show(stage) {
    document.querySelectorAll('.chat-stage').forEach(s => {
      s.classList.toggle('active', s.dataset.stage === stage);
    });
  }

  function open() {
    card.classList.add('expanded');
    if (!localStorage.getItem(STORAGE.consent)) {
      show('consent');
    } else if (!jwtValid()) {
      clearAuth();
      show(localStorage.getItem(STORAGE.email) ? 'code' : 'email');
    } else {
      show('chat');
      ensureGreeting();
    }
  }

  function close() {
    card.classList.remove('expanded');
  }

  function ensureGreeting() {
    const msgs = getMessages();
    if (msgs.length === 0) {
      msgs.push({ role: 'bot', content: t().greeting, ts: Date.now() });
      saveMessages(msgs);
    }
    renderMessages();
  }

  function renderMessages() {
    if (!messagesEl) return;
    messagesEl.innerHTML = '';
    getMessages().forEach(m => {
      const b = document.createElement('div');
      b.className = `chat-bubble ${m.role}`;
      b.textContent = m.content;
      messagesEl.appendChild(b);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendError(text) {
    if (!messagesEl) return;
    const e = document.createElement('div');
    e.className = 'chat-bubble bot';
    e.style.opacity = '0.7';
    e.textContent = text;
    messagesEl.appendChild(e);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ==========================================================================
  // Send message
  // ==========================================================================
  async function sendMessage() {
    const now = Date.now();
    if (now - lastSendAt < 2000) return;
    const txt = inputEl.value.trim();
    if (!txt) return;
    lastSendAt = now;
    inputEl.value = '';

    const msgs = getMessages();
    msgs.push({ role: 'user', content: txt, ts: Date.now() });
    saveMessages(msgs);
    renderMessages();

    const thinking = document.createElement('div');
    thinking.className = 'chat-bubble bot';
    thinking.style.opacity = '0.6';
    thinking.textContent = t().thinking;
    messagesEl.appendChild(thinking);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const r = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(STORAGE.jwt)}`,
        },
        body: JSON.stringify({
          session_id: getSessionId(),
          message: txt,
          lang: getLang(),
          honeypot: '',
        }),
      });
      thinking.remove();

      if (r.status === 401) {
        clearAuth();
        show('email');
        appendError(t().err_jwt);
        return;
      }
      if (r.status === 429) { appendError(t().err_rate); return; }
      if (!r.ok) { appendError(t().err_generic); return; }

      const data = await r.json();
      const reply = (data.reply || '').trim() || t().err_generic;
      const m = getMessages();
      m.push({ role: 'bot', content: reply, ts: Date.now() });
      saveMessages(m);
      renderMessages();
    } catch {
      thinking.remove();
      appendError(t().err_generic);
    }
  }

  // ==========================================================================
  // Auto-update — poll version.json, reload page when version changes
  // ==========================================================================
  async function checkForUpdates() {
    try {
      const r = await fetch(`${VERSION_URL}?_=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) return;
      const data = await r.json();
      if (!data || !data.version) return;
      const stored = localStorage.getItem('nlvc_site_version');
      if (stored && stored !== data.version) {
        localStorage.setItem('nlvc_site_version', data.version);
        // Reload, but don't interrupt user mid-typing
        if (!card || !card.classList.contains('expanded')) {
          location.reload();
        } else {
          // schedule reload for when user closes the chat
          card.addEventListener('transitionend', function once() {
            if (!card.classList.contains('expanded')) {
              card.removeEventListener('transitionend', once);
              location.reload();
            }
          });
        }
      } else if (!stored) {
        localStorage.setItem('nlvc_site_version', data.version);
      }
    } catch {
      // silent — version check failures should not break the widget
    }
  }

  // ==========================================================================
  // Mount
  // ==========================================================================
  function mount() {
    const container = document.getElementById('chat-widget-container');
    if (!container) {
      console.error('nlvc-chat: #chat-widget-container not found');
      return;
    }
    const tooltip = el('div', { class: 'chat-tooltip' }, t().tooltip);
    container.appendChild(tooltip);
    container.appendChild(build());
  }

  // Re-mount on language change to refresh i18n labels
  document.addEventListener('click', e => {
    if (e.target && e.target.classList && e.target.classList.contains('lang-btn')) {
      // Site's own language switcher — re-render texts after a tick
      setTimeout(() => {
        const container = document.getElementById('chat-widget-container');
        if (container) {
          container.innerHTML = '';
          mount();
        }
      }, 50);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  // Start auto-update polling
  checkForUpdates();
  setInterval(checkForUpdates, VERSION_CHECK_INTERVAL_MS);
})();
