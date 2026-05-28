// Frontend link verification using a proxy fallback chain.
// Returns 'online' if any proxy can reach the URL, otherwise 'offline'.

const PROXIES = [
  'https://proxyflixhub.reigado1788.workers.dev/?url=',
  'https://stately-cheesecake-9bf8db.netlify.app/.netlify/functions/proxy?url=',
  'http://153.75.247.54:3000/proxy?url=',
];

const TIMEOUT_MS = 6000;

async function tryFetch(url: string, init: RequestInit): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isOkStatus(s: number): boolean {
  return s === 200 || s === 206 || s === 203;
}

export async function checkLinkStatus(videoUrl: string): Promise<'online' | 'offline'> {
  if (!videoUrl) return 'offline';

  for (const proxy of PROXIES) {
    const target = `${proxy}${encodeURIComponent(videoUrl)}`;

    // 1) Try HEAD first (cheap)
    let res = await tryFetch(target, { method: 'HEAD' });
    if (res && isOkStatus(res.status)) return 'online';

    // 2) Some origins reject HEAD; try a tiny ranged GET
    res = await tryFetch(target, {
      method: 'GET',
      headers: { Range: 'bytes=0-1' },
    });
    if (res && isOkStatus(res.status)) return 'online';
  }

  return 'offline';
}

export async function checkLinksConcurrent<T extends { id: string; url: string }>(
  items: T[],
  onResult: (id: string, status: 'online' | 'offline') => void,
  concurrency = 6,
): Promise<void> {
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      const item = items[idx];
      const status = await checkLinkStatus(item.url);
      onResult(item.id, status);
    }
  });
  await Promise.all(workers);
}