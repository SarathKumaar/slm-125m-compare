// Server-side proxy to the Modal inference endpoint. The shared secret lives
// only here (never shipped to the browser).
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  const endpoint = process.env.MODAL_ENDPOINT;
  const apiKey = process.env.SLM_API_KEY;
  if (!endpoint || !apiKey) {
    return Response.json(
      { error: 'Server not configured (missing MODAL_ENDPOINT or SLM_API_KEY).' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const message = (body?.message ?? '').toString().slice(0, 2000);
  if (!message.trim()) {
    return Response.json({ error: 'Message is empty.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({
        message,
        max_new_tokens: Number(body?.max_new_tokens) || 160,
        temperature: Number(body?.temperature) || 0.7,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail =
        typeof data?.detail === 'string' ? data.detail : `Upstream error ${res.status}.`;
      return Response.json({ error: detail }, { status: res.status });
    }
    return Response.json({ reply: data.reply ?? '' });
  } catch {
    return Response.json(
      {
        error:
          'Could not reach the model server. It may be cold-starting — wait ~30s and try again.',
      },
      { status: 502 }
    );
  }
}
