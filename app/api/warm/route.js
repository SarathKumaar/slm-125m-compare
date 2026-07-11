// Pings the Modal endpoint's /health to spin up a warm container, so the
// user's first real message doesn't eat the full cold start. Called on page load.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  const endpoint = process.env.MODAL_ENDPOINT;
  if (!endpoint) {
    return Response.json({ ok: false, error: 'not configured' }, { status: 500 });
  }
  try {
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/health`, {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return Response.json({ ok: res.ok, ...data });
  } catch {
    return Response.json({ ok: false, error: 'unreachable' }, { status: 502 });
  }
}
