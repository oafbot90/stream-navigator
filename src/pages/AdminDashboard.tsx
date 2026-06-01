import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Users, CheckCircle, DollarSign, Film, Upload,
  Database, Globe, Shield, ChevronRight, Layers, Tv, Sparkles, Key,
  ImagePlus, Wifi, AlertTriangle, Search, LayoutDashboard, Library,
  PlusCircle, FolderOpen, CreditCard, Settings2, Smartphone, Activity,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ADMIN_EMAILS = ['alezin1299@gmail.com', 'alezin1788@gmail.com'];

type Tool = {
  label: string;
  description: string;
  icon: React.ReactNode;
  to: string;
};

type Section = {
  id: string;
  label: string;
  icon: React.ReactNode;
  tools: Tool[];
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const [activeSection, setActiveSection] = useState<string>('overview');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!isAdmin) {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta área", variant: "destructive" });
      navigate('/');
    }
  }, [user, isAdmin, navigate, toast]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [subsRes, moviesRes, seriesRes, animeMoviesRes, animeSeriesRes, paymentsRes, usersRes] = await Promise.all([
        supabase.from('subscriptions').select('user_id, plano, status'),
        supabase.from('movies_catalog').select('id', { count: 'exact', head: true }),
        supabase.from('series_catalog').select('id', { count: 'exact', head: true }),
        supabase.from('movies_catalog').select('id', { count: 'exact', head: true }).contains('genres', ['Animação']),
        supabase.from('series_catalog').select('id', { count: 'exact', head: true }).contains('genres', ['Animação']),
        supabase.from('payments_logs').select('valor, status_pagamento').eq('status_pagamento', 'aprovado'),
        supabase.functions.invoke('admin-dashboard', { body: { action: 'users' } }),
      ]);
      if (subsRes.error) throw subsRes.error;
      const subscriptions = (subsRes.data || []) as any[];
      const payments = (paymentsRes.data || []) as any[];
      const usersData = (usersRes.data || { users: [], total: 0 }) as any;
      const allUsers: any[] = usersData.users || [];
      return {
        totalUsers: Number(usersData.total || allUsers.length || 0),
        totalMovies: moviesRes.count || 0,
        totalSeries: seriesRes.count || 0,
        totalAnimes: (animeMoviesRes.count || 0) + (animeSeriesRes.count || 0),
        totalRevenue: payments.reduce((acc, p) => acc + Number(p.valor || 0), 0),
        recentUsers: allUsers.slice(-10),
        activeSubscriptions: subscriptions.filter((sub) => sub.status === 'ativo').length,
      };
    },
    enabled: !!isAdmin,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const sections: Section[] = useMemo(() => [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: <LayoutDashboard className="h-4 w-4" />,
      tools: [],
    },
    {
      id: 'catalog',
      label: 'Catálogo',
      icon: <Library className="h-4 w-4" />,
      tools: [
        { label: 'Filmes', description: `${stats?.totalMovies?.toLocaleString('pt-BR') || 0} no catálogo`, icon: <Film className="h-5 w-5" />, to: '/admin/movies' },
        { label: 'Séries', description: `${stats?.totalSeries?.toLocaleString('pt-BR') || 0} no catálogo`, icon: <Tv className="h-5 w-5" />, to: '/admin/series' },
        { label: 'Animes', description: `${stats?.totalAnimes?.toLocaleString('pt-BR') || 0} no catálogo`, icon: <Sparkles className="h-5 w-5" />, to: '/admin/animes' },
        { label: 'Coleções & Maratonas', description: 'Trilogias, sagas e coleções', icon: <Layers className="h-5 w-5" />, to: '/admin/marathons' },
        { label: 'Slider da Home', description: 'Destaques na tela inicial', icon: <Layers className="h-5 w-5" />, to: '/admin/slider' },
      ],
    },
    {
      id: 'add',
      label: 'Adicionar',
      icon: <PlusCircle className="h-4 w-4" />,
      tools: [
        { label: 'Adicionar Filme', description: 'Busca TMDB + URL manual', icon: <Upload className="h-5 w-5" />, to: '/admin/add-movie' },
        { label: 'Adicionar Série', description: 'Busca TMDB manual', icon: <Upload className="h-5 w-5" />, to: '/admin/add-series' },
        { label: 'Adicionar Anime', description: 'Busca TMDB', icon: <Sparkles className="h-5 w-5" />, to: '/admin/add-anime' },
        { label: 'Importar em Massa', description: 'Upload JSON + TMDB', icon: <Database className="h-5 w-5" />, to: '/admin/import' },
        { label: 'Enriquecer Sinopses (TMDB)', description: 'Preencher sinopses faltantes via TMDB', icon: <Sparkles className="h-5 w-5" />, to: '/admin/tmdb-enrich' },
      ],
    },
    {
      id: 'live',
      label: 'TV ao Vivo',
      icon: <Tv className="h-4 w-4" />,
      tools: [
        { label: 'Canais ao Vivo', description: 'Gerenciar canais Premium', icon: <Tv className="h-5 w-5" />, to: '/admin/livetv' },
        { label: 'Monitor de Streams', description: 'Status das streams', icon: <Wifi className="h-5 w-5" />, to: '/admin/streams' },
        { label: 'Status dos Links', description: 'Online, offline e sem links', icon: <Activity className="h-5 w-5" />, to: '/admin/stream-status' },
      ],
    },
    {
      id: 'monetization',
      label: 'Monetização',
      icon: <CreditCard className="h-4 w-4" />,
      tools: [
        { label: 'Planos & Assinaturas', description: 'Configurar planos', icon: <DollarSign className="h-5 w-5" />, to: '/plans' },
        { label: 'Chaves Premium', description: 'Gerar e gerenciar chaves', icon: <Key className="h-5 w-5" />, to: '/admin/premium-keys' },
      ],
    },
    {
      id: 'customization',
      label: 'Personalização',
      icon: <Settings2 className="h-4 w-4" />,
      tools: [
        { label: 'Avatares de Perfil', description: 'Gerenciar avatares', icon: <ImagePlus className="h-5 w-5" />, to: '/admin/avatars' },
        { label: 'Banners & Decorações', description: 'Decorações e fundos', icon: <Sparkles className="h-5 w-5" />, to: '/admin/customization' },
      ],
    },
    {
      id: 'app',
      label: 'Aplicativo',
      icon: <Smartphone className="h-4 w-4" />,
      tools: [
        { label: 'Versões do App (APK)', description: 'Upload APK + screenshots', icon: <Upload className="h-5 w-5" />, to: '/admin/app-releases' },
        { label: 'Configuração do App', description: 'Versão mínima e atualização forçada', icon: <Settings2 className="h-5 w-5" />, to: '/admin/app-config' },
      ],
    },
    {
      id: 'support',
      label: 'Suporte',
      icon: <AlertTriangle className="h-4 w-4" />,
      tools: [
        { label: 'Relatórios', description: 'Problemas reportados', icon: <AlertTriangle className="h-5 w-5" />, to: '/admin/reports' },
        { label: 'Calendário de Lançamentos', description: 'Adicionar lançamentos e anexar players', icon: <Layers className="h-5 w-5" />, to: '/admin/calendar' },
      ],
    },
  ], [stats]);

  const allTools = useMemo(() => sections.flatMap(s => s.tools.map(t => ({ ...t, sectionLabel: s.label }))), [sections]);
  const filteredSearchTools = search.trim()
    ? allTools.filter(t => t.label.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
    : [];

  const currentSection = sections.find(s => s.id === activeSection) || sections[0];

  if (!user || !isAdmin) return null;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary" />
              <Shield className="absolute inset-0 m-auto h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Carregando painel...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    { title: 'Usuários', value: stats?.totalUsers || 0, icon: <Users className="h-4 w-4" />, color: 'text-blue-400', bg: 'from-blue-500/10' },
    { title: 'Assinantes', value: stats?.activeSubscriptions || 0, icon: <CheckCircle className="h-4 w-4" />, color: 'text-emerald-400', bg: 'from-emerald-500/10' },
    { title: 'Filmes', value: (stats?.totalMovies || 0).toLocaleString('pt-BR'), icon: <Film className="h-4 w-4" />, color: 'text-violet-400', bg: 'from-violet-500/10' },
    { title: 'Séries', value: (stats?.totalSeries || 0).toLocaleString('pt-BR'), icon: <Tv className="h-4 w-4" />, color: 'text-pink-400', bg: 'from-pink-500/10' },
    { title: 'Animes', value: (stats?.totalAnimes || 0).toLocaleString('pt-BR'), icon: <Sparkles className="h-4 w-4" />, color: 'text-cyan-400', bg: 'from-cyan-500/10' },
    { title: 'Receita', value: `R$ ${stats?.totalRevenue?.toFixed(2) || '0.00'}`, icon: <DollarSign className="h-4 w-4" />, color: 'text-amber-400', bg: 'from-amber-500/10' },
  ];

  return (
    <Layout>
      <div className="relative min-h-screen pt-20 pb-12 overflow-hidden">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-violet-500/15 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card/80 via-card/40 to-transparent backdrop-blur-xl p-6 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_60%)]" />
              <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/40 blur-xl rounded-2xl" />
                      <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
                        <Shield className="h-6 w-6 text-primary-foreground" />
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-widest font-bold backdrop-blur-sm">Admin Panel</Badge>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-semibold text-emerald-400">Online</span>
                    </div>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                    Painel de Controle
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm sm:text-base">Gerencie tudo da FlixHub em um só lugar</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-2 rounded-xl shadow-lg shadow-primary/20" asChild>
                    <Link to="/"><Globe className="h-4 w-4" /> Ver Site</Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <div className="relative mb-6 max-w-xl group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-violet-500/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative">
              <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar ferramenta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 rounded-2xl bg-card/60 border-border/40 backdrop-blur-xl"
              />
            </div>
          </div>

          {search.trim() ? (
            /* Search Results */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSearchTools.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full text-center py-10">Nenhuma ferramenta encontrada</p>
              )}
              {filteredSearchTools.map((t) => (
                <ToolCard key={t.to} tool={t} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
              {/* Sidebar Navigation */}
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <nav className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-xl p-2 flex lg:flex-col gap-1 overflow-x-auto shadow-xl shadow-black/5">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={cn(
                        "relative flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap text-left flex-shrink-0 lg:w-full group/btn",
                        activeSection === s.id
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      {s.icon}
                      <span className="flex-1">{s.label}</span>
                      {s.tools.length > 0 && (
                        <Badge variant="secondary" className={cn(
                          "text-[10px] h-5 px-1.5 ml-auto hidden lg:inline-flex",
                          activeSection === s.id ? "bg-primary-foreground/20 text-primary-foreground border-0" : ""
                        )}>
                          {s.tools.length}
                        </Badge>
                      )}
                    </button>
                  ))}
                </nav>
              </aside>

              {/* Content Area */}
              <div className="min-w-0">
                {activeSection === 'overview' ? (
                  <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {statCards.map((s, i) => (
                        <motion.div
                          key={s.title}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileHover={{ y: -3 }}
                          className={`group relative overflow-hidden rounded-2xl border border-border/40 p-5 bg-gradient-to-br ${s.bg} via-card/40 to-card/20 backdrop-blur-xl hover:border-primary/40 transition-all duration-300`}
                        >
                          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.title}</p>
                              <div className={cn("p-2 rounded-xl bg-white/5 border border-white/5", s.color)}>{s.icon}</div>
                            </div>
                            <p className="text-3xl font-black tracking-tight text-foreground">{s.value}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Quick Access */}
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        Acesso Rápido
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sections.slice(1, 5).flatMap(s => s.tools).slice(0, 6).map(t => (
                          <ToolCard key={t.to} tool={t} compact />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      {currentSection.icon}
                      <h2 className="text-xl font-bold text-foreground">{currentSection.label}</h2>
                      <Badge variant="secondary" className="text-[10px]">{currentSection.tools.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentSection.tools.map(t => (
                        <ToolCard key={t.to} tool={t} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const ToolCard: React.FC<{ tool: Tool & { sectionLabel?: string }; compact?: boolean }> = ({ tool, compact }) => (
  <Link to={tool.to} className="block group">
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-4 hover:border-primary/50 hover:bg-card/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30 transition-all shrink-0">
          {tool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{tool.label}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{tool.description}</p>
          {tool.sectionLabel && !compact && (
            <Badge variant="secondary" className="text-[9px] mt-1.5">{tool.sectionLabel}</Badge>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
      </div>
    </div>
  </Link>
);


export default AdminDashboard;
