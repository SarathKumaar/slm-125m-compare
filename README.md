# SLM-125M · Legal/Financial Chat (web app)

A minimal Next.js chat UI for **[Sarath569/slm-125m-legal-chat](https://huggingface.co/Sarath569/slm-125m-legal-chat)**,
a 125M-parameter small language model trained from scratch and instruction-tuned.

The model runs on a **Modal** CPU endpoint (scale-to-zero). This app is just the
frontend + a server-side proxy that holds the shared secret.

```
Browser ──▶ Next.js (Vercel) ──▶ /api/chat (server, holds secret) ──▶ Modal endpoint ──▶ model
```

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (and in `.env.local` for
local dev — copy from `.env.example`):

| Variable | Value |
| --- | --- |
| `MODAL_ENDPOINT` | `https://sarathkumaar569--slm-125m-serve-chatserver-web.modal.run` |
| `SLM_API_KEY` | the shared secret (matches the Modal `slm-app-secret`) |

Both are **server-side only** — they are never exposed to the browser.

## Deploy to Vercel

1. Push this folder to a GitHub repo (already done if you're reading this there).
2. In Vercel, **Add New → Project → Import** this repo. Framework preset auto-detects **Next.js**.
3. Add the two environment variables above.
4. **Deploy.** You get a public URL to share with colleagues.

No build config needed — it's a standard Next.js App Router app.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in SLM_API_KEY
npm run dev                  # http://localhost:3000
```

## Notes

- **Cold start:** the first message after the endpoint has been idle (~5 min) takes ~20–40s
  while Modal spins up a container and loads the model. The app pings `/api/warm` on load to
  reduce this. Later replies are a few seconds.
- **Model quality:** this is a ~126M research model. It's fluent and follows the chat format,
  but it is frequently factually wrong and must **not** be used for legal or financial advice.
- **Abuse protection:** the Modal endpoint requires the shared key and rate-limits per IP.
