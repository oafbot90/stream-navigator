
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(now.getDate() + 7)

    // Buscar assinaturas que vencem em 7 dias
    const { data: expiringSubscriptions } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('status', 'ativo')
      .gte('data_vencimento', now.toISOString())
      .lte('data_vencimento', sevenDaysFromNow.toISOString())

    // Buscar assinaturas vencidas
    const { data: expiredSubscriptions } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('status', 'ativo')
      .lt('data_vencimento', now.toISOString())

    // Atualizar assinaturas vencidas
    if (expiredSubscriptions && expiredSubscriptions.length > 0) {
      await supabaseClient
        .from('subscriptions')
        .update({ status: 'vencido' })
        .in('id', expiredSubscriptions.map(sub => sub.id))
    }

    // Simular envio de notificações
    const notifications = []

    // Notificações de vencimento próximo
    for (const subscription of expiringSubscriptions || []) {
      const daysToExpire = Math.ceil(
        (new Date(subscription.data_vencimento).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      notifications.push({
        type: 'expiring_soon',
        user_id: subscription.user_id,
        message: `Sua assinatura ${subscription.plano} vence em ${daysToExpire} dias`,
        subscription_id: subscription.id
      })
    }

    // Notificações de vencimento
    for (const subscription of expiredSubscriptions || []) {
      notifications.push({
        type: 'expired',
        user_id: subscription.user_id,
        message: `Sua assinatura ${subscription.plano} venceu. Renove para continuar assistindo`,
        subscription_id: subscription.id
      })
    }

    // Aqui você implementaria o envio real de emails/WhatsApp
    console.log('Notificações a serem enviadas:', notifications)

    return new Response(
      JSON.stringify({
        checked_at: now.toISOString(),
        expiring_subscriptions: expiringSubscriptions?.length || 0,
        expired_subscriptions: expiredSubscriptions?.length || 0,
        notifications_sent: notifications.length
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
