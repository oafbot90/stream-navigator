
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
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await authClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar assinaturas pelo service role para não depender de RLS/cache do cliente
    const { data: subscriptions, error } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    const now = new Date()
    const subscription = (subscriptions || []).find((sub: any) => {
      const isActive = sub.status === 'ativo'
      const isPaidPlan = ['premium', 'vip'].includes(sub.plano)
      const notExpired = !sub.data_vencimento || now <= new Date(sub.data_vencimento)
      return isActive && isPaidPlan && notExpired
    }) || subscriptions?.[0]

    // Se não tem assinatura, é usuário free
    if (!subscription) {
      return new Response(
        JSON.stringify({
          plano: 'free',
          status: 'ativo',
          access_granted: true,
          is_premium: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verificar se assinatura está vencida
    let status = subscription.status
    const vencimento = new Date(subscription.data_vencimento)

    if (subscription.data_vencimento && now > vencimento && status === 'ativo') {
      // Atualizar status para vencido
      await adminClient
        .from('subscriptions')
        .update({ status: 'vencido' })
        .eq('id', subscription.id)
      
      status = 'vencido'
    }

    const accessGranted = status === 'ativo'
    const isPremium = ['premium', 'vip'].includes(subscription.plano) && accessGranted

    // Calcular dias restantes
    let diasRestantes = null
    if (subscription.data_vencimento && status === 'ativo') {
      const diff = vencimento.getTime() - now.getTime()
      diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return new Response(
      JSON.stringify({
        plano: subscription.plano,
        status,
        access_granted: accessGranted,
        is_premium: isPremium,
        data_vencimento: subscription.data_vencimento,
        dias_restantes: diasRestantes,
        subscription_id: subscription.id
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
