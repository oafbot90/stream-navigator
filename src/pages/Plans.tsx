
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Calendar, CalendarDays, ArrowLeft, Crown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PixPaymentModal from '@/components/PixPaymentModal';

const Plans: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, checkSubscriptionStatus } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ pixCode: string; amount: number; paymentId: string; expiresAt?: string } | null>(null);

  const handleSubscribe = async (plano: 'premium' | 'vip' | 'teste', amountOverride?: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orionpay-create-pix', {
        body: { plano, amount: amountOverride, durationDays: plano === 'teste' ? 1 : undefined },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'Falha ao gerar PIX');
      setPixData({ pixCode: data.pixCode, amount: data.amount, paymentId: data.paymentId, expiresAt: data.expiresAt });
    } catch (e) {
      toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Erro ao gerar PIX', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const isCurrentPlan = (planType: string) => {
    return subscription?.plano === planType && subscription?.status === 'ativo';
  };

  return (
    <div className="bg-superflix-darker min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            className="text-white mr-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-white">Planos de Assinatura</h1>
          {subscription && (
            <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 ml-4">
              Plano Atual: {subscription.plano.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Status da assinatura atual */}
        {subscription && subscription.plano !== 'free' && (
          <Card className="mb-8 bg-gradient-to-br from-superflix-dark to-superflix-darker border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Sua Assinatura</h3>
                  <p className="text-superflix-text-muted">
                    Plano {subscription.plano.toUpperCase()} • Status: {subscription.status}
                  </p>
                  {subscription.dias_restantes && (
                    <p className="text-sm text-yellow-400 mt-1">
                      {subscription.dias_restantes} dias restantes
                    </p>
                  )}
                </div>
                <Crown className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Test Plan R$2 */}
          <Card className="bg-gradient-to-br from-superflix-dark to-superflix-darker border-yellow-500/40 shadow-lg overflow-hidden md:col-span-3">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>⚡ Plano Relâmpago (R$ 2,00)</span>
                <Badge className="bg-yellow-600 text-white">Relâmpago</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-superflix-text-muted text-sm mb-4">
                Plano Relâmpago: acesso premium imediato por 1 dia via PIX.
              </p>
              <Button
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                onClick={() => handleSubscribe('teste', 2)}
                disabled={loading}
              >
                Pagar R$ 2,00 (Relâmpago)
              </Button>
            </CardContent>
          </Card>

          {/* Free Plan */}
          <Card className="bg-gradient-to-br from-superflix-dark to-superflix-darker border-gray-800 shadow-lg overflow-hidden">
            <CardHeader className="relative">
              <CardTitle className="text-white flex items-center justify-between">
                <span>Plano Gratuito</span>
                {isCurrentPlan('free') && (
                  <Badge className="bg-green-600 text-white">Atual</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-3">
                <span className="text-3xl font-bold text-white">R$0,00</span>
                <span className="text-superflix-text-muted text-sm ml-1">/mês</span>
              </div>
              
              <ul className="mt-6 space-y-3 text-sm text-superflix-text-muted">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>Acesso limitado ao catálogo</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>Com anúncios</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>Qualidade SD</span>
                </li>
              </ul>
              
              {!isCurrentPlan('free') && (
                <Button 
                  className="w-full mt-6 bg-gray-600 hover:bg-gray-700"
                  disabled
                >
                  Plano Gratuito
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-gradient-to-br from-superflix-dark to-superflix-darker border-gray-800 shadow-lg overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-purple-500/20 to-blue-500/20"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-white flex items-center justify-between">
                <span>Plano Premium</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  {isCurrentPlan('premium') && (
                    <Badge className="bg-purple-600 text-white">Atual</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="mt-3">
                <span className="text-3xl font-bold text-white">R$9,90</span>
                <span className="text-superflix-text-muted text-sm ml-1">/mês</span>
              </div>
              
              <ul className="mt-6 space-y-3 text-sm text-superflix-text-muted">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>Sem anúncios</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>Acesso completo ao catálogo</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>2 telas simultâneas</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>Resolução Full HD</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>Download para offline</span>
                </li>
              </ul>
              
              <Button 
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={() => handleSubscribe('premium')}
                disabled={loading || isCurrentPlan('premium')}
              >
                {isCurrentPlan('premium') ? 'Plano Atual' : 'Assinar Premium'}
              </Button>
            </CardContent>
          </Card>
          
          {/* VIP Plan */}
          <Card className="bg-gradient-to-br from-superflix-dark to-superflix-darker border-gray-800 shadow-lg overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-amber-500/20 to-orange-500/20"></div>
            <CardHeader className="relative z-10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-400" />
                  <span>Plano VIP</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isCurrentPlan('vip') && (
                    <Badge className="bg-amber-600 text-white">Atual</Badge>
                  )}
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                    Recomendado
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="mt-3">
                <span className="text-3xl font-bold text-white">R$19,90</span>
                <span className="text-superflix-text-muted text-sm ml-1">/mês</span>
              </div>
              
              <ul className="mt-6 space-y-3 text-sm text-superflix-text-muted">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>Todos os benefícios Premium</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>4 telas simultâneas</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>Resolução 4K Ultra HD</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>Acesso prioritário a lançamentos</span>
                </li>
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  <span>Recomendações personalizadas com IA</span>
                </li>
              </ul>
              
              <Button 
                className="w-full mt-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                onClick={() => handleSubscribe('vip')}
                disabled={loading || isCurrentPlan('vip')}
              >
                {isCurrentPlan('vip') ? 'Plano Atual' : 'Assinar VIP'}
              </Button>
            </CardContent>
          </Card>
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
    </div>
  );
};

export default Plans;
