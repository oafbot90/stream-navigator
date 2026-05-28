import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const genre = url.searchParams.get('genre') || null;

    // Fetch movies and series in parallel
    let moviesQuery = db
      .from('movies_catalog')
      .select('id, title, tmdb_id, poster_path, vote_average, genres')
      .order('created_at', { ascending: false })
      .limit(limit);

    let seriesQuery = db
      .from('series_catalog')
      .select('id, title, tmdb_id, poster_path, vote_average, genres')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (genre) {
      moviesQuery = moviesQuery.contains('genres', [genre]);
      seriesQuery = seriesQuery.contains('genres', [genre]);
    }

    const [moviesRes, seriesRes] = await Promise.all([moviesQuery, seriesQuery]);

    const formatItem = (item: any, type: string) => ({
      id: item.id,
      title: item.title,
      type,
      tmdb_id: item.tmdb_id,
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : "",
      backdrop: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : "",
      rating: item.vote_average || 0,
      genres: item.genres || [],
    });

    const movies = (moviesRes.data || []).map((m: any) => formatItem(m, 'movie'));
    const series = (seriesRes.data || []).map((s: any) => formatItem(s, 'series'));

    return new Response(JSON.stringify({
      movies,
      series,
      total_movies: movies.length,
      total_series: series.length,
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
