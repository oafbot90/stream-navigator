import React, { useEffect, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Check, Lock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { avatarService, AppAvatar } from '@/services/avatarService';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

const fallbackAvatars = [
  { url: 'https://i.ibb.co/272GtBGq/185956f7-318e-4f8c-8779-eaf6a15bd4ca.png', name: 'Flix', color: 'from-red-500 to-red-700' },
  { url: 'https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg', name: 'Clássico', color: 'from-orange-500 to-red-600' },
  { url: 'https://wallpapers.com/images/hd/netflix-profile-pictures-5yup5hd2i60x7ew3.jpg', name: 'Amarelo', color: 'from-yellow-400 to-orange-500' },
  { url: 'https://mir-s3-cdn-cf.behance.net/project_modules/disp/366be133850498.56ba69ac36858.png', name: 'Verde', color: 'from-green-400 to-emerald-600' },
  { url: 'https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-88wkdmjrorckekha.jpg', name: 'Azul', color: 'from-blue-400 to-blue-600' },
  { url: 'https://66.media.tumblr.com/6cfad7b0f3f24fce553314ce521453e3/tumblr_psapldQm9w1wxrxy2_540.png', name: 'Lucifer', color: 'from-gray-700 to-gray-900' },
  { url: 'https://i.imgur.com/9nWtdiZ.png', name: 'Pepino', color: 'from-green-400 to-lime-500' },
  { url: 'https://i.imgur.com/APYSZGK.png', name: 'Roxo', color: 'from-purple-400 to-purple-600' },
  { url: 'https://i.imgur.com/3ZtRl1h.png', name: 'Dourado', color: 'from-yellow-400 to-amber-600' },
  { url: 'https://i.imgur.com/Kkaeq84.png', name: 'Violeta', color: 'from-violet-400 to-purple-600' }
];

export const avatars = fallbackAvatars;

export const getAvatarImageUrl = (avatarUrl: string | undefined): string => {
  if (!avatarUrl) return '';
  const match = avatarUrl.match(/data:avatar\/(\d+)$/);
  if (match) {
    const index = parseInt(match[1]);
    return fallbackAvatars[index]?.url || '';
  }
  return avatarUrl;
};

interface AvatarSelectorProps {
  selectedAvatar: string | null;
  onSelectAvatar: (avatar: string) => void;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selectedAvatar, onSelectAvatar }) => {
  const [dbAvatars, setDbAvatars] = useState<AppAvatar[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { isSubscribed } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    avatarService.getAvatars().then(data => {
      if (data.length > 0) setDbAvatars(data);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const displayAvatars = dbAvatars.length > 0
    ? dbAvatars
    : fallbackAvatars.map((a, i) => ({ ...a, id: String(i), position: i, is_premium: false }));

  const getAvatarIndex = (url: string | null): number => {
    if (!url) return -1;
    const match = url.match(/data:avatar\/(\d+)$/);
    return match ? parseInt(match[1]) : -1;
  };

  const getAvatarUrl = (index: number): string => `data:avatar/${index}`;
  const currentIndex = getAvatarIndex(selectedAvatar);

  const handleSelect = (index: number, isPremium: boolean) => {
    if (isPremium && !isSubscribed) {
      toast({ title: '🔒 Avatar Premium', description: 'Assine o plano VIP para usar este avatar.', variant: 'destructive' });
      return;
    }
    onSelectAvatar(getAvatarUrl(index));
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
        {displayAvatars.map((avatar, index) => {
          const isSelected = index === currentIndex;
          const locked = avatar.is_premium && !isSubscribed;

          return (
            <button
              key={avatar.id || index}
              type="button"
              className={cn(
                "relative group flex flex-col items-center p-2 sm:p-3 rounded-xl transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "active:scale-95",
                locked && "opacity-60",
                isSelected
                  ? "bg-primary/20 ring-2 ring-primary"
                  : "hover:bg-muted/50 active:bg-muted"
              )}
              onClick={() => handleSelect(index, avatar.is_premium)}
            >
              <div className="relative">
                <div className={cn(
                  "absolute -inset-1 rounded-full opacity-0 transition-opacity duration-200",
                  `bg-gradient-to-br ${avatar.color}`,
                  isSelected && "opacity-100"
                )} />
                <Avatar className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all duration-200",
                  "ring-2 ring-offset-2 ring-offset-background",
                  isSelected ? "ring-primary scale-105" : "ring-border group-hover:ring-muted-foreground"
                )}>
                  <AvatarImage src={avatar.url} alt={avatar.name} className="object-cover" loading="lazy" />
                  <AvatarFallback className="bg-muted text-muted-foreground"><User className="w-6 h-6" /></AvatarFallback>
                </Avatar>
                {locked && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-yellow-400" />
                  </div>
                )}
                {avatar.is_premium && (
                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center shadow-md">
                    <Crown className="w-3 h-3 text-black" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
              </div>
              <span className={cn(
                "mt-2 text-xs sm:text-sm font-medium truncate max-w-full px-1 transition-colors",
                isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {avatar.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarSelector;
