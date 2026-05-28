import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Mirror the player proxy chain (see src/components/VideoPlayer.tsx)
const CF_PROXY = 'https://proxyflixhub.reigado1788.workers.dev/?url=';
const NETLIFY_PROXY = 'https://stately-cheesecake-9bf8db.netlify.app/.netlify/functions/proxy?url=';
const REDIRECT_DOMAINS = ['hubby.cx', 'descontracao.xyz', 'playerflixapi.com', 'roxanoplay', 'hostmov'];

function isHLSLike(u: string): boolean {
  const s = u.split('?')[0].split('#')[0].toLowerCase();
  return s.endsWith('.m3u8') || s.includes('.m3u8') || s.endsWith('.txt') || s.includes('/m3u8/') || s.includes('master.txt');
}
function isEmbedUrl(u: string): boolean {
  return /iframe|\/embed\/|youtube\.com|youtu\.be|drive\.google|roxanoplay|hostmov|playerflixapi|embedder\.net/i.test(u);
}
function needsRedirect(u: string): boolean {
  try { return REDIRECT_DOMAINS.some(d => new URL(u).hostname.toLowerCase().includes(d)); } catch { return false; }
}
function isHttp(u: string): boolean {
  try { return new URL(u).protocol === 'http:'; } catch { return false; }
}
function buildVariants(raw: string): string[] {
  if (!raw) return [];
  const enc = encodeURIComponent(raw);
  const cf = CF_PROXY + enc;
  const nf = NETLIFY_PROXY + enc;
  if (isHttp(raw) || isHLSLike(raw)) return [cf, nf, raw];
  if (needsRedirect(raw)) return [nf, cf, raw];
  return [raw, cf, nf];
}

async function probe(url: string, timeoutMs = 8000): Promise<boolean> {
  // GET with Range to actually pull some bytes — many CDNs return 200 to HEAD
  // even when the asset is gone, so HEAD is unreliable.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-2047' },
      signal: controller.signal,
      redirect: 'follow',
    }).catch(() => null);

    if (!res) {
      // Some servers reject Range — retry without it
      res = await fetch(url, { method: 'GET', signal: controller.signal, redirect: 'follow' }).catch(() => null);
    }
    if (!res) return false;
    if (res.status < 200 || res.status >= 400) return false;

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const cl = parseInt(res.headers.get('content-length') || '0', 10);
    const looksPlaylist = isHLSLike(url) || ct.includes('mpegurl');

    // Read first bytes of the body to validate content shape
    let head = '';
    if (res.body) {
      try {
        const reader = res.body.getReader();
        const { value } = await reader.read();
        reader.cancel().catch(() => {});
        head = new TextDecoder().decode(value || new Uint8Array()).slice(0, 512).trim();
      } catch { /* ignore */ }
    }

    if (looksPlaylist) {
      // Must start with HLS marker
      return head.startsWith('#EXTM3U');
    }

    // For embed/iframe pages: accept HTML but reject obvious error pages
    if (isEmbedUrl(url)) {
      if (head.length < 50) return false;
      const low = head.toLowerCase();
      if (/(not found|404|error|forbidden|access denied|file removed|video.*(unavailable|removed))/i.test(low)) return false;
      return true;
    }

    // For direct media (mp4/mkv/etc): reject html responses (likely error pages)
    if (ct.includes('text/html') || head.startsWith('<')) return false;
    // Reject zero-length responses
    if (cl === 0 && (!head || head.length < 8)) return false;
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function checkUrl(url: string): Promise<boolean> {
  if (!url) return false;
  const variants = buildVariants(url);
  for (const v of variants) {
    if (await probe(v)) return true;
  }
  return false;
}

async function checkAllStreams(
  db: any,
  table: string,
): Promise<{ checked: number; broken: number; fixed: number }> {
  let checked = 0, broken = 0, fixed = 0;

  // Fetch ALL streams from the table in pages of 1000
  let allStreams: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await db
      .from(table)
      .select('id, url, status')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data || data.length === 0) break;
    allStreams = allStreams.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  if (allStreams.length === 0) return { checked, broken, fixed };

  // Process in parallel batches of 50 for speed
  const PARALLEL = 50;
  for (let i = 0; i < allStreams.length; i += PARALLEL) {
    const slice = allStreams.slice(i, i + PARALLEL);
    const results = await Promise.allSettled(
      slice.map(s => checkUrl(s.url))
    );

    // Batch updates
    const updates: Promise<any>[] = [];
    for (let j = 0; j < slice.length; j++) {
      const stream = slice[j];
      const isWorking = results[j].status === 'fulfilled' && (results[j] as PromiseFulfilledResult<boolean>).value;
      const newStatus = isWorking ? 'active' : 'broken';
      
      checked++;
      if (!isWorking) broken++;
      if (isWorking && stream.status === 'broken') fixed++;

      updates.push(
        db.from(table)
          .update({ status: newStatus, last_checked_at: new Date().toISOString() })
          .eq('id', stream.id)
      );
    }
    await Promise.all(updates);
  }

  return { checked, broken, fixed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body = await req.json().catch(() => ({}));
    const tableFilter = body.table || 'all';

    let movieResult = { checked: 0, broken: 0, fixed: 0 };
    let episodeResult = { checked: 0, broken: 0, fixed: 0 };

    if (tableFilter === 'all' || tableFilter === 'movies') {
      movieResult = await checkAllStreams(db, 'movie_streams');
    }
    if (tableFilter === 'all' || tableFilter === 'episodes') {
      episodeResult = await checkAllStreams(db, 'episode_streams');
    }

    return new Response(JSON.stringify({
      movie_streams: movieResult,
      episode_streams: episodeResult,
      total_checked: movieResult.checked + episodeResult.checked,
      total_broken: movieResult.broken + episodeResult.broken,
      total_fixed: movieResult.fixed + episodeResult.fixed,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
