/**
 * Supabase Edge Function — resolve-url
 *
 * Segue a cadeia de redirects de uma URL HTTP e devolve a URL final HTTPS.
 *
 * Fluxo do poupadefrutas.shop:
 *   http://site.poupadefrutas.shop/movie/.../1141313.mp4
 *     → 302 → http://91.218.51.237/movie/.../1141313.mp4
 *     → 302 → http://d72bf6fnvd8ds.master99999.online/filme.mp4?token=XXX
 *     → 302 → https://d72bf6fnvd8ds.master99999.online/filme.mp4?token=XXX  ← URL final
 */

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  // Aceita GET ?url= ou POST { url }
  let targetUrl: string | null = null;

  if (req.method === 'GET') {
    const u = new URL(req.url);
    targetUrl = u.searchParams.get('url');
  } else {
    try {
      const body = await req.json();
      targetUrl = body?.url ?? null;
    } catch {
      return new Response(
        JSON.stringify({ error: 'body inválido' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }
  }

  if (!targetUrl) {
    return new Response(
      JSON.stringify({ status: 'ok', uso: 'POST { url } ou GET ?url=<encoded>' }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }

  // Segue redirects manualmente
  let current = targetUrl;
  const visited: string[] = [];

  for (let hop = 0; hop < 10; hop++) {
    visited.push(current);

    let resp: Response;
    try {
      resp = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: '*/*',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'fetch_failed', hop, url: current, message: String(e), visited }),
        { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // URL final
    if (resp.status === 200 || resp.status === 206) {
      return new Response(
        JSON.stringify({ resolved: current, hops: hop, visited }),
        { headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // Redirect
    if ([301, 302, 303, 307, 308].includes(resp.status)) {
      const location = resp.headers.get('location');
      if (!location) {
        return new Response(
          JSON.stringify({ error: 'redirect_sem_location', hop, url: current, visited }),
          { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } },
        );
      }
      current = new URL(location, current).href;
      continue;
    }

    return new Response(
      JSON.stringify({ error: 'upstream_error', status: resp.status, url: current, visited }),
      { status: resp.status, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ error: 'too_many_redirects', url: current, visited }),
    { status: 508, headers: { ...CORS, 'Content-Type': 'application/json' } },
  );
});
