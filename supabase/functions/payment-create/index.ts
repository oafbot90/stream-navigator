
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

    const { plano } = await req.json()
    
    if (!['premium', 'vip'].includes(plano)) {
      return new Response(JSON.stringify({ error: 'Plano inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Preços dos planos
    const precos = {
      premium: { mensal: 9.90, trimestral: 26.90, anual: 89.90 },
      vip: { mensal: 19.90, trimestral: 49.90, anual: 149.90 }
    }

    // Para este exemplo, usando plano mensal
    const valor = precos[plano as keyof typeof precos].mensal

    // Simular criação de link de pagamento (MercadoPago/Stripe)
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const paymentLink = `https://checkout.example.com/payment/${paymentId}`

    // Criar registro de assinatura
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plano,
        status: 'pendente',
        pagamento_link: paymentLink
      })
      .select()
      .single()

    if (subError) throw subError

    // Criar log de pagamento
    await supabaseClient
      .from('payments_logs')
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        status_pagamento: 'pendente',
        valor,
        link_pagamento: paymentLink,
        payment_id: paymentId
      })

    return new Response(
      JSON.stringify({
        payment_link: paymentLink,
        payment_id: paymentId,
        subscription_id: subscription.id,
        valor,
        plano
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
