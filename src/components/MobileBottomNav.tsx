import React, { memo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Film, User, Menu, Tv, Gamepad2, Radio, History, Settings, LogIn, Baby, Heart, Crown, Library, Search, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import ProfileAvatar from '@/components/ProfileAvatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const moreItems = [
  { href: '/search', icon: Search, label: 'Buscar' },
  { href: '/calendar', icon: CalendarIcon, label: 'Calendário' },
  { href: '/anime', icon: Gamepad2, label: 'Animes' },
  { href: '/kids', icon: Baby, label: 'Infantil' },
  { href: '/marathons', icon: Library, label: 'Coleções' },
  { href: '/livetv', icon: Radio, label: 'TV ao Vivo' },
  { href: '/premium', icon: Crown, label: 'Premium' },
];

const MobileBottomNav: React.FC = memo(() => {
  const location = useLocation();
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const [open, setOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  // Build main tabs dynamically based on auth state
  const mainTabs = [
    { href: '/home', icon: Home, label: 'Início' },
    { href: '/movies', icon: Film, label: 'Filmes' },
    { href: '/tvshows', icon: Tv, label: 'Séries' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {mainTabs.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-medium transition-colors",
              isActive(item.href) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Profile / Login button */}
        {user ? (
          <Link
            to="/profile"
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-medium transition-colors",
              isActive('/profile') ? "text-primary" : "text-muted-foreground"
            )}
          >
            <ProfileAvatar avatarUrl={currentProfile?.avatar_url} name={currentProfile?.name || 'User'} size="xs" />
            <span>Perfil</span>
          </Link>
        ) : (
          <Link
            to="/auth"
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-medium text-muted-foreground"
          >
            <LogIn className="h-5 w-5" />
            <span>Entrar</span>
          </Link>
        )}

        {/* More button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-medium text-muted-foreground">
              <Menu className="h-5 w-5" />
              <span>Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-card border-t border-border rounded-t-2xl pb-8">
            <SheetHeader>
              <SheetTitle className="text-foreground">Menu</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl transition-colors",
                    isActive(item.href) ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';

export default MobileBottomNav;
