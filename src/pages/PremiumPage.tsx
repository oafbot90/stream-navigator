import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Key, Zap, Shield, Eye, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PixPaymentModal from '@/components/PixPaymentModal';

type ShowcaseItem = { url: string; name: string; shape: 'circle' | 'wide' | 'card' };
const ShowcaseRow: React.FC<{ title: string; items: ShowcaseItem[] }> = ({ title, items }) => (
  <div>
    <h3 className="text-lg font-bold text-foreground mb-3">{title}</h3>
    <div className="flex gap-3 overflow-x-auto pb-3 snap-x">
      {items.map((it, i) => (
        <div key={i} className="relative shrink-0 snap-start group">
          <div className={
            it.shape === 'circle' ? 'w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-400/50'
            : it.shape === 'wide' ? 'w-48 h-20 rounded-xl overflow-hidden border border-yellow-400/30'
            : 'w-40 h-24 rounded-xl overflow-hidden border border-yellow-400/30'
          }>
            <img src={it.url} alt={it.name} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
            VIP
          </div>
          <p className="text-xs text-center mt-1.5 text-muted-foreground truncate w-24 mx-auto">{it.name}</p>
        </div>
      ))}
    </div>
  </div>
);

const plans = [
  {
    name: 'Gratuito',
    price: 'R$ 0',
    period: '',
    icon: Eye,
    features: [
      'Acesso ao catálogo básico',
      'Qualidade padrão',
      'Com anúncios',
    ],
    excluded: [
      'Sem anúncios',
      'Acesso prioritário',
      'Qualidade máxima',
    ],
    highlight: false,
  },
  {
    name: '⚡ Relâmpago',
    planKey: 'teste',
    amount: 2.00,
    price: 'R$ 2,00',
    period: '/1 dia',
    duration: 1,
    icon: Zap,
    features: [
      'Plano Relâmpago — acesso rápido',
      'Acesso premium por 1 dia',
    ],
    excluded: [],
    highlight: false,
  },
  {
    name: 'Premium Mensal',
    planKey: 'premium_monthly',
    amount: 14.90,
    price: 'R$ 14,90',
    period: '/mês',
    duration: 30,
    icon: Zap,
    features: [
      'Acesso ao catálogo completo',
      'Sem anúncios',
      'Qualidade máxima',
      'Acesso prioritário a lançamentos',
      'Avatares exclusivos VIP',
      'Banners e decorações Premium',
      'Fundos cinemáticos animados',
      'Canais de TV ao vivo Premium',
    ],
    excluded: [],
    highlight: true,
  },
  {
    name: 'Premium Trimestral',
    planKey: 'premium_quarterly',
    amount: 34.90,
    price: 'R$ 34,90',
    period: '/3 meses',
    duration: 90,
    icon: Star,
    features: [
      'Tudo do Premium Mensal',
      'Avatares, banners e fundos VIP',
      'Canais ao vivo Premium',
      'Economia de 22%',
      'Suporte prioritário',
    ],
    excluded: [],
    highlight: false,
  },
  {
    name: 'Premium Anual',
    planKey: 'premium_yearly',
    amount: 99.90,
    price: 'R$ 99,90',
    period: '/ano',
    duration: 365,
    icon: Sparkles,
    features: [
      'Tudo do Premium Trimestral',
      'Todos avatares, banners, decorações e fundos VIP',
      'Todos os canais ao vivo Premium',
      'Economia de 44%',
      'Acesso vitalício a promoções',
    ],
    excluded: [],
    highlight: false,
  },
];

