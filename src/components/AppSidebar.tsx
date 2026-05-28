import React, { memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Film, Tv, Gamepad2, Radio, User, LogOut, Shield, Baby, Crown, Library, Calendar } from 'lucide-react';
import flixhubLogo from '@/assets/flixhub-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import ProfileAvatar from '@/components/ProfileAvatar';
import NotificationDropdown from '@/components/NotificationDropdown';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ADMIN_EMAILS = ['alezin1299@gmail.com', 'alezin1788@gmail.com'];

const navItems = [
  { href: '/home', icon: Home, label: 'Início' },
  { href: '/movies', icon: Film, label: 'Filmes' },
  { href: '/tvshows', icon: Tv, label: 'Séries' },
  { href: '/anime', icon: Gamepad2, label: 'Animes' },
  { href: '/kids', icon: Baby, label: 'Infantil' },
  { href: '/marathons', icon: Library, label: 'Coleções' },
  { href: '/calendar', icon: Calendar, label: 'Calendário' },
  { href: '/livetv', icon: Radio, label: 'TV ao Vivo' },
];

const userItems: { href: string; icon: React.ComponentType<any>; label: string }[] = [];

const SidebarLink = ({ href, icon: Icon, label, isActive }: { href: string; icon: React.ComponentType<any>; label: string; isActive: boolean }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link
        to={href}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
          isActive
            ? "bg-primary/15 text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
        )}
      >
        <Icon className="h-5 w-5" />
      </Link>
    </TooltipTrigger>
    <TooltipContent side="right" sideOffset={8}>
      {label}
    </TooltipContent>
  </Tooltip>
);

const AppSidebar: React.FC = memo(() => {
  const { user, signOut } = useAuth();
  const { currentProfile } = useProfiles();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
      toast({ title: 'Logout realizado', description: 'Você foi desconectado.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao fazer logout.', variant: 'destructive' });
    }
  };

  return (
    <aside className="hidden md:flex flex-col items-center fixed left-0 top-0 h-screen z-50 w-16 bg-card/90 backdrop-blur-xl border-r border-border/50 transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 w-full border-b border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/" className="flex items-center justify-center">
              <img src={flixhubLogo} alt="FlixHub" className="h-12 w-auto object-contain" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>FlixHub</TooltipContent>
        </Tooltip>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-3 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarLink key={item.href} {...item} isActive={isActive(item.href)} />
        ))}

         {isAdmin && (
          <>
            <div className="w-6 h-px bg-border/50 my-1" />
            <SidebarLink href="/admin" icon={Shield} label="Admin" isActive={isActive('/admin')} />
          </>
        )}

        <div className="w-6 h-px bg-border/50 my-1" />
        <SidebarLink href="/premium" icon={Crown} label="Premium" isActive={isActive('/premium')} />
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-1 py-3 border-t border-border/50">
        {user && (
          <>
            <NotificationDropdown />

            {userItems.map((item) => (
              <SidebarLink key={item.href} {...item} isActive={isActive(item.href)} />
            ))}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Sair</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/profile" className="mt-1">
                  <ProfileAvatar avatarUrl={currentProfile?.avatar_url} name={currentProfile?.name || 'User'} size="sm" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>{currentProfile?.name || 'Perfil'}</TooltipContent>
            </Tooltip>
          </>
        )}

        {!user && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/auth"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <User className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>Entrar / Cadastrar</TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );
});

AppSidebar.displayName = 'AppSidebar';

export default AppSidebar;
