import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface CalendarItem {
  title: string;
  episode: string;
  season: number;
  number: number;
  air_date: string;
  type: number;
  tmdb_id: string;
  imdb_id: string;
  poster: string;
  backdrop: string;
  status: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    // If authenticated, get user's favorites
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }

    console.log('Fetching calendar releases...');

    // Fetch calendar data from SuperFlixAPI
    const calendarResponse = await fetch('https://superflixapi.cv/calendario.php', {
      signal: AbortSignal.timeout(15000),
    });

    if (!calendarResponse.ok) {
      throw new Error('Failed to fetch calendar data');
    }

    const calendarData: CalendarItem[] = await calendarResponse.json();
    console.log(`Fetched ${calendarData.length} calendar items`);

    // Filter today's releases
    const today = new Date().toISOString().split('T')[0];
    const todayReleases = calendarData.filter(item => 
      item.air_date === today || item.status === 'Hoje'
    );

    console.log(`Found ${todayReleases.length} releases for today`);

    // If user is authenticated, check their favorites
    let matchedFavorites: CalendarItem[] = [];
    
    if (userId) {
      // Get user's favorites
      const { data: favorites, error } = await supabaseClient
        .from('favorites')
        .select('content_id, title')
        .eq('user_id', userId)
        .eq('content_type', 'tv');

      if (!error && favorites && favorites.length > 0) {
        console.log(`User has ${favorites.length} TV favorites`);
        
        // Match favorites with today's releases
        const favoriteIds = favorites.map(f => f.content_id);
        matchedFavorites = todayReleases.filter(release => 
          favoriteIds.includes(release.tmdb_id)
        );

        console.log(`Found ${matchedFavorites.length} matching favorites with today's releases`);
      }
    }

    // Prepare notifications for matched favorites
    const notifications = matchedFavorites.map(item => ({
      id: crypto.randomUUID(),
      title: `Novo episódio de ${item.title}!`,
      message: `${item.episode} - T${item.season}:E${item.number} já está disponível!`,
      type: 'success',
      tmdb_id: item.tmdb_id,
      poster: item.poster ? `https://image.tmdb.org/t/p/w200${item.poster}` : null,
      air_date: item.air_date,
      date: new Date().toISOString(),
      read: false,
    }));

    // Also include general "hot" releases (most popular ones releasing today)
    const hotReleases = todayReleases.slice(0, 5).map(item => ({
      id: crypto.randomUUID(),
      title: `${item.title} - Novo episódio!`,
      message: `${item.episode} - T${item.season}:E${item.number}`,
      type: 'info',
      tmdb_id: item.tmdb_id,
      poster: item.poster ? `https://image.tmdb.org/t/p/w200${item.poster}` : null,
      air_date: item.air_date,
      date: new Date().toISOString(),
      read: false,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        today: today,
        total_releases: todayReleases.length,
        favorite_matches: matchedFavorites.length,
        notifications: notifications,
        hot_releases: hotReleases,
        all_today: todayReleases.slice(0, 20).map(item => ({
          title: item.title,
          episode: item.episode,
          season: item.season,
          number: item.number,
          tmdb_id: item.tmdb_id,
          poster: item.poster ? `https://image.tmdb.org/t/p/w200${item.poster}` : null,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in calendar-notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
