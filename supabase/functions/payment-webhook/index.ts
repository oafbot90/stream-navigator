
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

    const { payment_id, status, transaction_amount } = await req.json()

    if (!payment_id || !status) {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar log de pagamento
    const { data: paymentLog, error: logError } = await supabaseClient
      .from('payments_logs')
      .select('*, subscriptions(*)')
      .eq('payment_id', payment_id)
      .single()

    if (logError || !paymentLog) {
      return new Response(JSON.stringify({ error: 'Pagamento não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let statusPagamento = 'pendente'
    let statusAssinatura = 'pendente'
    let dataInicio = null
    let dataVencimento = null

    if (status === 'approved') {
      statusPagamento = 'aprovado'
      statusAssinatura = 'ativo'
      dataInicio = new Date().toISOString()
      
      // Calcular data de vencimento (30 dias)
      const vencimento = new Date()
      vencimento.setDate(vencimento.getDate() + 30)
      dataVencimento = vencimento.toISOString()
    } else if (status === 'cancelled' || status === 'rejected') {
      statusPagamento = 'cancelado'
      statusAssinatura = 'vencido'
    }

    // Atualizar log de pagamento
    await supabaseClient
      .from('payments_logs')
      .update({ status_pagamento: statusPagamento })
      .eq('payment_id', payment_id)

    // Atualizar assinatura
    await supabaseClient
      .from('subscriptions')
      .update({
        status: statusAssinatura,
        data_inicio: dataInicio,
        data_vencimento: dataVencimento
      })
      .eq('id', paymentLog.subscription_id)

    // Enviar notificação de confirmação (simulado)
    if (status === 'approved') {
      console.log(`Pagamento aprovado para usuário ${paymentLog.user_id}`)
      // Aqui implementaria envio de email/WhatsApp
    }

    return new Response(
      JSON.stringify({ 
        status: 'success',
        payment_status: statusPagamento,
        subscription_status: statusAssinatura
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
