import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();

    // Parse all supported formats
    let channels: any[] = [];
    if (body.todos && Array.isArray(body.todos)) {
      channels = body.todos;
    } else if (body.channels && Array.isArray(body.channels)) {
      channels = body.channels;
    } else if (body.por_categoria && typeof body.por_categoria === 'object') {
      for (const cat of Object.values(body.por_categoria)) {
        if (Array.isArray(cat)) channels.push(...(cat as any[]));
      }
    } else if (Array.isArray(body)) {
      channels = body;
    }

    if (channels.length === 0) {
      return new Response(JSON.stringify({ error: 'No channels found in JSON' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduplicate by slug
    const seen = new Set<string>();
    const uniqueChannels = channels.filter(ch => {
      const slug = ch.slug || '';
      if (!slug || seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });

    // Extract and batch upsert categories
    const categories = [...new Set(uniqueChannels.map(ch => ch.cat || ch.category || 'Outros'))];
    const catInserts = categories.map(name => ({ name }));
    
    // Upsert all categories in one call
    await supabase.from('livetv_categories').upsert(catInserts, { onConflict: 'name', ignoreDuplicates: true });

    // Build channel rows
    const validChannels = uniqueChannels
      .filter(ch => (ch.slug || '') && (ch.stream_url || ch.url || ''))
      .map(ch => ({
        slug: ch.slug,
        name: ch.nome || ch.name || ch.slug,
        category: ch.cat || ch.category || 'Outros',
        stream_url: ch.stream_url || ch.url || '',
        format: ch.formato || ch.format || 'm3u8',
        status: ch.status || 'online',
        logo: ch.logo || ch.image || '',
        updated_at: new Date().toISOString(),
      }));

    const skipped = uniqueChannels.length - validChannels.length;

    // Batch upsert channels in chunks of 500
    let inserted = 0, errs = 0;
    for (let i = 0; i < validChannels.length; i += 500) {
      const chunk = validChannels.slice(i, i + 500);
      const { error } = await supabase.from('livetv_channels').upsert(chunk, { onConflict: 'slug' });
      if (error) {
        console.error('Batch upsert error, falling back:', error);
        // Fallback: insert one by one for this chunk
        for (const ch of chunk) {
          const { error: e2 } = await supabase.from('livetv_channels').upsert(ch, { onConflict: 'slug' });
          if (e2) errs++; else inserted++;
        }
      } else {
        inserted += chunk.length;
      }
    }

    return new Response(JSON.stringify({
      total: uniqueChannels.length,
      inserted,
      skipped,
      errors: errs,
      categories: categories.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
