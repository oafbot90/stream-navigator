import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, CheckCircle, Clock, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { reportService, ContentReport } from '@/services/reportService';
import { motion } from 'framer-motion';

const ADMIN_EMAILS = ['alezin1299@gmail.com', 'alezin1788@gmail.com'];

const REPORT_LABELS: Record<string, string> = {
  video_not_playing: 'Vídeo não reproduz',
  audio_issue: 'Problema com áudio',
  subtitle_issue: 'Legenda com problema',
  wrong_content: 'Conteúdo errado',
  buffering: 'Travando / Buffering',
  other: 'Outro problema',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400', icon: <Clock className="h-3 w-3" /> },
  reviewing: { label: 'Analisando', color: 'bg-blue-500/20 text-blue-400', icon: <Eye className="h-3 w-3" /> },
  resolved: { label: 'Resolvido', color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="h-3 w-3" /> },
};

const AdminReports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadReports();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const loadReports = async () => {
    try {
      const data = await reportService.getReports();
      setReports(data);
    } catch (err) {
      toast({ title: 'Erro ao carregar relatórios', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await reportService.updateReportStatus(id, status);
      setReports(reports.map(r => r.id === id ? { ...r, status } : r));
      toast({ title: `Status atualizado para ${STATUS_CONFIG[status]?.label || status}` });
    } catch (err) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="rounded-xl">
                <ChevronLeft className="h-4 w-4 mr-1" /> Admin
              </Button>
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Relatórios de Problemas</h1>
              {pendingCount > 0 && (
                <Badge variant="destructive" className="text-xs">{pendingCount} pendentes</Badge>
              )}
            </div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">Nenhum relatório encontrado</div>
          ) : (
            <div className="space-y-3">
              {reports.map((report, i) => {
                const statusConf = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
                return (
                  <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <div className="rounded-xl border border-border/30 bg-card/50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{report.content_title}</span>
                            <Badge variant="outline" className="text-[10px]">{report.content_type}</Badge>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConf.color}`}>
                              {statusConf.icon} {statusConf.label}
                            </span>
                          </div>
                          <p className="text-xs text-primary font-medium">{REPORT_LABELS[report.report_type] || report.report_type}</p>
                          {report.message && <p className="text-xs text-muted-foreground mt-1">{report.message}</p>}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                            <span>👤 {report.user_email || 'Desconhecido'}</span>
                            <span>{new Date(report.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {report.status === 'pending' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(report.id, 'reviewing')}>
                              <Eye className="h-3 w-3 mr-1" /> Analisar
                            </Button>
                          )}
                          {report.status !== 'resolved' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-400 border-green-500/30" onClick={() => updateStatus(report.id, 'resolved')}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Resolver
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminReports;
