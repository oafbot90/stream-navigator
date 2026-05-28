
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

    const { action } = await req.json()

    if (action === 'stats') {
      // Estatísticas gerais
      const { count: totalUsers } = await supabaseClient
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })

      const { count: activeUsers } = await supabaseClient
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo')

      const { count: pendingUsers } = await supabaseClient
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente')

      const { count: expiredUsers } = await supabaseClient
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'vencido')

      const { data: revenueData } = await supabaseClient
        .from('payments_logs')
        .select('valor')
        .eq('status_pagamento', 'aprovado')

      const totalRevenue = revenueData?.reduce((sum, payment) => sum + Number(payment.valor), 0) || 0

      return new Response(
        JSON.stringify({
          stats: {
            total_users: totalUsers || 0,
            active_users: activeUsers || 0,
            pending_users: pendingUsers || 0,
            expired_users: expiredUsers || 0,
            total_revenue: totalRevenue
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (action === 'users' || action === 'users_count') {
      // Paginar todos os usuários (listUsers retorna por página, default pequeno)
      const perPage = 1000
      let page = 1
      const allUsers: any[] = []
      while (true) {
        const { data, error } = await supabaseClient.auth.admin.listUsers({ page, perPage })
        if (error) throw error
        const batch = data?.users || []
        allUsers.push(...batch)
        if (batch.length < perPage) break
        page++
        if (page > 50) break
      }

      if (action === 'users_count') {
        return new Response(
          JSON.stringify({ count: allUsers.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: subscriptions } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })

      const usersWithSubscriptions = allUsers.map(user => {
        const userSubscription = subscriptions?.find(sub => sub.user_id === user.id) || {
          plano: 'free',
          status: 'ativo',
          created_at: user.created_at,
          data_inicio: user.created_at,
          data_vencimento: null
        }
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          ...userSubscription
        }
      })

      return new Response(
        JSON.stringify({ users: usersWithSubscriptions, total: allUsers.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'payments') {
      // Lista de pagamentos
      const { data: payments } = await supabaseClient
        .from('payments_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      return new Response(
        JSON.stringify({ payments }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erro no admin-dashboard:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
