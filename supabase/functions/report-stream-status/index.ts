import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, status, content_type, content_id, episode_id } = await req.json();

    if (!url || !status) {
      return new Response(JSON.stringify({ error: 'url and status are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Padroniza o valor salvo no banco como 'online' / 'offline'.
    // Aceita variantes legadas ('active' / 'broken') vindas de clientes antigos.
    const normalized = status === 'online' || status === 'active' ? 'online'
      : status === 'offline' || status === 'broken' ? 'offline'
      : 'unknown';

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const patch = { status: normalized, last_checked_at: new Date().toISOString() };

    const isSeries = content_type === 'tv' || content_type === 'series' || !!episode_id;
    const table = isSeries ? 'episode_streams' : 'movie_streams';
    const idField = isSeries ? 'episode_id' : 'movie_id';
    const idValue = isSeries ? episode_id : content_id;

    // Normalize URL for comparison: strip query/hash so trackers don't break matching
    const stripQuery = (u: string) => String(u || '').split('#')[0].split('?')[0];
    const targetBase = stripQuery(url);

    let updated = 0;
    let strategy = 'exact-url';

    // 1) Try exact URL match (scoped to id when available)
    {
      let q = db.from(table).update(patch).eq('url', url);
      if (idValue) q = q.eq(idField, idValue);
      const { data, error } = await q.select('id');
      if (error) throw error;
      updated = data?.length ?? 0;
    }

    // 2) Fallback: match by id + URL base (ignore query string differences)
    if (updated === 0 && idValue) {
      strategy = 'base-url';
      const { data: rows, error: selErr } = await db
        .from(table).select('id, url').eq(idField, idValue);
      if (selErr) throw selErr;
      const matchIds = (rows || [])
        .filter((r: any) => stripQuery(r.url) === targetBase)
        .map((r: any) => r.id);
      if (matchIds.length) {
        const { data, error } = await db
          .from(table).update(patch).in('id', matchIds).select('id');
        if (error) throw error;
        updated = data?.length ?? 0;
      }
    }

    if (updated === 0) {
      console.warn('[report-stream-status] no rows matched', { table, idField, idValue, url });
    }

    return new Response(JSON.stringify({ ok: true, status: normalized, updated, strategy }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
