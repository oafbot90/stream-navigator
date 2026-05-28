
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      title_pt, 
      title_original, 
      overview, 
      external_id, 
      type, 
      youtube_key, 
      release_year, 
      genres, 
      poster_url, 
      backdrop_url, 
      rating, 
      source,
      admin_email 
    } = await req.json()

    // Lista de administradores
    const adminEmails = ['alezin1788@gmail.com', 'admin@flixhub.com']

    // Verificar se o email é de um administrador
    if (!admin_email || !adminEmails.includes(admin_email)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only admins can upload trailers' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Inserir trailer usando service role (bypassa RLS)
    const { data, error } = await supabaseClient
      .from('trailers')
      .insert({
        title_pt,
        title_original: title_original || title_pt,
        overview,
        external_id: external_id || Math.floor(Math.random() * 1000000),
        type,
        youtube_key,
        release_year,
        genres: genres || [],
        poster_url,
        backdrop_url,
        rating: rating || 0,
        source: source || 'custom'
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        trailer: data[0],
        message: 'Trailer uploaded successfully by admin' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