const PremiumPage: React.FC = () => {
  const { user } = useAuth();
  const { isSubscribed, checkSubscriptionStatus } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [keyCode, setKeyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{ pixCode: string; amount: number; paymentId: string; expiresAt?: string } | null>(null);
  const [premiumAvatars, setPremiumAvatars] = useState<any[]>([]);
  const [premiumBanners, setPremiumBanners] = useState<any[]>([]);
  const [premiumDecorations, setPremiumDecorations] = useState<any[]>([]);
  const [premiumBackgrounds, setPremiumBackgrounds] = useState<any[]>([]);
  const [premiumChannels, setPremiumChannels] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [a, b, d, bg, ch] = await Promise.all([
        supabase.from('app_avatars').select('id,url,name').eq('is_premium', true).order('position').limit(8),
        (supabase as any).from('profile_banners').select('id,url,name').eq('is_premium', true).order('position').limit(6),
        (supabase as any).from('profile_decorations').select('id,url,name').eq('is_premium', true).order('position').limit(6),
        (supabase as any).from('profile_backgrounds').select('id,url,name').eq('is_premium', true).order('position').limit(6),
        supabase.from('livetv_channels').select('id,name,logo').limit(8),
      ]);
      setPremiumAvatars(a.data || []);
      setPremiumBanners(b.data || []);
      setPremiumDecorations(d.data || []);
      setPremiumBackgrounds(bg.data || []);
      setPremiumChannels(ch.data || []);
    })();
  }, []);

  const handleSubscribe = async (planKey: string, amount: number, durationDays: number) => {
    if (!user) {
      toast({ title: 'Faça login primeiro', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    setPayingPlan(planKey);
    try {
      // ── 1. Verifica se já existe um PIX pendente para este usuário ────────────
      const { data: existingLog } = await supabase
        .from('payments_logs')
        .select('payment_id, valor, link_pagamento, created_at')
        .eq('user_id', user.id)
        .eq('status_pagamento', 'pendente')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingLog?.payment_id) {
        const createdAt  = new Date(existingLog.created_at).getTime();
        const ageMinutes = (Date.now() - createdAt) / 1000 / 60;

        if (ageMinutes < 25 && existingLog.link_pagamento) {
          console.log('[PremiumPage] Reutilizando PIX pendente:', existingLog.payment_id);

          const { data: statusData } = await supabase.functions.invoke('orionpay-check-status', {
            body: { paymentId: existingLog.payment_id },
          });

          if (statusData?.paid) {
            toast({ title: '🎉 Pagamento confirmado!', description: 'Sua assinatura premium foi ativada!' });
            checkSubscriptionStatus();
            setPayingPlan(null);
            return;
          }

          setPixData({
            pixCode:   existingLog.link_pagamento,
            amount:    Number(existingLog.valor),
            paymentId: existingLog.payment_id,
          });
          setPayingPlan(null);
          return;
        }
      }

      // ── 2. Gera novo PIX ──────────────────────────────────────────────────────
      const { data, error } = await supabase.functions.invoke('orionpay-create-pix', {
        body: { plano: planKey, amount, durationDays },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'Falha ao gerar PIX');
      setPixData({ pixCode: data.pixCode, amount: data.amount, paymentId: data.paymentId, expiresAt: data.expiresAt });
    } catch (e) {
      toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Erro ao gerar PIX', variant: 'destructive' });
    } finally {
      setPayingPlan(null);
    }
  };

  const handleRedeemKey = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Faça login primeiro', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    if (!keyCode.trim()) {
      toast({ title: 'Erro', description: 'Digite uma chave válida', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: key, error: keyErr } = await supabase
        .from('premium_keys' as any)
        .select('*')
        .eq('key_code', keyCode.trim().toUpperCase())
        .eq('is_used', false)
        .single();

      if (keyErr || !key) {
        toast({ title: 'Chave inválida', description: 'Esta chave não existe ou já foi utilizada.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const typedKey = key as any;
      const durationDays = typedKey.duration_days || 30;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await supabase
        .from('premium_keys' as any)
        .update({ is_used: true, used_by: user.id, used_at: now.toISOString() } as any)
        .eq('id', typedKey.id);

      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingSub) {
        await supabase
          .from('subscriptions')
          .update({
            plano: 'premium',
            status: 'ativo',
            data_inicio: now.toISOString(),
            data_vencimento: expiresAt.toISOString(),
          })
          .eq('id', existingSub.id);
      } else {
        await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plano: 'premium',
            status: 'ativo',
            data_inicio: now.toISOString(),
            data_vencimento: expiresAt.toISOString(),
          });
      }

      toast({ title: '🎉 Premium Ativado!', description: `Seu plano premium está ativo por ${durationDays} dias!` });
      setKeyCode('');
      checkSubscriptionStatus();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Erro ao resgatar chave. Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen pt-8 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-transparent border border-yellow-500/30 p-8 md:p-12 mb-10">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-yellow-400/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="relative text-center">
              <Crown className="h-14 w-14 text-yellow-400 mx-auto mb-3 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
              <h1 className="text-4xl md:text-6xl font-black text-foreground mb-3 tracking-tight">FlixHub Premium</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Avatares exclusivos, banners animados, fundos premium, canais ao vivo e muito mais.
              </p>
            </div>
          </div>

          {/* Quick Redeem Key */}
          {!isSubscribed && (
            <div className="bg-card/60 backdrop-blur border border-yellow-500/20 rounded-2xl p-5 mb-10 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <Key className="h-5 w-5 text-yellow-400" />
                <h3 className="font-bold text-foreground">Já tem uma chave Premium?</h3>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={keyCode}
                  onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
                  className="flex-1 text-center tracking-widest font-mono"
                  disabled={loading}
                />
                <Button
                  onClick={handleRedeemKey}
                  disabled={loading || !keyCode.trim()}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  {loading ? '...' : 'Ativar'}
                </Button>
              </div>
            </div>
          )}

          {/* Status */}
          {isSubscribed && (
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-6 mb-10 text-center">
              <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <h2 className="text-xl font-bold text-yellow-400">Você é Premium!</h2>
              <p className="text-muted-foreground mt-1">Aproveite todos os benefícios do plano premium.</p>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative bg-card border rounded-2xl p-6 flex flex-col transition-all duration-200 ${
                    plan.highlight
                      ? 'border-yellow-400 shadow-lg shadow-yellow-400/10 scale-[1.03]'
                      : 'border-border'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                      Mais Popular
                    </span>
                  )}
                  <Icon className={`h-9 w-9 mb-3 ${plan.highlight ? 'text-yellow-400' : 'text-primary'}`} />
                  <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-extrabold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                  </div>
                  <ul className="space-y-2 flex-1 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                    {plan.excluded.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground/50 line-through">
                        <span className="h-4 w-4 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.highlight ? (
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold w-full"
                      disabled={isSubscribed || payingPlan === (plan as any).planKey}
                      onClick={() => handleSubscribe((plan as any).planKey, (plan as any).amount, (plan as any).duration)}
                    >
                      {isSubscribed ? 'Ativo' : payingPlan === (plan as any).planKey ? 'Gerando PIX...' : 'Escolher Plano'}
                    </Button>
                  ) : plan.price === 'R$ 0' ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano Atual
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full"
                      disabled={isSubscribed || payingPlan === (plan as any).planKey}
                      onClick={() => handleSubscribe((plan as any).planKey, (plan as any).amount, (plan as any).duration)}
                    >
                      {isSubscribed ? 'Ativo' : payingPlan === (plan as any).planKey ? 'Gerando PIX...' : 'Escolher Plano'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {!user && (
            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-3">Faça login para resgatar sua chave</p>
              <Button onClick={() => navigate('/auth')}>Entrar / Cadastrar</Button>
            </div>
          )}
        </div>
      </div>

      {pixData && (
        <PixPaymentModal
          open={!!pixData}
          onClose={() => setPixData(null)}
          pixCode={pixData.pixCode}
          amount={pixData.amount}
          paymentId={pixData.paymentId}
          expiresAt={pixData.expiresAt}
          onPaid={() => checkSubscriptionStatus()}
        />
      )}
    </Layout>
  );
};

export default PremiumPage;
