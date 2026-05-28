import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Coins, Trophy, CheckCircle, Lock, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { coinService, MISSIONS } from '@/services/coinService';

interface MissionStatus {
  type: string;
  completed: boolean;
  progress: number;
  target: number;
}

const CinemaMissions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [missionStatuses, setMissionStatuses] = useState<MissionStatus[]>([]);
  const [claimingMission, setClaimingMission] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const bal = await coinService.getBalance(user.id);
    setBalance(bal);

    const statuses = await Promise.all(
      MISSIONS.map(async (m) => {
        const status = await coinService.getMissionProgress(user.id, m.type);
        return { type: m.type, ...status };
      })
    );
    setMissionStatuses(statuses);
    setLoading(false);
  };

  const claimMission = async (missionType: string) => {
    if (!user) return;
    setClaimingMission(missionType);
    const result = await coinService.completeMission(user.id, missionType);
    if (result.success) {
      setBalance(result.coins);
      toast({ title: '🎉 Missão Completa!', description: 'Moedas resgatadas com sucesso!' });
      loadData();
    } else {
      toast({ title: 'Não disponível', description: 'Missão já completada ou requisitos não atingidos', variant: 'destructive' });
    }
    setClaimingMission(null);
  };

  const getStatus = (type: string): MissionStatus => {
    return missionStatuses.find(s => s.type === type) || { type, completed: false, progress: 0, target: 1 };
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'daily': return 'Diária';
      case 'social': return 'Social';
      case 'watch': return 'Assistir';
      default: return cat;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'daily': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'social': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'watch': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  const completedCount = missionStatuses.filter(s => s.completed).length;
  const nextReset = new Date();
  nextReset.setDate(nextReset.getDate() + 1);
  nextReset.setHours(0, 0, 0, 0);
  const hoursUntilReset = Math.max(0, Math.ceil((nextReset.getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button size="icon" variant="ghost" onClick={() => navigate('/cinema')} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Missões Diárias
            </h1>
            <p className="text-xs text-muted-foreground">Complete missões e ganhe moedas</p>
          </div>
          <div className="flex items-center gap-2 bg-yellow-600/20 border border-yellow-600/40 rounded-full px-3 py-1.5">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="font-bold text-yellow-500 text-sm">{balance}</span>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="p-4 mb-6 bg-card border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">Progresso Diário</p>
              <p className="text-xs text-muted-foreground">{completedCount}/{MISSIONS.length} missões</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Reseta em {hoursUntilReset}h
            </div>
          </div>
          <Progress value={(completedCount / MISSIONS.length) * 100} className="h-2" />
          {completedCount === MISSIONS.length && (
            <p className="text-xs text-primary mt-2 flex items-center gap-1"><Zap className="h-3 w-3" /> Todas as missões concluídas hoje! 🎉</p>
          )}
        </Card>

        {/* Missions List */}
        <div className="space-y-3">
          {MISSIONS.map((mission, i) => {
            const status = getStatus(mission.type);
            const progressPct = status.target > 0 ? Math.min(100, (status.progress / status.target) * 100) : 0;
            const canClaim = mission.type === 'daily_login' && !status.completed;

            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className={`p-4 bg-card border-border ${status.completed ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-0.5">{mission.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm">{mission.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getCategoryColor(mission.category)}`}>
                          {getCategoryLabel(mission.category)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{mission.description}</p>
                      
                      <div className="flex items-center gap-2 mb-1">
                        <Progress value={status.completed ? 100 : progressPct} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{status.progress}/{status.target}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-yellow-500 font-bold text-xs">
                        <Coins className="h-3.5 w-3.5" /> +{mission.reward}
                      </span>
                      {status.completed ? (
                        <div className="flex items-center gap-1 text-green-500 text-xs">
                          <CheckCircle className="h-4 w-4" /> Feito
                        </div>
                      ) : canClaim ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          disabled={claimingMission === mission.type}
                          onClick={() => claimMission(mission.type)}
                        >
                          {claimingMission === mission.type ? '...' : 'Resgatar'}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Lock className="h-3.5 w-3.5" /> Bloqueada
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground">
            💡 As missões são resetadas diariamente à meia-noite. Complete todas para maximizar seus ganhos de moedas!
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default CinemaMissions;
