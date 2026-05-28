import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Coins, Star, Gift, CheckCircle, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { coinService, MISSIONS, COIN_PACKAGES } from '@/services/coinService';

const CoinShop: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyDone, setDailyDone] = useState(false);
  const [claimingMission, setClaimingMission] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [bal, daily] = await Promise.all([
      coinService.getBalance(user.id),
      coinService.getDailyLoginStatus(user.id),
    ]);
    setBalance(bal);
    setDailyDone(daily);
    setLoading(false);
  };

  const claimMission = async (missionType: string) => {
    if (!user) return;
    setClaimingMission(missionType);
    const result = await coinService.completeMission(user.id, missionType);
    if (result.success) {
      setBalance(result.coins);
      if (missionType === 'daily_login') setDailyDone(true);
      toast({ title: '🎉 Missão Completa!', description: `Você ganhou moedas!` });
    } else {
      toast({ title: 'Missão já completada', description: 'Tente novamente amanhã', variant: 'destructive' });
    }
    setClaimingMission(null);
  };

  const handleBuyPackage = (packageId: string) => {
    // TODO: integrate Stripe for real payments
    toast({ title: 'Em breve!', description: 'Pagamento será integrado em breve com Stripe/Pix' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button size="icon" variant="ghost" onClick={() => navigate('/cinema')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" /> Loja de Moedas
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-yellow-600/20 border border-yellow-600/40 rounded-full px-4 py-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="font-bold text-yellow-500 text-lg">{balance}</span>
          </div>
        </div>

        {/* Missões */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" /> Missões Grátis
          </h2>
          <div className="space-y-3">
            {MISSIONS.map((mission, i) => {
              const isDailyAndDone = mission.type === 'daily_login' && dailyDone;
              const isDisabled = isDailyAndDone || claimingMission === mission.type;
              const canClaim = mission.type === 'daily_login' && !dailyDone;

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`p-4 flex items-center gap-4 ${isDailyAndDone ? 'opacity-60' : ''} bg-card border-border`}>
                    <span className="text-3xl">{mission.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{mission.title}</h3>
                      <p className="text-sm text-muted-foreground">{mission.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                        <Coins className="h-4 w-4" /> +{mission.reward}
                      </span>
                      {isDailyAndDone ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : canClaim ? (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={isDisabled}
                          onClick={() => claimMission(mission.type)}
                        >
                          {claimingMission === mission.type ? '...' : 'Resgatar'}
                        </Button>
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Pacotes de Moedas */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" /> Comprar Moedas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COIN_PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Card className={`p-6 text-center relative overflow-hidden ${pkg.popular ? 'border-yellow-500 ring-2 ring-yellow-500/30' : 'border-border'} bg-card`}>
                  {pkg.popular && (
                    <div className="absolute top-0 right-0 bg-yellow-600 text-white text-xs px-3 py-1 rounded-bl-lg font-semibold">
                      POPULAR
                    </div>
                  )}
                  <Coins className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold text-foreground mb-1">{pkg.coins}</h3>
                  <p className="text-sm text-muted-foreground mb-4">moedas</p>
                  <Button
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                    onClick={() => handleBuyPackage(pkg.id)}
                  >
                    R$ {pkg.price.toFixed(2)}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CoinShop;
