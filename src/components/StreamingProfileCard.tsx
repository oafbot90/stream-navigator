import React from 'react';
import { motion } from 'framer-motion';
import { Baby, Lock, Pencil } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useProfileCustomization } from '@/hooks/useProfileCustomization';
import { UserProfile } from '@/types/profile.types';
import { useIsMobile } from '@/hooks/use-mobile';

interface StreamingProfileCardProps {
  index: number;
  isEditMode: boolean;
  onClick: () => void;
  profile: UserProfile;
  onHoverChange?: (profile: UserProfile | null) => void;
}

const StreamingProfileCard: React.FC<StreamingProfileCardProps> = ({
  index,
  isEditMode,
  onClick,
  profile,
  onHoverChange,
}) => {
  const { banner, decoration } = useProfileCustomization(profile.banner_id, profile.decoration_id);
  const isMobile = useIsMobile();

  // Mobile: layout horizontal compacto (avatar à esquerda + info à direita)
  if (isMobile) {
    return (
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 + index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="group relative flex w-full max-w-md items-center gap-4 overflow-hidden rounded-2xl border border-border/30 bg-card/40 p-3 text-left shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card/60 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        onClick={onClick}
        aria-label={`${isEditMode ? 'Editar' : 'Selecionar'} perfil ${profile.name}`}
        type="button"
      >
        {/* Banner/background as faded backdrop */}
        {(banner?.url || profile.background_url) && (
          <div className="pointer-events-none absolute inset-0 opacity-25">
            <img
              src={banner?.url || profile.background_url || ''}
              alt=""
              aria-hidden
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/60 to-transparent" />
          </div>
        )}

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="rounded-full bg-background p-0.5 shadow-md">
            <ProfileAvatar
              avatarUrl={profile.avatar_url}
              name={profile.name}
              size="lg"
              frameStyle="none"
              avatarClassName="h-16 w-16"
              imageClassName="object-cover object-center"
            />
          </div>
          {decoration && (
            <img
              src={decoration.url}
              alt=""
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 object-contain"
              loading="lazy"
            />
          )}
        </div>

        {/* Info */}
        <div className="relative flex-1 min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{profile.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {profile.is_kids_profile && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Baby className="h-3 w-3" /> Kids
              </span>
            )}
            {profile.pin && (
              <span className="flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                <Lock className="h-3 w-3" /> PIN
              </span>
            )}
            {!profile.is_kids_profile && !profile.pin && (
              <span className="text-[11px] text-muted-foreground">Toque para entrar</span>
            )}
          </div>
        </div>

        {isEditMode && (
          <div className="relative rounded-full bg-primary/90 p-2 text-primary-foreground shadow-md">
            <Pencil className="h-3.5 w-3.5" />
          </div>
        )}
      </motion.button>
    );
  }

  // Desktop: layout original (vertical com banner + avatar circular)
  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group flex w-[200px] flex-col items-center rounded-2xl px-2 py-4 text-center transition-all duration-300 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98]"
      onClick={onClick}
      onMouseEnter={() => onHoverChange?.(profile)}
      onMouseLeave={() => onHoverChange?.(null)}
      onFocus={() => onHoverChange?.(profile)}
      onBlur={() => onHoverChange?.(null)}
      aria-label={`${isEditMode ? 'Editar' : 'Selecionar'} perfil ${profile.name}`}
      type="button"
    >
      <div className="relative flex w-full flex-col items-center">
        {/* Banner */}
        <div className="relative h-[100px] w-[184px] overflow-hidden rounded-2xl bg-secondary/30 shadow-lg shadow-black/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/10">
          {profile.background_url && (
            <img
              src={profile.background_url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-70 transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          )}
          {banner ? (
            <img
              src={banner.url}
              alt={`Banner de ${profile.name}`}
              className="relative h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : !profile.background_url ? (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-secondary/40 to-primary/10" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

          {isEditMode && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-2.5 top-2.5 rounded-full bg-primary/90 p-1.5 text-primary-foreground shadow-md backdrop-blur-sm"
            >
              <Pencil className="h-3.5 w-3.5" />
            </motion.div>
          )}
        </div>

        {/* Avatar */}
        <div className="relative -mt-12 transition-transform duration-300 group-hover:-translate-y-1">
          <div className="rounded-full bg-background p-1 shadow-xl shadow-black/30">
            <ProfileAvatar
              avatarUrl={profile.avatar_url}
              name={profile.name}
              size="xl"
              frameStyle="none"
              avatarClassName="h-[120px] w-[120px] sm:h-[128px] sm:w-[128px]"
              imageClassName="object-cover object-center"
            />
          </div>

          {decoration && (
            <img
              src={decoration.url}
              alt={`Decoração de ${profile.name}`}
              className="pointer-events-none absolute left-1/2 top-1/2 h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 object-contain sm:h-[168px] sm:w-[168px]"
              loading="lazy"
            />
          )}
        </div>
      </div>

      <span className="mt-3 block max-w-[180px] truncate text-center text-sm font-semibold text-muted-foreground transition-colors duration-300 group-hover:text-foreground sm:text-base">
        {profile.name}
      </span>

      {!isEditMode && (
        <div className="mt-1.5 flex min-h-5 items-center gap-2 text-muted-foreground/60">
          {profile.is_kids_profile && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary sm:text-xs">
              <Baby className="h-3 w-3" /> Kids
            </span>
          )}
          {profile.pin && (
            <span className="flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground sm:text-xs">
              <Lock className="h-3 w-3" />
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
};

export default StreamingProfileCard;
