async function fetchScheduledEvents(dateStr, { timeoutMs = 10000, page } = {}) {
  // E vendosim çelësin direkt këtu për të shmangur çdo problem leximi në Render
  const apiKey = "Cd7e13d465msh83e3ca5b13730c2p19f52cjsn06f5a3fcc28e";

  const url = new URL(`${BASE_URL}/sport/football/scheduled-events/${dateStr}`);
  if (page) url.searchParams.set('page', String(page));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new SofascoreError(`Sofascore HTTP ${res.status}`, { status: res.status });
    }

    const text = await res.text();
    if (!text) return { payload: null, ok: true };

    try {
      return { payload: JSON.parse(text), ok: true };
    } catch {
      throw new SofascoreError('Përgjigje jo-JSON nga Sofascore');
    }
  } catch (err) {
    if (err instanceof SofascoreError) throw err;
    if (err.name === 'AbortError') {
      throw new SofascoreError(`Timeout pas ${timeoutMs}ms`, { cause: err });
    }
    throw new SofascoreError('Dështoi kërkesa drejt Sofascore', { cause: err });
  } finally {
    clearTimeout(timer);
  }
}
