import React, { useState, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, Home, Film, Tv, Search, User, Settings, Gamepad2, History, Radio, Baby, Heart, Calendar as CalendarIcon } from 'lucide-react';
import flixhubLogo from '@/assets/flixhub-logo.png';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import ProfileAvatar from '@/components/ProfileAvatar';
import NotificationDropdown from '@/components/NotificationDropdown';
import { useToast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const Header: React.FC = memo(() => {
  const { user, signOut } = useAuth();
  const { currentProfile } = useProfiles();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { href: '/home', icon: Home, label: 'Início' },
    { href: '/movies', icon: Film, label: 'Filmes' },
    { href: '/tvshows', icon: Tv, label: 'Séries' },
    { href: '/anime', icon: Gamepad2, label: 'Animes' },
    { href: '/kids', icon: Baby, label: 'Infantil' },
    { href: '/doramas', icon: Heart, label: 'Doramas' },
    { href: '/livetv', icon: Radio, label: 'TV ao Vivo' },
    { href: '/calendar', icon: CalendarIcon, label: 'Calendário' },
    { href: '/search', icon: Search, label: 'Buscar' },
  ];

  const userMenuItems = user ? [
    { href: '/profile', icon: User, label: 'Meu Perfil' },
    { href: '/history', icon: History, label: 'Histórico' },
    { href: '/profiles', icon: Settings, label: 'Gerenciar Perfis' },
    { href: '/themes', icon: Settings, label: 'Temas' },
  ] : [];

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer logout. Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [signOut, navigate, toast]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <header className="bg-superflix-dark/95 backdrop-blur-sm border-b border-superflix-primary/20 sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img src={flixhubLogo} alt="FlixHub" className="h-10 sm:h-14 object-contain group-hover:scale-105 transition-transform" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center space-x-2 text-gray-300 hover:text-superflix-primary transition-colors duration-200 group"
              >
                <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications - Only for logged users */}
            {user && (
              <NotificationDropdown />
            )}

            {/* User Profile or Auth */}
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Profile name - hidden on mobile */}
                {currentProfile && (
                  <span className="hidden lg:block text-sm text-gray-300 max-w-[120px] truncate">
                    Olá, {currentProfile.name}
                  </span>
                )}
                
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <Link to="/profiles">
                    <ProfileAvatar 
                      avatarUrl={currentProfile?.avatar_url}
                      name={currentProfile?.name || 'User'}
                      size="sm" 
                      className="hover:ring-2 hover:ring-primary rounded-full transition-all"
                    />
                  </Link>
                  
                  {/* Logout button - hidden on mobile */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="hidden sm:flex text-gray-300 hover:text-red-400 transition-colors p-2"
                    aria-label="Sair"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="text-gray-300 hover:text-superflix-primary transition-colors text-sm px-2 sm:px-3"
                >
                  Entrar
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="bg-superflix-primary hover:bg-superflix-primary/90 text-white text-sm px-2 sm:px-3"
                >
                  Cadastrar
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden text-gray-300 hover:text-superflix-primary p-2"
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[300px] bg-superflix-darker border-superflix-primary/20 p-0">
                <SheetHeader className="p-4 pb-2 border-b border-gray-800">
                  <SheetTitle className="text-superflix-primary flex items-center">
                    <img src={flixhubLogo} alt="FlixHub" className="h-10 object-contain" />
                  </SheetTitle>
                  <SheetDescription className="text-gray-400 text-sm">
                    Menu de navegação
                  </SheetDescription>
                </SheetHeader>
                
                <div className="p-4 space-y-1">
                  {/* Navigation Links */}
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={closeMenu}
                      className="flex items-center space-x-3 text-gray-300 hover:text-superflix-primary transition-colors duration-200 p-3 rounded-lg hover:bg-superflix-primary/10"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}

                  {/* User Menu */}
                  {user && (
                    <>
                      <div className="border-t border-gray-800 my-4 pt-4">
                        <div className="flex items-center space-x-3 mb-4 px-3">
                          <ProfileAvatar 
                            avatarUrl={currentProfile?.avatar_url}
                            name={currentProfile?.name || 'User'}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium truncate">{currentProfile?.name}</p>
                            <p className="text-gray-400 text-xs truncate">{user.email}</p>
                          </div>
                        </div>
                        
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={closeMenu}
                            className="flex items-center space-x-3 text-gray-300 hover:text-superflix-primary transition-colors duration-200 p-3 rounded-lg hover:bg-superflix-primary/10"
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                        
                        <Button
                          variant="ghost"
                          onClick={() => {
                            handleLogout();
                            closeMenu();
                          }}
                          className="w-full justify-start text-gray-300 hover:text-red-400 transition-colors p-3 mt-2"
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Sair da conta
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
