const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'url required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Follow redirects to get final URL
    let finalUrl = url;
    let attempts = 0;
    while (attempts < 5) {
      const res = await fetch(finalUrl, { redirect: 'manual' });
      const location = res.headers.get('location');
      if (location) {
        finalUrl = location.startsWith('http') ? location : new URL(location, finalUrl).href;
        attempts++;
      } else {
        break;
      }
    }

    // Try HTTPS version first
    const httpsUrl = finalUrl.replace(/^http:\/\//, 'https://').replace(':80/', '/');

    return new Response(JSON.stringify({ resolved_url: httpsUrl, http_fallback: finalUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
