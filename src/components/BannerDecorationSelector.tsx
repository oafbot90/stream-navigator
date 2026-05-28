import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, ImageIcon, Sparkles, Lock, Crown, Wallpaper, Smartphone, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface BannerItem {
  id: string;
  name: string;
  url: string;
  is_animated: boolean;
  is_premium: boolean;
  position: number;
}

interface DecorationItem {
  id: string;
  name: string;
  url: string;
  is_animated: boolean;
  is_premium: boolean;
  type: string;
  position: number;
}

interface BackgroundItem {
  id: string;
  name: string;
  url: string;
  is_premium: boolean;
  position: number;
  orientation: 'horizontal' | 'vertical';
}

interface BannerDecorationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBannerId: string | null;
  selectedDecorationId: string | null;
  selectedBackgroundUrl?: string | null;
  onSelectBanner: (id: string | null) => void;
  onSelectDecoration: (id: string | null) => void;
  onSelectBackground?: (url: string | null) => void;
}

const BannerDecorationSelector: React.FC<BannerDecorationSelectorProps> = ({
  isOpen,
  onClose,
  selectedBannerId,
  selectedDecorationId,
  selectedBackgroundUrl,
  onSelectBanner,
  onSelectDecoration,
  onSelectBackground,
}) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [decorations, setDecorations] = useState<DecorationItem[]>([]);
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bgFilter, setBgFilter] = useState<'horizontal' | 'vertical'>('horizontal');
  const { isSubscribed } = useSubscription();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    setBgFilter(isMobile ? 'vertical' : 'horizontal');
  }, [isMobile]);

  const filteredBackgrounds = useMemo(
    () => backgrounds.filter((bg) => (bg.orientation || 'horizontal') === bgFilter),
    [backgrounds, bgFilter]
  );

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    Promise.all([
      supabase.from('profile_banners').select('*').order('position', { ascending: true }),
      supabase.from('profile_decorations').select('*').order('position', { ascending: true }),
      (supabase as any).from('profile_backgrounds').select('*').order('position', { ascending: true }),
    ]).then(([bannersRes, decorationsRes, backgroundsRes]) => {
      setBanners((bannersRes.data as BannerItem[]) || []);
      setDecorations((decorationsRes.data as DecorationItem[]) || []);
      setBackgrounds((backgroundsRes.data as BackgroundItem[]) || []);
      setLoading(false);
    });
  }, [isOpen]);

  const handleSelectBanner = (id: string | null, isPremium?: boolean) => {
    if (isPremium && !isSubscribed) {
      toast({ title: '🔒 Conteúdo Premium', description: 'Assine o plano VIP para desbloquear este banner.', variant: 'destructive' });
      return;
    }
    onSelectBanner(id);
  };

  const handleSelectDecoration = (id: string | null, isPremium?: boolean) => {
    if (isPremium && !isSubscribed) {
      toast({ title: '🔒 Conteúdo Premium', description: 'Assine o plano VIP para desbloquear esta decoração.', variant: 'destructive' });
      return;
    }
    onSelectDecoration(id);
  };

  const handleSelectBackground = (url: string | null, isPremium?: boolean) => {
    if (!onSelectBackground) return;
    if (isPremium && !isSubscribed) {
      toast({ title: '🔒 Conteúdo Premium', description: 'Assine o plano VIP para desbloquear este fundo.', variant: 'destructive' });
      return;
    }
    onSelectBackground(url);
  };

  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="aspect-[16/9] rounded-xl bg-secondary animate-pulse" />
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border w-[95vw] max-w-2xl p-0 max-h-[85vh] rounded-2xl overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col h-full max-h-[85vh]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Personalizar Perfil</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground rounded-full h-9 w-9">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Tabs defaultValue="banners" className="flex-1 flex flex-col min-h-0">
            <TabsList className="bg-muted w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="banners" className="gap-2"><ImageIcon className="w-4 h-4" />Banners</TabsTrigger>
              <TabsTrigger value="decorations" className="gap-2"><Sparkles className="w-4 h-4" />Decorações</TabsTrigger>
              <TabsTrigger value="backgrounds" className="gap-2"><Wallpaper className="w-4 h-4" />Fundos</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="banners" className="mt-0 pb-2">
                {loading ? <SkeletonGrid /> : banners.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum banner disponível</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectBanner(null)}
                      className={cn(
                        "relative aspect-[16/9] rounded-xl border-2 transition-all flex items-center justify-center bg-secondary/50",
                        !selectedBannerId ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <span className="text-sm text-muted-foreground">Nenhum</span>
                      {!selectedBannerId && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                    {banners.map((banner) => {
                      const isSelected = selectedBannerId === banner.id;
                      const locked = banner.is_premium && !isSubscribed;
                      return (
                        <button
                          key={banner.id}
                          type="button"
                          onClick={() => handleSelectBanner(banner.id, banner.is_premium)}
                          className={cn(
                            "relative aspect-[16/9] rounded-xl border-2 overflow-hidden transition-all group",
                            locked && "opacity-60",
                            isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground"
                          )}
                        >
                          <img src={banner.url} alt={banner.name} className="w-full h-full object-cover" loading="lazy" />
                          {locked && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="flex flex-col items-center gap-1">
                                <Lock className="w-5 h-5 text-yellow-400" />
                                <span className="text-[10px] text-yellow-400 font-bold">VIP</span>
                              </div>
                            </div>
                          )}
                          {banner.is_premium && (
                            <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 text-[10px] bg-yellow-500/90 text-black px-1.5 py-0.5 rounded-md font-bold">
                              <Crown className="w-3 h-3" /> VIP
                            </span>
                          )}
                          {banner.is_animated && !banner.is_premium && (
                            <span className="absolute top-1.5 left-1.5 text-[10px] bg-primary/80 text-primary-foreground px-1.5 py-0.5 rounded-md font-medium">GIF</span>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <span className="text-xs text-white font-medium">{banner.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="decorations" className="mt-0 pb-2">
                {loading ? <SkeletonGrid /> : decorations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma decoração disponível</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectDecoration(null)}
                      className={cn(
                        "relative aspect-square rounded-xl border-2 transition-all flex items-center justify-center bg-secondary/50",
                        !selectedDecorationId ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <span className="text-xs text-muted-foreground">Nenhum</span>
                      {!selectedDecorationId && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                    {decorations.map((decoration) => {
                      const isSelected = selectedDecorationId === decoration.id;
                      const locked = decoration.is_premium && !isSubscribed;
                      return (
                        <button
                          key={decoration.id}
                          type="button"
                          onClick={() => handleSelectDecoration(decoration.id, decoration.is_premium)}
                          className={cn(
                            "relative aspect-square rounded-xl border-2 overflow-hidden transition-all group",
                            locked && "opacity-60",
                            isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground"
                          )}
                        >
                          <img src={decoration.url} alt={decoration.name} className="w-full h-full object-contain p-1" loading="lazy" />
                          {locked && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <Lock className="w-4 h-4 text-yellow-400" />
                                <span className="text-[9px] text-yellow-400 font-bold">VIP</span>
                              </div>
                            </div>
                          )}
                          {decoration.is_premium && (
                            <span className="absolute top-1 left-1 flex items-center gap-0.5 text-[9px] bg-yellow-500/90 text-black px-1 py-0.5 rounded-md font-bold">
                              <Crown className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {decoration.is_animated && !decoration.is_premium && (
                            <span className="absolute top-1 left-1 text-[10px] bg-primary/80 text-primary-foreground px-1.5 py-0.5 rounded-md font-medium">GIF</span>
                          )}
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="backgrounds" className="mt-0 pb-2">
                {loading ? <SkeletonGrid /> : backgrounds.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum fundo disponível</p>
                ) : (
                  <>
                    {/* Orientation toggle */}
                    <div className="flex items-center gap-2 mb-3 p-1 bg-muted rounded-xl w-fit">
                      <button
                        type="button"
                        onClick={() => setBgFilter('horizontal')}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          bgFilter === 'horizontal'
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Monitor className="w-3.5 h-3.5" /> Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setBgFilter('vertical')}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          bgFilter === 'vertical'
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Smartphone className="w-3.5 h-3.5" /> Mobile
                      </button>
                    </div>

                    {filteredBackgrounds.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        Nenhum fundo {bgFilter === 'vertical' ? 'vertical (mobile)' : 'horizontal (desktop)'} disponível
                      </p>
                    ) : (
                      <div className={cn(
                        "grid gap-3",
                        bgFilter === 'vertical' ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"
                      )}>
                        <button
                          type="button"
                          onClick={() => handleSelectBackground(null)}
                          className={cn(
                            "relative rounded-xl border-2 transition-all flex items-center justify-center bg-secondary/50",
                            bgFilter === 'vertical' ? "aspect-[9/16]" : "aspect-[16/9]",
                            !selectedBackgroundUrl ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground"
                          )}
                        >
                          <span className="text-sm text-muted-foreground">Padrão</span>
                          {!selectedBackgroundUrl && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                        {filteredBackgrounds.map((bg) => {
                          const isSelected = selectedBackgroundUrl === bg.url;
                          const locked = bg.is_premium && !isSubscribed;
                          return (
                            <button
                              key={bg.id}
                              type="button"
                              onClick={() => handleSelectBackground(bg.url, bg.is_premium)}
                              className={cn(
                                "relative rounded-xl border-2 overflow-hidden transition-all group",
                                bgFilter === 'vertical' ? "aspect-[9/16]" : "aspect-[16/9]",
                                locked && "opacity-60",
                                isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground"
                              )}
                            >
                              <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                              {locked && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <Lock className="w-5 h-5 text-yellow-400" />
                                    <span className="text-[10px] text-yellow-400 font-bold">VIP</span>
                                  </div>
                                </div>
                              )}
                              {bg.is_premium && (
                                <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 text-[10px] bg-yellow-500/90 text-black px-1.5 py-0.5 rounded-md font-bold">
                                  <Crown className="w-3 h-3" /> VIP
                                </span>
                              )}
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                                </div>
                              )}
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                <span className="text-xs text-white font-medium">{bg.name}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">Cancelar</Button>
            <Button onClick={onClose} className="min-w-[100px]">Confirmar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BannerDecorationSelector;
