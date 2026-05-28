import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  Edit2, 
  Check, 
  X,
  Camera,
  Shield,
  Lock,
  Heart,
  Play,
  ThumbsUp,
  History,
  ChevronRight,
  Trash2,
  Crown,
  LogOut,
  Sparkles
} from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import AvatarSelector from '@/components/AvatarSelector';
import ProfileAvatar from '@/components/ProfileAvatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useContinueWatching, useDeleteWatchedContent } from '@/services/watchedContentService';
import { posterSizes } from '@/services/tmdbApi';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfileCustomization } from '@/hooks/useProfileCustomization';

/* ───────── Continue Watching Sub-component ───────── */
const ContinueWatchingManager: React.FC = () => {
  const { data: items, isLoading } = useContinueWatching();
  const deleteWatched = useDeleteWatchedContent();
  const { toast } = useToast();

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteWatched.mutateAsync(id);
      toast({ title: 'Removido', description: `"${title}" foi removido do continuar assistindo.` });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível remover.', variant: 'destructive' });
    }
  };

  if (isLoading || !items || items.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="text-foreground font-semibold flex items-center gap-2 mb-4">
        <Play className="w-4 h-4 text-primary" />
        Continuar Assistindo
      </h3>
      <div className="space-y-2">
        {items.map((item) => {
          const imageUrl = item.poster_path
            ? item.poster_path.startsWith('http') ? item.poster_path : `${posterSizes.small}${item.poster_path}`
            : '/placeholder.svg';
          return (
            <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
              <img src={imageUrl} alt={item.title} className="w-10 h-14 rounded-lg object-cover" loading="lazy" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium truncate">{item.title}</p>
                <div className="w-full h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress_percent || 0}%` }} />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => handleDelete(item.id, item.title)}
                disabled={deleteWatched.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ───────── Main Profile Page ───────── */
const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentProfile, updateProfile } = useProfiles();
  const { toast } = useToast();
  const { subscription, isSubscribed } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({ favoritesCount: 0, watchedCount: 0, likesCount: 0 });
  const { banner, decoration } = useProfileCustomization(currentProfile?.banner_id, currentProfile?.decoration_id);

  useEffect(() => {
    if (currentProfile) {
      setEditName(currentProfile.name);
      setSelectedAvatar(currentProfile.avatar_url || null);
      loadUserStats();
    }
  }, [currentProfile]);

  const loadUserStats = async () => {
    if (!user || !currentProfile) return;
    try {
      const [favorites, watched] = await Promise.all([
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('profile_id', currentProfile.id),
        supabase.from('watched_content').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('profile_id', currentProfile.id),
      ]);
      setUserStats({ favoritesCount: favorites.count || 0, watchedCount: watched.count || 0, likesCount: 0 });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleSaveName = async () => {
    if (!currentProfile || !editName.trim()) return;
    try {
      await updateProfile(currentProfile.id, { name: editName.trim() });
      setIsEditing(false);
      toast({ title: "Perfil atualizado", description: "Nome alterado com sucesso!" });
    } catch {
      toast({ title: "Erro", description: "Não foi possível atualizar o perfil", variant: "destructive" });
    }
  };

  const handleAvatarSelect = async (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleSaveAvatar = async () => {
    if (!currentProfile || !selectedAvatar) return;
    try {
      await updateProfile(currentProfile.id, { avatar_url: selectedAvatar });
      setShowAvatarSelector(false);
      toast({ title: "Avatar atualizado", description: "Seu avatar foi alterado com sucesso!" });
    } catch {
      toast({ title: "Erro", description: "Não foi possível atualizar o avatar", variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso" });
    } catch {
      toast({ title: "Erro", description: "Não foi possível fazer logout", variant: "destructive" });
    }
  };

  if (!user || !currentProfile) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Perfil não encontrado</h2>
            <p className="text-muted-foreground">Faça login para acessar seu perfil</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-10">
        {/* Hero Header */}
        <div className="relative">
          {/* Banner */}
          <div className="h-44 sm:h-56 w-full overflow-hidden">
            {banner ? (
              <img src={banner.url} alt="Banner" className="h-full w-full object-cover object-center" loading="lazy" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/25 via-secondary/40 to-primary/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>

          {/* Avatar + Info overlay */}
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 -mt-20">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="rounded-full bg-background p-1 shadow-2xl shadow-black/30">
                  <ProfileAvatar
                    avatarUrl={currentProfile.avatar_url}
                    name={currentProfile.name}
                    size="xl"
                    frameStyle="none"
                    avatarClassName="h-[110px] w-[110px] sm:h-[130px] sm:w-[130px]"
                    imageClassName="object-cover object-center"
                  />
                </div>
                {decoration && (
                  <img
                    src={decoration.url}
                    alt="Decoração"
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[145px] w-[145px] -translate-x-1/2 -translate-y-1/2 object-contain sm:h-[170px] sm:w-[170px]"
                    loading="lazy"
                  />
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-full shadow-lg border-2 border-background"
                  onClick={() => setShowAvatarSelector(true)}
                >
                  <Camera className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Name & meta */}
              <div className="flex-1 text-center sm:text-left pb-1 min-w-0">
                <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-[200px] h-9 bg-card"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                        autoFocus
                      />
                      <Button size="icon" className="h-9 w-9 rounded-full" onClick={handleSaveName}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-9 w-9 rounded-full" onClick={() => { setIsEditing(false); setEditName(currentProfile.name); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{currentProfile.name}</h1>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setIsEditing(true)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-center sm:justify-start text-muted-foreground text-xs">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Desde {new Date(currentProfile.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mt-2">
                  {currentProfile.is_kids_profile && (
                    <Badge variant="secondary" className="gap-1 rounded-full px-2.5 text-[10px]">
                      <Shield className="w-3 h-3" /> Kids
                    </Badge>
                  )}
                  {isSubscribed && (
                    <Badge className="gap-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-0 rounded-full px-2.5 text-[10px] shadow-sm shadow-amber-500/30">
                      <Crown className="w-3 h-3" /> Premium
                    </Badge>
                  )}
                </div>
                {isSubscribed && subscription?.data_vencimento && (
                  <p className="text-[10px] text-amber-400/80 mt-1">
                    Até {new Date(subscription.data_vencimento).toLocaleDateString('pt-BR')}
                    {subscription.dias_restantes != null && ` • ${subscription.dias_restantes}d restantes`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Heart, label: 'Favoritos', count: userStats.favoritesCount, color: 'text-red-500', href: '/favorites' },
              { icon: Play, label: 'Assistidos', count: userStats.watchedCount, color: 'text-green-500', href: '/history' },
              { icon: ThumbsUp, label: 'Curtidas', count: userStats.likesCount, color: 'text-blue-500', href: undefined },
            ].map(({ icon: Icon, label, count, color, href }) => (
              <button
                key={label}
                onClick={() => href && navigate(href)}
                className="bg-card rounded-2xl border border-border p-4 text-center hover:bg-muted/50 transition-colors"
              >
                <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
                <div className="text-xl font-bold text-foreground">{count}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {[
              { icon: History, label: 'Histórico', desc: 'Últimos assistidos', href: '/history' },
              { icon: User, label: 'Gerenciar Perfis', desc: 'Editar ou criar perfis', href: '/profiles' },
              { icon: Sparkles, label: 'Personalizar Tema', desc: 'Cores e aparência', href: '/themes' },
              { icon: Settings, label: 'Configurações', desc: 'Conta e privacidade', href: '/profile' },
            ].map(({ icon: Icon, label, desc, href }, i, arr) => (
              <button
                key={label}
                onClick={() => navigate(href)}
                className={`w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-muted/50 transition-colors ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>

          {/* Continue Watching */}
          <ContinueWatchingManager />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium hover:bg-destructive/15 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>

        {/* Avatar Selector Dialog */}
        <Dialog open={showAvatarSelector} onOpenChange={setShowAvatarSelector}>
          <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[85vh] overflow-hidden bg-card p-0 rounded-2xl">
            <DialogHeader className="p-4 pb-2 border-b border-border">
              <DialogTitle className="text-foreground text-center text-lg">Escolher Avatar</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto p-4 max-h-[55vh] sm:max-h-[50vh]">
              <AvatarSelector selectedAvatar={selectedAvatar} onSelectAvatar={handleAvatarSelect} />
            </div>
            <div className="p-4 pt-3 border-t border-border bg-card/95 backdrop-blur">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setShowAvatarSelector(false); setSelectedAvatar(currentProfile.avatar_url || null); }}
                  className="flex-1 h-11 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveAvatar}
                  className="flex-1 h-11 rounded-xl"
                  disabled={!selectedAvatar || selectedAvatar === currentProfile.avatar_url}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Profile;
