import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfiles } from '@/contexts/ProfileContext';
import { useSubscription } from '@/hooks/useSubscription';
import { UserProfile } from '@/types/profile.types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlusIcon, LogOut, Pencil } from 'lucide-react';
import PinEntry from '@/components/PinEntry';
import ProfileWelcomeScreen from '@/components/ProfileWelcomeScreen';
import { motion, AnimatePresence } from 'framer-motion';
import flixhubLogo from '@/assets/flixhub-logo.png';
import StreamingProfileCard from '@/components/StreamingProfileCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ProfilesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut, initialized } = useAuth();
  const { profiles, loadingProfiles, isRefreshing, selectProfile, refreshProfiles } = useProfiles();
  const { isSubscribed } = useSubscription();
  const profileLimit = isSubscribed ? 4 : 2;
  const { toast } = useToast();
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<UserProfile | null>(null);
  const [pinError, setPinError] = useState<string | undefined>();
  const [showNoProfileWarning, setShowNoProfileWarning] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [welcomeProfile, setWelcomeProfile] = useState<UserProfile | null>(null);
  const [previewProfile, setPreviewProfile] = useState<UserProfile | null>(null);

  const initPage = useCallback(async () => {
    if (!initialized) return;
    try {
      if (!user) { navigate('/auth'); return; }
      if (profiles.length === 0 && !isRefreshing && !loadingProfiles) {
        await refreshProfiles();
      }
      setPageReady(true);
    } catch (error) {
      console.error("Error initializing profiles page:", error);
      setPageReady(true);
    }
  }, [user, refreshProfiles, profiles.length, isRefreshing, loadingProfiles, navigate, initialized]);

  useEffect(() => { initPage(); }, [initPage]);

  const handleProfileClick = useCallback((profile: UserProfile) => {
    if (isEditMode) { navigate(`/profiles/edit/${profile.id}`); return; }
    if (profile.pin) {
      setSelectedProfileForPin(profile);
      setPinError(undefined);
    } else {
      const success = selectProfile(profile);
      if (success) {
        navigate('/');
      } else {
        toast({ title: "Erro", description: "Não foi possível selecionar o perfil", variant: "destructive" });
      }
    }
  }, [isEditMode, selectProfile, toast, navigate]);

  const handlePinSubmit = useCallback((enteredPin: string) => {
    if (!selectedProfileForPin) return;
    if (enteredPin === selectedProfileForPin.pin) {
      const success = selectProfile(selectedProfileForPin, enteredPin);
      if (success) {
        setSelectedProfileForPin(null);
        navigate('/');
      } else {
        setPinError('Erro ao selecionar perfil.');
      }
    } else {
      setPinError('PIN incorreto.');
    }
  }, [selectedProfileForPin, selectProfile]);

  const handlePinCancel = useCallback(() => {
    setSelectedProfileForPin(null);
    setPinError(undefined);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      toast({ title: 'Desconectado', description: 'Você foi desconectado.' });
      navigate('/auth');
    } catch {
      toast({ title: 'Erro', description: 'Falha ao sair.', variant: 'destructive' });
    }
  }, [signOut, toast, navigate]);

  const handleCreateProfile = useCallback(() => {
    if (profiles.length >= profileLimit) {
      setShowNoProfileWarning(true);
    } else {
      navigate('/profiles/new');
    }
  }, [profiles.length, profileLimit, navigate]);

  if (!initialized || !pageReady || loadingProfiles) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Hover preview: full-screen background of the hovered profile */}
      <AnimatePresence mode="wait">
        {previewProfile?.background_url && !isEditMode && !selectedProfileForPin && (
          <motion.div
            key={previewProfile.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 z-0 pointer-events-none will-change-[opacity]"
            aria-hidden
          >
            <img
              src={previewProfile.background_url}
              alt=""
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover object-center sm:object-cover"
              style={{ transform: 'translateZ(0)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preload all profile backgrounds for instant hover */}
      <div className="hidden" aria-hidden>
        {profiles.map(p => p.background_url && (
          <link key={p.id} rel="preload" as="image" href={p.background_url} />
        ))}
      </div>

      {/* Cinematic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-15%] w-[60%] h-[70%] bg-primary/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[60%] h-[70%] bg-primary/[0.02] rounded-full blur-[120px]" />
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[40%] h-[30%] bg-primary/[0.015] rounded-full blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_75%)]" />
      </div>

      {selectedProfileForPin ? (
        <div className="relative z-10 flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm"
          >
            <PinEntry onSubmit={handlePinSubmit} onCancel={handlePinCancel} error={pinError} />
          </motion.div>
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Top bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex justify-between items-center px-5 sm:px-8 pt-6 sm:pt-8"
          >
            <img src={flixhubLogo} alt="FlixHub" className="h-8 sm:h-10 object-contain" />
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditMode(prev => !prev)}
                className={`rounded-full px-4 h-9 text-xs font-medium transition-all duration-300 ${
                  isEditMode
                    ? 'text-primary bg-primary/10 hover:bg-primary/15 shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                {isEditMode ? 'Concluído' : 'Editar'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="rounded-full px-3.5 h-9 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
              >
                <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </motion.div>

          {/* Center content */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-center mb-10 sm:mb-14"
            >
              <h1 className="text-foreground text-2xl sm:text-3xl md:text-[2.5rem] font-bold tracking-tight leading-tight">
                {isEditMode ? 'Gerenciar Perfis' : 'Quem está assistindo?'}
              </h1>
              {isEditMode && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-muted-foreground text-sm mt-2.5"
                >
                  Toque em um perfil para editar
                </motion.p>
              )}
            </motion.div>

            {/* Profiles grid */}
            <div className="mx-auto flex w-full max-w-5xl flex-col items-stretch gap-3 px-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center sm:gap-x-8 sm:gap-y-8 sm:px-0">
              {isRefreshing ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex w-[200px] flex-col items-center py-4">
                    <div className="h-[100px] w-[184px] rounded-2xl bg-secondary/30 animate-pulse" />
                    <div className="-mt-12 h-[120px] w-[120px] rounded-full bg-secondary/30 animate-pulse ring-4 ring-background sm:h-[128px] sm:w-[128px]" />
                    <div className="mt-3 h-4 w-20 rounded-full bg-secondary/30 animate-pulse" />
                  </div>
                ))
              ) : profiles.length > 0 ? (
                <AnimatePresence>
                  {profiles.map((profile, index) => (
                    <StreamingProfileCard
                      key={profile.id}
                      index={index}
                      profile={profile}
                      isEditMode={isEditMode}
                      onClick={() => handleProfileClick(profile)}
                      onHoverChange={setPreviewProfile}
                    />
                  ))}
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center p-8"
                >
                  <p className="text-sm mb-5 text-muted-foreground">Nenhum perfil encontrado.</p>
                  <Button onClick={() => navigate('/profiles/new')} className="rounded-full px-6">
                    Criar Perfil
                  </Button>
                </motion.div>
              )}

              {/* Add profile button */}
              {profiles.length > 0 && profiles.length < 4 && !isEditMode && (
                <motion.button
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + profiles.length * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="group flex w-full max-w-md items-center gap-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-card/20 p-3 text-left transition-all duration-300 hover:border-primary/40 hover:bg-card/40 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:w-[200px] sm:max-w-none sm:flex-col sm:gap-0 sm:border-0 sm:bg-transparent sm:p-0 sm:px-2 sm:py-4 sm:text-center sm:hover:scale-105"
                  onClick={handleCreateProfile}
                  aria-label="Adicionar novo perfil"
                >
                  <div className="hidden sm:block relative h-[100px] w-[184px] rounded-2xl bg-secondary/20 border-2 border-dashed border-muted-foreground/20 transition-all duration-300 group-hover:border-primary/40 group-hover:bg-secondary/30" />
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary/30 transition-all duration-300 group-hover:bg-secondary/50 sm:-mt-12 sm:h-[120px] sm:w-[120px] sm:ring-4 sm:ring-background sm:h-[128px] sm:w-[128px]">
                    <PlusIcon className="h-7 w-7 text-muted-foreground/60 transition-all duration-300 group-hover:text-foreground group-hover:scale-110 sm:h-10 sm:w-10" />
                  </div>
                  <div className="flex-1 sm:flex-none">
                    <span className="block text-base font-semibold text-muted-foreground transition-colors duration-300 group-hover:text-foreground sm:mt-3 sm:text-sm">
                      Adicionar perfil
                    </span>
                  </div>
                  <div className="hidden sm:block h-5 mt-1.5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Limit dialog */}
      <Dialog open={showNoProfileWarning} onOpenChange={setShowNoProfileWarning}>
        <DialogContent className="bg-card text-foreground border-border mx-4 max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Limite atingido</DialogTitle>
            <DialogDescription>
              {isSubscribed
                ? 'Máximo de 4 perfis. Exclua um existente para criar outro.'
                : 'Usuários gratuitos podem criar até 2 perfis. Faça upgrade para Premium e tenha até 4 perfis.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowNoProfileWarning(false)} className="rounded-full px-5">Entendi</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome screen */}
      {welcomeProfile && (
        <ProfileWelcomeScreen
          profileName={welcomeProfile.name}
          avatarUrl={welcomeProfile.avatar_url}
          onComplete={() => {
            setWelcomeProfile(null);
            navigate('/');
          }}
        />
      )}
    </div>
  );
};

export default ProfilesPage;
