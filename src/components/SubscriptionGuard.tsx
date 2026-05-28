
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiresPremium?: boolean;
  contentType?: string;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ 
  children, 
  requiresPremium = false,
  contentType = 'conteúdo'
}) => {
  const { subscription, loading, hasAccess, isSubscribed } = useSubscription();
  const navigate = useNavigate();

  console.log('SubscriptionGuard - requiresPremium:', requiresPremium, 'hasAccess:', hasAccess, 'subscription:', subscription);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-superflix-darker">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Se não requer premium ou usuário tem acesso, mostrar conteúdo
  // Para usuários existentes, sempre permitir acesso ao conteúdo básico
  if (!requiresPremium || hasAccess || subscription?.plano === 'free') {
    console.log('Acesso liberado para o conteúdo');
    return <>{children}</>;
  }

  // Se requer premium e usuário não tem assinatura
  return (
    <div className="min-h-screen bg-superflix-darker flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gradient-to-br from-superflix-dark to-superflix-darker border-gray-800">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
              {requiresPremium ? <Crown className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Conteúdo Premium
            </h2>
            <p className="text-superflix-text-muted">
              Este {contentType} está disponível apenas para assinantes Premium e VIP.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-superflix-text-muted">
              <Crown className="w-4 h-4 mr-2 text-yellow-500" />
              <span>Acesso a todo o catálogo</span>
            </div>
            <div className="flex items-center text-sm text-superflix-text-muted">
              <Crown className="w-4 h-4 mr-2 text-yellow-500" />
              <span>Sem anúncios</span>
            </div>
            <div className="flex items-center text-sm text-superflix-text-muted">
              <Crown className="w-4 h-4 mr-2 text-yellow-500" />
              <span>Qualidade HD e 4K</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/plans')}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              Ver Planos de Assinatura
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full border-gray-600 text-white hover:bg-gray-800"
            >
              Voltar ao Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGuard;
