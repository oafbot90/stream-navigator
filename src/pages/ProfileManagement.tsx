import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, TrashIcon, Save, Lock, Image, Baby, Sparkles } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import AvatarSelectionScreen from '@/components/AvatarSelectionScreen';
import { motion } from 'framer-motion';
import BannerDecorationSelector from '@/components/BannerDecorationSelector';
import { useProfileCustomization } from '@/hooks/useProfileCustomization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ProfileManagement: React.FC = () => {
  const { id: profileId } = useParams<{ id: string }>();
  const isEditMode = !!profileId;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    profiles,
    createProfile,
    updateProfile,
    deleteProfile,
    loadingProfiles,
    refreshProfiles,
    selectProfile
  } = useProfiles();
  const { isSubscribed } = useSubscription();
  const profileLimit = isSubscribed ? 4 : 2;

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [isKidsProfile, setIsKidsProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isBannerDecoDialogOpen, setIsBannerDecoDialogOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [bannerId, setBannerId] = useState<string | null>(null);
  const [decorationId, setDecorationId] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  const { banner, decoration } = useProfileCustomization(bannerId, decorationId);

  const profileToEdit = isEditMode
    ? profiles.find((p) => p.id === profileId)
    : null;

  useEffect(() => {
    if (user && !hasInitialized) {
      refreshProfiles().then(() => setHasInitialized(true));
    }
  }, [user, refreshProfiles, hasInitialized]);

  useEffect(() => {
    if (profileToEdit && hasInitialized) {
      setName(profileToEdit.name);
      setAvatarUrl(profileToEdit.avatar_url ?? null);
      setPin(profileToEdit.pin || '');
      setIsPinEnabled(!!profileToEdit.pin);
      setIsKidsProfile(!!profileToEdit.is_kids_profile);
      setBannerId(profileToEdit.banner_id ?? null);
      setDecorationId(profileToEdit.decoration_id ?? null);
      setBackgroundUrl(profileToEdit.background_url ?? null);
    }
  }, [profileToEdit, hasInitialized]);

  const handleSelectAvatar = useCallback((newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
  }, []);

  const handlePinToggle = useCallback((checked: boolean) => {
    setIsPinEnabled(checked);
    if (!checked) setPin('');
  }, []);

  const handlePinChange = useCallback((value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 4) setPin(numericValue);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Por favor, digite um nome para o perfil', variant: 'destructive' });
      return;
    }

    if (isPinEnabled && (!pin || pin.length !== 4)) {
      toast({ title: 'PIN inválido', description: 'O PIN deve conter 4 dígitos', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const profileData = {
        name: name.trim(),
        avatar_url: avatarUrl,
        pin: isPinEnabled ? pin : null,
        is_kids_profile: isKidsProfile,
        banner_id: bannerId,
        decoration_id: decorationId,
        background_url: backgroundUrl,
      };

      if (isEditMode && profileId) {
        await updateProfile(profileId, profileData);
        toast({ title: 'Perfil atualizado', description: 'O perfil foi atualizado com sucesso' });
        await refreshProfiles();
        navigate('/profiles');
      } else {
        if (profiles.length >= profileLimit) {
          toast({
            title: 'Limite atingido',
            description: isSubscribed
              ? `Você já atingiu o limite de ${profileLimit} perfis`
              : `Usuários gratuitos podem criar até ${profileLimit} perfis. Faça upgrade para Premium.`,
            variant: 'destructive',
          });
          return;
        }

        const newProfile = await createProfile(profileData);
        toast({ title: 'Perfil criado', description: 'O perfil foi criado com sucesso' });
        selectProfile(newProfile);
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({ title: 'Erro', description: error.message || 'Ocorreu um erro ao salvar o perfil', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, avatarUrl, isPinEnabled, pin, isKidsProfile, bannerId, decorationId, backgroundUrl, isEditMode, profileId, profiles.length, profileLimit, isSubscribed, updateProfile, createProfile, selectProfile, refreshProfiles, navigate, toast]);

  const handleDeleteProfile = useCallback(async () => {
    if (!profileId) return;
    try {
      await deleteProfile(profileId);
      toast({ title: 'Perfil excluído', description: 'O perfil foi excluído com sucesso' });
      navigate('/profiles');
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast({ title: 'Erro', description: error.message || 'Ocorreu um erro ao excluir o perfil', variant: 'destructive' });
    }
  }, [profileId, deleteProfile, toast, navigate]);

  useEffect(() => {
    if (!user && hasInitialized) navigate('/auth');
  }, [user, hasInitialized, navigate]);

  useEffect(() => {
    if (isEditMode && hasInitialized && !loadingProfiles && !profileToEdit && profiles.length > 0) {
      toast({ title: 'Perfil não encontrado', description: 'O perfil que você está tentando editar não existe', variant: 'destructive' });
      navigate('/profiles');
    }
  }, [isEditMode, hasInitialized, loadingProfiles, profileToEdit, profiles.length, toast, navigate]);

  if (!user) return null;

  if (loadingProfiles || (isEditMode && !hasInitialized)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Custom background image */}
      {backgroundUrl && (
        <div className="absolute inset-0 pointer-events-none">
          <img src={backgroundUrl} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>
      )}
      {/* Background blur shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-primary/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] bg-primary/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 sm:py-8 max-w-xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profiles')}
            className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground ml-2">
            {isEditMode ? 'Editar Perfil' : 'Novo Perfil'}
          </h1>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Live Preview Card — banner + avatar + decoration */}
          <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-lg">
            {/* Banner preview */}
            <button
              type="button"
              onClick={() => setIsBannerDecoDialogOpen(true)}
              className="relative w-full h-28 sm:h-36 group cursor-pointer focus:outline-none"
            >
              {banner ? (
                <img
                  src={banner.url}
                  alt="Banner"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/40 to-primary/10" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <span className="text-sm font-medium text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Trocar Banner
                </span>
              </div>
            </button>

            {/* Avatar overlapping banner */}
            <div className="flex flex-col items-center -mt-14 pb-5 px-4">
              <button
                type="button"
                onClick={() => setIsAvatarDialogOpen(true)}
                className="relative group focus:outline-none"
              >
                <div className="rounded-full bg-card p-1 shadow-xl shadow-black/20">
                  <ProfileAvatar
                    avatarUrl={avatarUrl}
                    name={name || "?"}
                    size="xl"
                    frameStyle="none"
                    avatarClassName="h-[100px] w-[100px] sm:h-[120px] sm:w-[120px]"
                    imageClassName="object-cover object-center"
                  />
                </div>
                {/* Decoration overlay */}
                {decoration && (
                  <img
                    src={decoration.url}
                    alt="Decoração"
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[130px] w-[130px] -translate-x-1/2 -translate-y-1/2 object-contain sm:h-[155px] sm:w-[155px]"
                    loading="lazy"
                  />
                )}
                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 shadow-lg group-hover:scale-110 transition-transform">
                  <Image className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsAvatarDialogOpen(true)}
                className="mt-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Alterar Avatar
              </button>

              {/* Customize button */}
              <button
                type="button"
                onClick={() => setIsBannerDecoDialogOpen(true)}
                className="mt-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Sparkles className="h-3 w-3" /> Banner, Decoração & Fundo
              </button>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-4 bg-card rounded-2xl p-5 sm:p-6 border border-border">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground text-sm font-medium">
                Nome do Perfil
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do perfil"
                className="bg-secondary border-border text-foreground h-11 text-base rounded-xl"
                maxLength={20}
                autoComplete="off"
              />
            </div>

            {/* PIN toggle */}
            <div className="flex items-center justify-between p-3.5 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label htmlFor="pin-switch" className="text-foreground text-sm cursor-pointer">
                    Proteger com PIN
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Exigir PIN para acessar</p>
                </div>
              </div>
              <Switch id="pin-switch" checked={isPinEnabled} onCheckedChange={handlePinToggle} />
            </div>

            {isPinEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-secondary/50 rounded-xl"
              >
                <Label htmlFor="pin" className="text-foreground text-sm block mb-2">
                  PIN de 4 dígitos
                </Label>
                <Input
                  id="pin"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="• • • •"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="bg-card border-border text-foreground max-w-[160px] text-center text-xl tracking-[0.5em] font-medium h-12 rounded-xl"
                  autoComplete="off"
                />
              </motion.div>
            )}

            {/* Kids toggle */}
            <div className="flex items-center justify-between p-3.5 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Baby className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <Label htmlFor="kids-switch" className="text-foreground text-sm cursor-pointer">
                    Perfil Infantil
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Conteúdo restrito para crianças</p>
                </div>
              </div>
              <Switch id="kids-switch" checked={isKidsProfile} onCheckedChange={setIsKidsProfile} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
            {isEditMode ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto rounded-xl h-11">
                    <TrashIcon className="h-4 w-4" />
                    Excluir Perfil
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border mx-4 rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Excluir perfil?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Esta ação não pode ser desfeita. Todos os favoritos e histórico deste perfil serão perdidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="mt-0 rounded-xl">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProfile} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : <div />}

            <Button
              type="submit"
              className="gap-2 w-full sm:w-auto rounded-xl h-11"
              disabled={isSubmitting || !name.trim()}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </motion.form>

        {/* Avatar Selection */}
        <AvatarSelectionScreen
          selectedAvatar={avatarUrl}
          onSelectAvatar={handleSelectAvatar}
          isOpen={isAvatarDialogOpen}
          onClose={() => setIsAvatarDialogOpen(false)}
        />

        <BannerDecorationSelector
          isOpen={isBannerDecoDialogOpen}
          onClose={() => setIsBannerDecoDialogOpen(false)}
          selectedBannerId={bannerId}
          selectedDecorationId={decorationId}
          selectedBackgroundUrl={backgroundUrl}
          onSelectBanner={setBannerId}
          onSelectDecoration={setDecorationId}
          onSelectBackground={setBackgroundUrl}
        />
      </div>
    </div>
  );
};

export default ProfileManagement;
