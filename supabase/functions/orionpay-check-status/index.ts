import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { paymentId } = await req.json()
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'paymentId obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Consulta status na OrionPay ────────────────────────────────────────────
    const apiKey = Deno.env.get('ORIONPAY_API_KEY')!
    const r = await fetch(`https://payapi.orion.moe/api/v1/pix/status/${paymentId}`, {
      headers: { 'X-API-Key': apiKey },
    })
    const data = await r.json()

    const rawStatus = String(
      data.status ?? data.data?.status ?? data.statusPagamento ?? 'PENDING'
    ).toUpperCase()

    const holdReason = data.holdReason ?? data.data?.holdReason ?? null

    // holdReason presente ou status HOLD = dinheiro recebido, apenas retido
    const isHold = !!holdReason
      || rawStatus.includes('HOLD')
      || rawStatus.includes('ANTI')
      || rawStatus.includes('RETIDO')

    const isPaid = isHold || ['PAID', 'APPROVED', 'COMPLETED', 'SUCCESS'].includes(rawStatus)
    const status = isHold ? 'COMPLETED' : rawStatus

    console.log('[check-status]', { paymentId, rawStatus, holdReason, isPaid, userId: user.id })

    // ── Se pago, ativa subscription ────────────────────────────────────────────
    if (isPaid) {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )

      // Busca o log de pagamento para saber o valor e status atual
      const { data: log } = await admin
        .from('payments_logs')
        .select('id, subscription_id, status_pagamento, valor')
        .eq('payment_id', String(paymentId))
        .eq('user_id', user.id)
        .maybeSingle()

      console.log('[check-status] log encontrado:', log)

      // Se já foi aprovado antes, não faz nada (idempotente)
      if (log?.status_pagamento === 'aprovado') {
        console.log('[check-status] já aprovado, pulando')
        return new Response(JSON.stringify({ status, paid: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Calcula meses pelo valor: ≤15 = 1 mês, ≤50 = 3 meses, senão 12 meses
      const valor = Number(log?.valor ?? 0)
      const meses = valor <= 15 ? 1 : valor <= 50 ? 3 : 12

      const inicio = new Date()
      const venc   = new Date()
      venc.setMonth(venc.getMonth() + meses)

      // ── Upsert subscription — cria ou atualiza por user_id ─────────────────
      const { error: subError } = await admin
        .from('subscriptions')
        .upsert(
          {
            user_id:         user.id,
            plano:           'premium',   // sempre premium ao pagar
            status:          'ativo',
            data_inicio:     inicio.toISOString(),
            data_vencimento: venc.toISOString(),
            purchase_id:     String(paymentId),
          },
          { onConflict: 'user_id' }
        )

      if (subError) {
        console.error('[check-status] erro upsert subscription:', subError)
        return new Response(JSON.stringify({ error: subError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('[check-status] subscription ativada para user:', user.id)

      // ── Atualiza log de pagamento para aprovado ─────────────────────────────
      if (log?.id) {
        await admin
          .from('payments_logs')
          .update({ status_pagamento: 'aprovado' })
          .eq('id', log.id)
      } else {
        // Log não existe — cria registro do pagamento
        await admin
          .from('payments_logs')
          .insert({
            user_id:          user.id,
            subscription_id:  null,
            status_pagamento: 'aprovado',
            valor:            valor || 0,
            link_pagamento:   null,
            payment_id:       String(paymentId),
          })
      }
    }

    return new Response(JSON.stringify({ status, paid: isPaid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    console.error('[check-status] erro geral:', e)
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
