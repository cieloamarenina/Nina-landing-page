// Public config — no secrets. The Windy/Pexels API keys live server-side in the
// n8n proxy (workflow "Aether Wetter-App — API Proxy"); the browser only ever
// talks to this webhook, never to the upstream APIs directly.
export const CONFIG = {
  PROXY: "https://n8n.ninalearnsvibecoding.com/webhook/wx-proxy",
};
