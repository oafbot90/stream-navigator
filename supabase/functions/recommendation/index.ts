
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar preferências do usuário
    const { data: preferences } = await supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Buscar conteúdo assistido
    const { data: watchedContent } = await supabaseClient
      .from('watched_content')
      .select('*')
      .eq('user_id', user.id)
      .limit(50)

    // Gêneros baseados no conteúdo assistido
    const watchedGenres = watchedContent?.map(item => {
      // Simular extração de gêneros do conteúdo assistido
      return [28, 18, 878] // Action, Drama, Sci-Fi como exemplo
    }).flat() || []

    const preferredGenres = preferences?.generos_preferidos || []
    const allGenres = [...new Set([...preferredGenres, ...watchedGenres])]

    // Simular recomendações baseadas em IA
    const recommendations = [
      {
        id: 100,
        title: 'Dune: Parte 2',
        overview: 'Paul Atreides se une a Chani...',
        poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
        backdrop_path: '/xtqw8MhWX0nrzuqHBWc6ys2KgkF.jpg',
        release_date: '2024-02-28',
        vote_average: 8.5,
        genre_ids: [878, 12, 18],
        recommendation_score: 0.95,
        reason: 'Baseado no seu interesse em ficção científica'
      },
      {
        id: 101,
        title: 'Oppenheimer',
        overview: 'A história de J. Robert Oppenheimer...',
        poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        backdrop_path: '/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
        release_date: '2023-07-19',
        vote_average: 8.3,
        genre_ids: [18, 36],
        recommendation_score: 0.87,
        reason: 'Baseado no seu histórico de dramas históricos'
      }
    ]

    // Filtrar recomendações por gêneros preferidos
    const filteredRecommendations = recommendations.filter(rec =>
      rec.genre_ids.some(genre => allGenres.includes(genre))
    )

    return new Response(
      JSON.stringify({
        recommendations: filteredRecommendations,
        user_genres: allGenres,
        watched_count: watchedContent?.length || 0,
        generated_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
