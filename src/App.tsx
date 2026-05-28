import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import SplashScreen from "@/components/SplashScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfilesPage = lazy(() => import("./pages/ProfilesPage"));
const ProfileManagement = lazy(() => import("./pages/ProfileManagement"));
const Home = lazy(() => import("./pages/Home"));

// Preload critical pages
const preloadProfilesPage = () => import("./pages/ProfilesPage");
const preloadHome = () => import("./pages/Home");
const MoviesList = lazy(() => import("./pages/MoviesList"));
const TVShowsList = lazy(() => import("./pages/TVShowsList"));
const AnimeList = lazy(() => import("./pages/AnimeList"));
const KidsList = lazy(() => import("./pages/KidsList"));
const Details = lazy(() => import("./pages/Details"));
const Player = lazy(() => import("./pages/Player"));
const LiveTVPage = lazy(() => import("./pages/LiveTVPage"));
const LiveTVPlayer = lazy(() => import("./pages/LiveTVPlayer"));

const Search = lazy(() => import("./pages/Search"));
const Marathons = lazy(() => import("./pages/Marathons"));
const MarathonDetails = lazy(() => import("./pages/MarathonDetails"));
const Plans = lazy(() => import("./pages/Plans"));
const Sobre = lazy(() => import("./pages/Sobre"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const Themes = lazy(() => import("./pages/Themes"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const ImportMovies = lazy(() => import("./pages/ImportMovies"));
const AdminMovies = lazy(() => import("./pages/AdminMovies"));
const AdminAddMovie = lazy(() => import("./pages/AdminAddMovie"));
const AdminEditMovie = lazy(() => import("./pages/AdminEditMovie"));
const AdminSlider = lazy(() => import("./pages/AdminSlider"));
const AdminSeries = lazy(() => import("./pages/AdminSeries"));
const AdminAddSeries = lazy(() => import("./pages/AdminAddSeries"));
const AdminEditSeries = lazy(() => import("./pages/AdminEditSeries"));
const AdminAnimes = lazy(() => import("./pages/AdminAnimes"));
const AdminAddAnime = lazy(() => import("./pages/AdminAddAnime"));
const SeriesPlayer = lazy(() => import("./pages/SeriesPlayer"));
const PremiumPage = lazy(() => import("./pages/PremiumPage"));
const AdminPremiumKeys = lazy(() => import("./pages/AdminPremiumKeys"));
const AdminAvatars = lazy(() => import("./pages/AdminAvatars"));
const FlixCinema = lazy(() => import("./pages/FlixCinema"));
const CinemaRoom = lazy(() => import("./pages/CinemaRoom"));
const CoinShop = lazy(() => import("./pages/CoinShop"));
const CinemaMissions = lazy(() => import("./pages/CinemaMissions"));
const AdminStreams = lazy(() => import("./pages/AdminStreams"));
const AdminStreamStatus = lazy(() => import("./pages/AdminStreamStatus"));
const AdminLiveTV = lazy(() => import("./pages/AdminLiveTV"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminMarathons = lazy(() => import("./pages/AdminMarathons"));
const AdminCustomization = lazy(() => import("./pages/AdminCustomization"));
const DownloadPage = lazy(() => import("./pages/DownloadPage"));
const AdminAppReleases = lazy(() => import("./pages/AdminAppReleases"));
const AdminAppConfig = lazy(() => import("./pages/AdminAppConfig"));
const TMDBEnrich = lazy(() => import("./pages/TMDBEnrich"));
const AdminCalendar = lazy(() => import("./pages/AdminCalendar"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Só mostrar splash na primeira visita da sessão
    if (sessionStorage.getItem('splashShown')) return false;
    return true;
  });

  // Service Worker Registration and Push Notifications Setup
  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available');
                }
              });
            }
          });

          // Auto-request notification permission for PWA users
          const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true || 
                       document.referrer.includes('android-app://');
          
          if (isPWA) {
            // Check if notification permission is not already granted
            if (Notification.permission === 'default') {
              setTimeout(() => {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    console.log('Notification permission granted for PWA user');
                    
                    // Show welcome notification
                    registration.showNotification('FlixHub', {
                      body: 'Bem-vindo! Você receberá notificações sobre novos conteúdos.',
                      icon: '/pwa-192x192.png',
                      badge: '/pwa-192x192.png',
                      tag: 'welcome-notification',
                      requireInteraction: false,
                      data: { url: '/' }
                    });
                  }
                });
              }, 2000); // Wait 2 seconds before asking
            }
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
      });
    }

    // Check if app is in focus and handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('FlixHub is visible');
        // App is visible, notifications can be shown
      } else {
        console.log('FlixHub is hidden');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Adicionar suporte para navegação com controle remoto de TV
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detectar se está em uma TV ou usando controle remoto
      const isTV = window.navigator.userAgent.includes('TV') || 
                   window.navigator.userAgent.includes('WebOS') ||
                   window.navigator.userAgent.includes('Tizen') ||
                   window.screen.width >= 1920;

      if (!isTV) return;

      // Navegação com controle remoto
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          // Focar no próximo elemento focável
          const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);
          
          let nextIndex;
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % focusableElements.length;
          } else {
            nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
          }
          
          (focusableElements[nextIndex] as HTMLElement)?.focus();
          event.preventDefault();
          break;
        
        case 'Enter':
          // Enter age como click
          if (document.activeElement) {
            (document.activeElement as HTMLElement).click();
          }
          break;
        
        case 'Escape':
        case 'Backspace':
          // Voltar na navegação
          window.history.back();
          event.preventDefault();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Adicionar classes CSS para TV
    if (window.navigator.userAgent.includes('TV') || 
        window.navigator.userAgent.includes('WebOS') ||
        window.navigator.userAgent.includes('Tizen') ||
        window.screen.width >= 1920) {
      document.body.classList.add('tv-mode');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <SplashScreen 
        onComplete={handleSplashComplete}
        videoSrc="/splash-video.mp4" // Você pode fazer upload do seu vídeo aqui
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <NotificationsProvider>
            <ThemeProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Suspense fallback={
                    <div className="min-h-screen bg-background flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  }>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/profiles" element={<ProfilesPage />} />
                      <Route path="/profiles/new" element={<ProfileManagement />} />
                      <Route path="/profiles/edit/:id" element={<ProfileManagement />} />
                      <Route path="/home" element={<Home />} />
                      <Route path="/movies" element={<MoviesList />} />
                      <Route path="/tvshows" element={<TVShowsList />} />
                      <Route path="/anime" element={<AnimeList />} />
                      <Route path="/kids" element={<KidsList />} />
                      <Route path="/details/:type/:id" element={<Details />} />
                      <Route path="/livetv" element={<LiveTVPage />} />
                      <Route path="/livetv/player/:channelId" element={<LiveTVPlayer />} />
                      <Route path="/player/movie/:imdbId" element={<Player />} />
                      
                      <Route path="/search" element={<Search />} />
                      <Route path="/marathons" element={<Marathons />} />
                      <Route path="/marathons/:id" element={<MarathonDetails />} />
                      <Route path="/plans" element={<Plans />} />
                      <Route path="/sobre" element={<Sobre />} />
                      <Route path="/themes" element={<Themes />} />
                      
                      <Route path="/history" element={<HistoryPage />} />
                      <Route path="/favorites" element={<FavoritesPage />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/import" element={<ImportMovies />} />
                      <Route path="/admin/movies" element={<AdminMovies />} />
                      <Route path="/admin/add-movie" element={<AdminAddMovie />} />
                      <Route path="/admin/edit-movie/:id" element={<AdminEditMovie />} />
                      <Route path="/admin/slider" element={<AdminSlider />} />
                      <Route path="/admin/series" element={<AdminSeries />} />
                      <Route path="/admin/add-series" element={<AdminAddSeries />} />
                      <Route path="/admin/edit-series/:id" element={<AdminEditSeries />} />
                      <Route path="/admin/animes" element={<AdminAnimes />} />
                      <Route path="/admin/add-anime" element={<AdminAddAnime />} />
                      <Route path="/player/series/:seriesId/:episodeId?" element={<SeriesPlayer />} />
                      <Route path="/premium" element={<PremiumPage />} />
                      <Route path="/admin/premium-keys" element={<AdminPremiumKeys />} />
                       <Route path="/admin/avatars" element={<AdminAvatars />} />
                       <Route path="/admin/streams" element={<AdminStreams />} />
                       <Route path="/admin/stream-status" element={<AdminStreamStatus />} />
                       <Route path="/admin/livetv" element={<AdminLiveTV />} />
                       <Route path="/admin/reports" element={<AdminReports />} />
                       <Route path="/admin/marathons" element={<AdminMarathons />} />
                       <Route path="/admin/customization" element={<AdminCustomization />} />
                      <Route path="/admin/app-releases" element={<AdminAppReleases />} />
                      <Route path="/admin/app-config" element={<AdminAppConfig />} />
                      <Route path="/admin/tmdb-enrich" element={<TMDBEnrich />} />
                      <Route path="/admin/calendar" element={<AdminCalendar />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                       <Route path="/download" element={<DownloadPage />} />
                      <Route path="/cinema" element={<FlixCinema />} />
                      <Route path="/cinema/shop" element={<CoinShop />} />
                      <Route path="/cinema/missions" element={<CinemaMissions />} />
                      <Route path="/cinema/:roomId" element={<CinemaRoom />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </ThemeProvider>
          </NotificationsProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
