import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TMDB_BASE = 'https://api.themoviedb.org/3'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY') || '36f12a46be05ce54f2d2f4b501cad2ea'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const url = new URL(req.url)
    const batchSize = Math.min(parseInt(url.searchParams.get('batch') || '50'), 100)

    const { data: movies, error } = await supabase
      .from('movies_catalog')
      .select('id, tmdb_id, title')
      .or('overview.is.null,poster_path.is.null')
      .limit(batchSize)

    if (error) throw error
    if (!movies || movies.length === 0) {
      return new Response(JSON.stringify({ message: 'No movies to enrich', updated: 0, remaining: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let updated = 0
    let errors = 0

    for (const movie of movies) {
      try {
        let tmdbId = movie.tmdb_id

        if (!tmdbId) {
          const searchRes = await fetch(
            `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(movie.title)}`
          )
          if (searchRes.ok) {
            const sd = await searchRes.json()
            tmdbId = sd.results?.[0]?.id || null
          }
          if (!tmdbId) { errors++; continue }
        }

        let res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`)
        let data: any = res.ok ? await res.json() : null

        if (!data?.overview) {
          const fb = await fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`)
          if (fb.ok) {
            const fbData = await fb.json()
            if (!data) data = fbData
            else {
              data.overview = data.overview || fbData.overview
              data.poster_path = data.poster_path || fbData.poster_path
              data.backdrop_path = data.backdrop_path || fbData.backdrop_path
            }
          }
        }

        if (!data) { errors++; continue }

        await updateMovie(supabase, movie.id, { ...data, id: tmdbId })
        updated++
        await new Promise(r => setTimeout(r, 30))
      } catch (e) {
        console.error(`Error enriching ${movie.title}:`, e)
        errors++
      }
    }

    const { count } = await supabase
      .from('movies_catalog')
      .select('id', { count: 'exact', head: true })
      .or('overview.is.null,poster_path.is.null')

    return new Response(JSON.stringify({ updated, errors, total: movies.length, remaining: count || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function updateMovie(supabase: any, movieId: string, tmdbData: any) {
  const updateFields: Record<string, any> = {}

  if (tmdbData.id) updateFields.tmdb_id = tmdbData.id
  if (tmdbData.overview) updateFields.overview = tmdbData.overview
  if (tmdbData.poster_path) updateFields.poster_path = tmdbData.poster_path
  if (tmdbData.backdrop_path) updateFields.backdrop_path = tmdbData.backdrop_path
  if (tmdbData.imdb_id) updateFields.imdb_id = tmdbData.imdb_id
  if (tmdbData.runtime) updateFields.runtime = tmdbData.runtime
  if (tmdbData.vote_average) updateFields.vote_average = tmdbData.vote_average
  if (tmdbData.vote_count) updateFields.vote_count = tmdbData.vote_count
  if (tmdbData.release_date) {
    updateFields.release_date = tmdbData.release_date
    updateFields.release_year = parseInt(tmdbData.release_date.substring(0, 4))
  }
  if (tmdbData.genres && tmdbData.genres.length > 0) {
    updateFields.genres = tmdbData.genres.map((g: any) => g.name)
  }

  if (Object.keys(updateFields).length > 0) {
    const { error } = await supabase
      .from('movies_catalog')
      .update(updateFields)
      .eq('id', movieId)
    if (error) throw error
  }
}
