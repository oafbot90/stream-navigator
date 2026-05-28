const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers':
    'range, authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Expose-Headers':
    'content-length, content-range, content-type, accept-ranges',
};

/* ── Referer dinâmico por domínio ── */
const REFERER_MAP: Record<string, string> = {
  'watch.brstream.cc': 'https://megaembed.com/',
  'brstream.cc': 'https://megaembed.com/',
  'hubby.cx': 'https://hubby.cx/',
  'playcine': 'https://megaembed.com/',
};

function getReferer(hostname: string): string {
  for (const [key, ref] of Object.entries(REFERER_MAP)) {
    if (hostname.includes(key)) return ref;
  }
  return 'https://megaembed.com/';
}

function isHLSContent(url: string, contentType: string): boolean {
  const lower = url.split('?')[0].toLowerCase();
  return (
    lower.endsWith('.m3u8') ||
    lower.endsWith('.txt') ||
    lower.includes('master.txt') ||
    lower.includes('index.txt') ||
    contentType.includes('mpegurl') ||
    contentType.includes('x-mpegURL')
  );
}

function guessContentType(pathname: string): string {
  const p = pathname.toLowerCase();
  if (p.endsWith('.mp4')) return 'video/mp4';
  if (p.endsWith('.ts')) return 'video/mp2t';
  if (p.endsWith('.webm')) return 'video/webm';
  if (p.endsWith('.mkv')) return 'video/x-matroska';
  if (p.endsWith('.mov')) return 'video/quicktime';
  if (p.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  return 'application/octet-stream';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const reqUrl = new URL(req.url);
    const urlParam = reqUrl.searchParams.get('url');
    if (!urlParam) {
      return new Response(
        JSON.stringify({ status: 'ok', uso: `${reqUrl.origin}${reqUrl.pathname}?url=<stream-url>` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(urlParam);
    } catch {
      return new Response('URL inválida: ' + urlParam, { status: 400, headers: corsHeaders });
    }

    // Anti-loop
    if (targetUrl.hostname === reqUrl.hostname) {
      return new Response('Loop detectado', { status: 400, headers: corsHeaders });
    }

    // Block localhost
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(targetUrl.hostname)) {
      return new Response('Host não permitido', { status: 403, headers: corsHeaders });
    }

    const referer = getReferer(targetUrl.hostname);

    const upstreamHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: referer,
      Origin: new URL(referer).origin,
      Accept: '*/*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    };

    // Forward Range header for seek support
    const range = req.headers.get('range');
    if (range) upstreamHeaders['Range'] = range;

    let upstream: Response;
    try {
      upstream = await fetch(targetUrl.toString(), {
        method: req.method === 'HEAD' ? 'HEAD' : 'GET',
        headers: upstreamHeaders,
        redirect: 'follow',
      });
    } catch (e) {
      return new Response('Erro ao buscar: ' + (e as Error).message, {
        status: 502,
        headers: corsHeaders,
      });
    }

    // Accept 200 and 206 (partial content for range requests)
    if (upstream.status !== 200 && upstream.status !== 206) {
      return new Response(
        `Upstream retornou ${upstream.status} para: ${targetUrl.toString()}`,
        { status: upstream.status, headers: corsHeaders },
      );
    }

    const ct = upstream.headers.get('Content-Type') || '';

    /* ── HLS playlist rewriting ── */
    if (isHLSContent(targetUrl.toString(), ct)) {
      const text = await upstream.text();
      const proxyBase = `${reqUrl.origin}${reqUrl.pathname}?url=`;
      const originBase = `${targetUrl.protocol}//${targetUrl.host}`;

      const rewriteToProxy = (value: string): string => {
        if (!value) return value;
        if (value.startsWith(proxyBase)) return value;

        let absolute: string;
        if (value.startsWith('http://') || value.startsWith('https://')) {
          absolute = value;
        } else if (value.startsWith('/')) {
          absolute = originBase + value;
        } else {
          try {
            absolute = new URL(value, targetUrl).href;
          } catch {
            return value;
          }
        }
        return proxyBase + encodeURIComponent(absolute);
      };

      const rewritten = text
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;

          // Rewrite URI attributes inside EXT tags (#EXT-X-KEY, #EXT-X-MAP, etc.)
          if (trimmed.startsWith('#') && trimmed.includes('URI="')) {
            return line.replace(
              /URI="([^"]+)"/g,
              (_m, uri) => `URI="${rewriteToProxy(uri)}"`,
            );
          }

          // Rewrite segment/sub-playlist lines (non-comment lines)
          if (!trimmed.startsWith('#')) {
            return rewriteToProxy(trimmed);
          }

          return line;
        })
        .join('\n');

      return new Response(rewritten, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
        },
      });
    }

    /* ── Binary content (ts segments, mp4, etc.) ── */
    const respHeaders: Record<string, string> = { ...corsHeaders };

    for (const h of [
      'Content-Type',
      'Content-Length',
      'Content-Range',
      'Accept-Ranges',
      'Cache-Control',
      'Last-Modified',
      'ETag',
    ]) {
      const v = upstream.headers.get(h);
      if (v) respHeaders[h] = v;
    }

    // Fallback content-type detection
    if (!respHeaders['Content-Type']) {
      respHeaders['Content-Type'] = guessContentType(targetUrl.pathname);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
