
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  plano: string;
  status: string;
  access_granted: boolean;
  is_premium: boolean;
  data_vencimento?: string;
  dias_restantes?: number;
  subscription_id?: string;
}

interface PaymentData {
  plano: 'premium' | 'vip';
  periodo?: 'mensal' | 'trimestral' | 'anual';
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkSubscriptionStatus = async () => {
    if (!user) {
      // Deslogado: trata como free (mostra anúncios)
      setSubscription({
        plano: 'free',
        status: 'deslogado',
        access_granted: true,
        is_premium: false,
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Verificando status da assinatura para usuário:', user.id);

      const { data, error } = await supabase.functions.invoke('subscription-status');

      if (error) {
        console.error('Erro na função subscription-status:', error);
        // Em caso de erro, assumir free (mostra anúncios). Só escondemos ads quando premium é confirmado.
        setSubscription({
          plano: 'free',
          status: 'indisponivel',
          access_granted: true,
          is_premium: false,
        });
        return;
      }

      console.log('Status da assinatura recebido:', data);
      setSubscription(data);
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      setSubscription({
        plano: 'free',
        status: 'indisponivel',
        access_granted: true,
        is_premium: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (paymentData: PaymentData) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para assinar',
        variant: 'destructive'
      });
      return null;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('payment-create', {
        body: paymentData
      });

      if (error) throw error;

      toast({
        title: 'Link de pagamento criado!',
        description: 'Você será redirecionado para completar o pagamento',
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o link de pagamento',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  // Recarrega o status quando o pagamento PIX é confirmado
  useEffect(() => {
    const handler = () => {
      console.log('[useSubscription] evento subscription:refresh recebido');
      checkSubscriptionStatus();
    };
    window.addEventListener('subscription:refresh', handler);
    return () => window.removeEventListener('subscription:refresh', handler);
  }, [user]);

  return {
    subscription,
    loading,
    checkSubscriptionStatus,
    createPayment,
    isSubscribed: subscription?.is_premium === true,
    adsAllowed: !loading && subscription?.is_premium !== true,
    hasAccess: subscription?.access_granted || subscription?.plano === 'free' || true // Garantir acesso para usuários existentes
  };
};
