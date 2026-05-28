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

    // Series missing overview or poster, but having tmdb_id OR allow search by title
    const { data: series, error } = await supabase
      .from('series_catalog')
      .select('id, tmdb_id, title')
      .or('overview.is.null,poster_path.is.null')
      .limit(batchSize)

    if (error) throw error
    if (!series || series.length === 0) {
      return new Response(JSON.stringify({ message: 'No series to enrich', updated: 0, remaining: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let updated = 0
    let errors = 0

    for (const s of series) {
      try {
        let tmdbId = s.tmdb_id

        // Search by title if no tmdb_id
        if (!tmdbId) {
          const searchRes = await fetch(
            `${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(s.title)}`
          )
          if (searchRes.ok) {
            const sd = await searchRes.json()
            tmdbId = sd.results?.[0]?.id || null
          }
          if (!tmdbId) { errors++; continue }
        }

        let res = await fetch(`${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`)
        let data: any = res.ok ? await res.json() : null

        if (!data?.overview) {
          const fb = await fetch(`${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`)
          if (fb.ok) {
            const fbData = await fb.json()
            data = { ...(data || {}), overview: data?.overview || fbData.overview, poster_path: data?.poster_path || fbData.poster_path, backdrop_path: data?.backdrop_path || fbData.backdrop_path, ...fbData, ...(data || {}) }
            data.overview = data.overview || fbData.overview
          }
        }

        if (!data) { errors++; continue }

        const updateFields: Record<string, any> = { tmdb_id: tmdbId }
        if (data.overview) updateFields.overview = data.overview
        if (data.poster_path) updateFields.poster_path = data.poster_path
        if (data.backdrop_path) updateFields.backdrop_path = data.backdrop_path
        if (data.vote_average) updateFields.vote_average = data.vote_average
        if (data.vote_count) updateFields.vote_count = data.vote_count
        if (data.first_air_date) {
          updateFields.first_air_date = data.first_air_date
          updateFields.release_year = parseInt(data.first_air_date.substring(0, 4))
        }
        if (data.last_air_date) updateFields.last_air_date = data.last_air_date
        if (data.number_of_seasons) updateFields.number_of_seasons = data.number_of_seasons
        if (data.number_of_episodes) updateFields.number_of_episodes = data.number_of_episodes
        if (data.status) updateFields.status = data.status
        if (data.genres?.length) updateFields.genres = data.genres.map((g: any) => g.name)

        const { error: upErr } = await supabase
          .from('series_catalog')
          .update(updateFields)
          .eq('id', s.id)
        if (upErr) { errors++; continue }
        updated++

        await new Promise(r => setTimeout(r, 30))
      } catch (e) {
        console.error(`Error enriching series ${s.title}:`, e)
        errors++
      }
    }

    // Count remaining
    const { count } = await supabase
      .from('series_catalog')
      .select('id', { count: 'exact', head: true })
      .or('overview.is.null,poster_path.is.null')

    return new Response(JSON.stringify({ updated, errors, total: series.length, remaining: count || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
