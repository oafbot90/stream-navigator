import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const TMDB_BASE = 'https://api.themoviedb.org/3'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY')
    if (!TMDB_API_KEY) {
      return new Response(JSON.stringify({ error: 'TMDB_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Support both body JSON and URL params
    let action = '', query = '', type = 'movie', page = '1', genre = ''

    if (req.method === 'POST') {
      const body = await req.json()
      action = body.action || ''
      query = body.query || ''
      type = body.type || 'movie'
      page = String(body.page || 1)
      genre = body.genre || ''
    } else {
      const url = new URL(req.url)
      action = url.searchParams.get('action') || ''
      query = url.searchParams.get('query') || ''
      type = url.searchParams.get('type') || 'movie'
      page = url.searchParams.get('page') || '1'
      genre = url.searchParams.get('genre') || ''
    }

    // Search action - used by admin pages
    if (action === 'search' && query) {
      const endpoint = type === 'tv' ? '/search/tv' : '/search/movie'
      const res = await fetch(
        `${TMDB_BASE}${endpoint}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`TMDB error ${res.status}: ${text}`)
      }
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Details action
    if (action === 'details' && query) {
      const endpoint = type === 'tv' ? `/tv/${query}` : `/movie/${query}`
      const res = await fetch(
        `${TMDB_BASE}${endpoint}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=videos,credits,similar`
      )
      if (!res.ok) throw new Error(`TMDB error ${res.status}`)
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Default: popular/trending
    const endpoint = type === 'tv' ? '/tv/popular' : '/movie/popular'
    const params = new URLSearchParams({ api_key: TMDB_API_KEY, language: 'pt-BR', page })
    if (genre) params.set('with_genres', genre)

    const res = await fetch(`${TMDB_BASE}${endpoint}?${params}`)
    if (!res.ok) throw new Error(`TMDB error ${res.status}`)
    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
