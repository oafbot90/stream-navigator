import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICES: Record<string, number> = {
  premium: 9.90,
  vip: 19.90,
  premium_monthly: 14.90,
  premium_quarterly: 34.90,
  premium_yearly: 99.90,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { plano, name, cpf, phone, amount: customAmount, durationDays } = await req.json()
    const amount = typeof customAmount === 'number' && customAmount > 0
      ? customAmount
      : PRICES[plano as string]

    if (!amount) {
      return new Response(JSON.stringify({ error: 'Plano ou valor inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const apiKey = Deno.env.get('ORIONPAY_API_KEY')!

    const orionRes = await fetch('https://payapi.orion.moe/api/v1/pix/personal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({
        amount,
        name: name || user.email,
        email: user.email,
        cpf,
        phone,
        description: `Assinatura ${plano.toUpperCase()} - FlixHub`,
      }),
    })

    const orionData = await orionRes.json()
    if (!orionRes.ok || !orionData.success) {
      console.error('OrionPay error:', orionData)
      return new Response(JSON.stringify({ error: 'Falha ao gerar PIX', detail: orionData }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const d = orionData.data
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const days = typeof durationDays === 'number' && durationDays > 0 ? durationDays : 30
    const inicio = new Date()
    const venc = new Date()
    venc.setDate(venc.getDate() + days)

    const { data: sub } = await admin.from('subscriptions').upsert({
      user_id: user.id,
      plano,
      status: 'pendente',
      pagamento_link: d.pixCode,
      data_inicio: inicio.toISOString(),
      data_vencimento: venc.toISOString(),
    }, { onConflict: 'user_id' }).select().single()

    // Prioriza eulenDepositId — é o ID mais confiável para consultar status
    const orionId = String(d.eulenDepositId ?? d.purchaseId ?? d.id ?? '')
    await admin.from('payments_logs').insert({
      user_id: user.id,
      subscription_id: sub?.id,
      status_pagamento: 'pendente',
      valor: amount,
      link_pagamento: d.pixCode,
      payment_id: orionId,
    })

    return new Response(JSON.stringify({
      success: true,
      pixCode: d.pixCode,
      qrCode: d.qrCode,
      amount,
      expiresAt: d.expiresAt,
      paymentId: orionId,
      subscriptionId: sub?.id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erro' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
