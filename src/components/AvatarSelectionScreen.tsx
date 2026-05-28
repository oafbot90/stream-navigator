import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { X, Check, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { avatarService, AppAvatar } from '@/services/avatarService';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AvatarSelectionScreenProps {
  selectedAvatar: string | null;
  onSelectAvatar: (avatar: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AvatarSelectionScreen: React.FC<AvatarSelectionScreenProps> = ({
  selectedAvatar,
  onSelectAvatar,
  isOpen,
  onClose
}) => {
  const [avatars, setAvatars] = useState<AppAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSubscribed } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      avatarService.getAvatars().then(data => {
        setAvatars(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isOpen]);

  const currentIndex = useMemo(() => {
    if (!selectedAvatar) return -1;
    const match = selectedAvatar.match(/data:avatar\/(\d+)$/);
    return match ? parseInt(match[1]) : -1;
  }, [selectedAvatar]);

  const handleSelectAvatar = useCallback((index: number, isPremium: boolean) => {
    if (isPremium && !isSubscribed) {
      toast({
        title: '🔒 Avatar Premium',
        description: 'Assine o plano VIP para usar este avatar.',
        variant: 'destructive',
      });
      return;
    }
    onSelectAvatar(`data:avatar/${index}`);
  }, [onSelectAvatar, isSubscribed, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border w-[95vw] max-w-2xl p-0 max-h-[85vh] rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col h-full max-h-[85vh]">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Escolha um Avatar</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-full h-9 w-9"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Avatar Grid */}
          <ScrollArea className="flex-1 pr-2">
            {loading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 pb-4">
                {Array(10).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col items-center p-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary animate-pulse" />
                    <div className="w-12 h-3 mt-2 rounded bg-secondary animate-pulse" />
                  </div>
                ))}
              </div>
            ) : avatars.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum avatar disponível</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 pb-4">
                {avatars.map((avatar, index) => {
                  const isSelected = index === currentIndex;
                  const locked = avatar.is_premium && !isSubscribed;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      className={cn(
                        "relative group flex flex-col items-center p-2 rounded-xl transition-all duration-200",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95",
                        locked && "opacity-60",
                        isSelected
                          ? "bg-primary/15 ring-2 ring-primary"
                          : "hover:bg-muted/60"
                      )}
                      onClick={() => handleSelectAvatar(index, avatar.is_premium)}
                    >
                      <div className="relative">
                        <Avatar className={cn(
                          "h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden transition-all duration-200",
                          "ring-2 ring-offset-2 ring-offset-card",
                          isSelected ? "ring-primary scale-105" : "ring-border group-hover:ring-muted-foreground"
                        )}>
                          <AvatarImage src={avatar.url} alt={avatar.name} className="object-cover" loading="lazy" />
                          <AvatarFallback className="bg-muted text-muted-foreground rounded-2xl">
                            <User className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        {locked && (
                          <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-yellow-400" />
                          </div>
                        )}
                        {avatar.is_premium && (
                          <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center shadow-md">
                            <Crown className="w-3 h-3 text-black" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span className={cn(
                        "mt-2 text-xs sm:text-sm font-medium truncate max-w-full transition-colors",
                        isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {avatar.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              Cancelar
            </Button>
            <Button onClick={onClose} className="min-w-[100px]">
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelectionScreen;
