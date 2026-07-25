// Server-side proxy to the Gemma /raft (grounded) endpoint. Key stays server-side.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  const endpoint = process.env.MODAL_GEMMA_ENDPOINT;
  const apiKey = process.env.SLM_API_KEY;
  if (!endpoint || !apiKey) {
    return Response.json(
      { error: 'Server not configured (missing MODAL_GEMMA_ENDPOINT or SLM_API_KEY).' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const context = (body?.context ?? '').toString().slice(0, 8000);
  const question = (body?.question ?? '').toString().slice(0, 2000);
  if (!context.trim()) {
    return Response.json({ error: 'Context is required for the grounded model.' }, { status: 400 });
  }
  if (!question.trim()) {
    return Response.json({ error: 'Question is empty.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/raft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ context, question, max_new_tokens: Number(body?.max_new_tokens) || 160 }),
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
      { error: 'Could not reach the Gemma server. It may be cold-starting — wait ~60s and retry.' },
      { status: 502 }
    );
  }
}
