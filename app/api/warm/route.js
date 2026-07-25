// Pings the Modal endpoint's /health to spin up a warm container, so the
// user's first real message doesn't eat the full cold start. Called on page load.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  const endpoints = [process.env.MODAL_ENDPOINT, process.env.MODAL_GEMMA_ENDPOINT].filter(
    Boolean
  );
  // Fire /health at both model servers so their containers cold-start before the user asks.
  const results = await Promise.allSettled(
    endpoints.map((e) =>
      fetch(`${e.replace(/\/$/, '')}/health`, { method: 'GET', cache: 'no-store' })
    )
  );
  const ok = results.some((r) => r.status === 'fulfilled' && r.value.ok);
  return Response.json({ ok, warmed: endpoints.length });
}
