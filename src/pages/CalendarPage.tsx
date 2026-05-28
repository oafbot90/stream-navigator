import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { format, parseISO, isToday, isTomorrow, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Play, Filter, Tv, Bell, BellOff, Sparkles, Film } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { calendarApi, CalendarItem } from '@/services/calendarApi';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useCalendarNotifications } from '@/hooks/useCalendarNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { differenceInCalendarDays, parseISO as parseISO2 } from 'date-fns';

type FilterType = 'all' | 'Hoje' | 'Futuro' | 'Atualizado' | 'Atrasado';

// Memoized Calendar Card component
const CalendarCard = React.memo(({ item, index }: { item: CalendarItem; index: number }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hoje':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Futuro':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Atualizado':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Atrasado':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const isMovie = item.content_type === 'movie';
  const isEvent = item.content_type === 'event';
  const detailType = isMovie ? 'movie' : 'tv';
  const linkTo = isEvent
    ? '#'
    : item.tmdb_id
      ? `/details/${detailType}/${item.tmdb_id}`
      : '#';

  const typeLabel =
    item.content_type === 'movie' ? 'Filme'
    : item.content_type === 'anime' ? 'Anime'
    : item.content_type === 'event' ? 'Evento'
    : 'Série';

  return (
    <Link
      to={linkTo}
      className="group block"
      onClick={(e) => { if (linkTo === '#') e.preventDefault(); }}
    >
      <div className="relative bg-superflix-dark rounded-lg overflow-hidden border border-superflix-dark/50 hover:border-superflix-primary/50 transition-all duration-300">
        {/* Backdrop */}
        <div className="relative h-28 overflow-hidden bg-superflix-darker">
          {item.backdrop_path ? (
            <img
              src={item.backdrop_path}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : item.poster_path ? (
            <img
              src={item.poster_path}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-superflix-darker flex items-center justify-center">
              {isMovie ? <Film className="h-12 w-12 text-superflix-text-muted" /> : <Tv className="h-12 w-12 text-superflix-text-muted" />}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-superflix-dark to-transparent" />

          {/* Type badge */}
          <Badge className="absolute top-2 left-2 border text-[10px] bg-black/60 text-white border-white/10">
            {typeLabel}
          </Badge>

          {/* Status Badge */}
          <Badge
            className={cn(
              "absolute top-2 right-2 border text-xs",
              getStatusColor(item.status)
            )}
          >
            {item.status}
          </Badge>

          {/* Play Button Overlay */}
          {linkTo !== '#' && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-superflix-primary/90 rounded-full p-3">
                <Play className="h-5 w-5 text-white fill-white" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-superflix-primary transition-colors">
            {item.title}
          </h3>
          {!isMovie && !isEvent && (item.season_number > 0 || item.episode_number > 0) && (
            <div className="flex items-center gap-2 mt-1 text-xs text-superflix-text-muted">
              <span className="text-superflix-primary font-medium">
                T{item.season_number}:E{item.episode_number}
              </span>
              {item.episode_title && !item.episode_title.startsWith('Episódio') && (
                <>
                  <span>•</span>
                  <span className="line-clamp-1">{item.episode_title}</span>
                </>
              )}
            </div>
          )}
          {(isMovie || isEvent) && item.episode_title && (
            <div className="mt-1 text-xs text-superflix-text-muted line-clamp-1">
              {item.episode_title}
            </div>
          )}
          <div className="flex items-center gap-1 mt-1.5 text-xs text-superflix-text-muted">
            <Clock className="h-3 w-3" />
            <span>{format(parseISO(item.air_date), "dd/MM/yyyy")}</span>
          </div>
        </div>
      </div>
    </Link>
  );
});

CalendarCard.displayName = 'CalendarCard';

const CalendarPage: React.FC = () => {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: notificationData } = useCalendarNotifications();

  useEffect(() => {
    const fetchCalendar = async () => {
      setIsLoading(true);
      const [apiData, adminRes] = await Promise.all([
        calendarApi.getCalendar(),
        (supabase as any).from('release_calendar').select('*').order('release_date', { ascending: true }),
      ]);
      const adminItems: CalendarItem[] = ((adminRes?.data as any[]) || []).map((e: any) => {
        const diff = differenceInCalendarDays(parseISO2(e.release_date), new Date());
        const status: CalendarItem['status'] = diff === 0 ? 'Hoje' : diff > 0 ? 'Futuro' : 'Atualizado';
        const ct: CalendarItem['content_type'] =
          e.content_type === 'movie' ? 'movie'
          : e.content_type === 'anime' ? 'anime'
          : e.content_type === 'event' ? 'event'
          : 'tv';
        return {
          title: e.title,
          episode_title: e.description || '',
          episode_number: e.episode_number || 0,
          air_date: e.release_date,
          poster_path: e.poster_url || '',
          backdrop_path: e.backdrop_url || '',
          season_number: e.season_number || 0,
          tmdb_id: e.tmdb_id || 0,
          imdb_id: '',
          status,
          content_type: ct,
        };
      });
      setItems([...adminItems, ...apiData]);
      setIsLoading(false);
    };
    fetchCalendar();

    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Memoized calculations
  const uniqueDates = useMemo(() => 
    [...new Set(items.map(item => item.air_date))].sort(),
    [items]
  );

  const filteredItems = useMemo(() => 
    items.filter(item => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (selectedDate && item.air_date !== selectedDate) return false;
      return true;
    }),
    [items, filter, selectedDate]
  );

  const groupedItems = useMemo(() => 
    calendarApi.groupByDate(filteredItems),
    [filteredItems]
  );

  const statusCounts = useMemo(() => {
    const counts = { Hoje: 0, Futuro: 0, Atualizado: 0, Atrasado: 0 };
    items.forEach(item => {
      if (counts[item.status as keyof typeof counts] !== undefined) {
        counts[item.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [items]);

  const formatDateLabel = useCallback((dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return 'Hoje';
      if (isTomorrow(date)) return 'Amanhã';
      return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Não suportado',
        description: 'Seu navegador não suporta notificações push.',
        variant: 'destructive',
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast({
        title: 'Notificações ativadas!',
        description: 'Você receberá alertas sobre novos lançamentos.',
      });
    } else {
      toast({
        title: 'Permissão negada',
        description: 'Você pode ativar notificações nas configurações do navegador.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-superflix-darker">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-superflix-primary/20 to-superflix-darker py-8 md:py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-7 w-7 md:h-8 md:w-8 text-superflix-primary" />
                  <h1 className="text-2xl md:text-4xl font-bold text-white">
                    Calendário de Lançamentos
                  </h1>
                </div>
                <p className="text-superflix-text-muted text-sm md:text-base max-w-2xl">
                  Acompanhe os episódios mais recentes e os próximos lançamentos.
                </p>
              </div>

              {/* Notification Toggle */}
              <Button
                variant={notificationsEnabled ? "outline" : "default"}
                size="sm"
                onClick={handleEnableNotifications}
                className={cn(
                  "gap-2",
                  notificationsEnabled 
                    ? "border-green-500/50 text-green-400" 
                    : "bg-superflix-primary hover:bg-superflix-primary/90"
                )}
              >
                {notificationsEnabled ? (
                  <>
                    <Bell className="h-4 w-4" />
                    Notificações ativas
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4" />
                    Ativar notificações
                  </>
                )}
              </Button>
            </div>

            {/* Favorite Matches Alert */}
            {user && notificationData && notificationData.favorite_matches > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-white font-medium">
                      {notificationData.favorite_matches} série(s) favorita(s) com episódios novos hoje!
                    </p>
                    <p className="text-sm text-yellow-300/70">
                      Confira os lançamentos das suas séries favoritas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-6">
              {[
                { key: 'Hoje', color: 'green', label: 'Lançando Hoje' },
                { key: 'Futuro', color: 'blue', label: 'Próximos' },
                { key: 'Atualizado', color: 'purple', label: 'Atualizados' },
                { key: 'Atrasado', color: 'red', label: 'Atrasados' },
              ].map(({ key, color, label }) => (
                <div 
                  key={key}
                  className={cn(
                    "p-3 md:p-4 rounded-lg border cursor-pointer transition-all",
                    filter === key 
                      ? `bg-${color}-500/30 border-${color}-500` 
                      : `bg-${color}-500/10 border-${color}-500/20 hover:border-${color}-500/50`
                  )}
                  onClick={() => setFilter(filter === key ? 'all' : key as FilterType)}
                >
                  <div className={`text-xl md:text-2xl font-bold text-${color}-400`}>
                    {statusCounts[key as keyof typeof statusCounts]}
                  </div>
                  <div className={`text-xs md:text-sm text-${color}-300/70`}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-8">
          {/* Month Calendar View — dates with releases are highlighted */}
          {!isLoading && uniqueDates.length > 0 && (
            <div className="mb-6 bg-superflix-dark/60 border border-superflix-dark rounded-xl p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-superflix-primary" />
                <span className="text-sm text-white font-medium">Navegue por data</span>
                <span className="text-xs text-superflix-text-muted ml-auto hidden md:inline">
                  Dias destacados têm lançamentos
                </span>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <CalendarUI
                  mode="single"
                  selected={selectedDate ? parseISO(selectedDate) : undefined}
                  onSelect={(d) => {
                    if (!d) { setSelectedDate(null); return; }
                    const iso = format(d, 'yyyy-MM-dd');
                    setSelectedDate(selectedDate === iso ? null : iso);
                  }}
                  locale={ptBR}
                  modifiers={{
                    hasRelease: uniqueDates.map((iso) => parseISO(iso)),
                  }}
                  modifiersClassNames={{
                    hasRelease:
                      'relative font-semibold text-superflix-primary after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-superflix-primary',
                  }}
                  className={cn('p-3 pointer-events-auto rounded-lg bg-superflix-darker border border-superflix-dark')}
                />
                <div className="flex-1 w-full">
                  {selectedDate ? (
                    <div className="space-y-2">
                      <div className="text-sm text-superflix-text-muted">Selecionado</div>
                      <div className="text-lg font-semibold text-white capitalize">
                        {formatDateLabel(selectedDate)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-superflix-text-muted">
                        <Film className="h-4 w-4" />
                        {(groupedItems[selectedDate]?.length || 0)} lançamento(s) neste dia
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate(null)}>
                        Limpar seleção
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-superflix-text-muted">
                      Clique em um dia destacado para ver apenas os lançamentos dessa data.
                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-superflix-primary" />
                        <span className="text-xs">Indica dia com lançamento</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Date Filter Pills */}
          {!isLoading && uniqueDates.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-superflix-text-muted" />
                <span className="text-sm text-superflix-text-muted">Filtrar por data:</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  variant={selectedDate === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className={cn(
                    "whitespace-nowrap text-xs md:text-sm",
                    selectedDate === null && "bg-superflix-primary hover:bg-superflix-primary/90"
                  )}
                >
                  Todas
                </Button>
                {uniqueDates.slice(0, 10).map(date => (
                  <Button
                    key={date}
                    variant={selectedDate === date ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                    className={cn(
                      "whitespace-nowrap text-xs md:text-sm",
                      selectedDate === date && "bg-superflix-primary hover:bg-superflix-primary/90"
                    )}
                  >
                    {formatDateLabel(date)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i}>
                  <Skeleton className="h-6 w-40 mb-4 bg-superflix-dark" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(j => (
                      <Skeleton key={j} className="h-44 rounded-lg bg-superflix-dark" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredItems.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-superflix-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Nenhum lançamento encontrado</h3>
              <p className="text-superflix-text-muted">
                {filter !== 'all' 
                  ? 'Tente remover o filtro para ver mais resultados.'
                  : 'Não há lançamentos programados no momento.'}
              </p>
              {filter !== 'all' && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => { setFilter('all'); setSelectedDate(null); }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}

          {/* Calendar Items by Date */}
          {!isLoading && Object.keys(groupedItems).sort().map(date => (
            <div key={date} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  isToday(parseISO(date)) ? "bg-green-500/20" : "bg-superflix-dark"
                )}>
                  <Calendar className={cn(
                    "h-4 w-4 md:h-5 md:w-5",
                    isToday(parseISO(date)) ? "text-green-400" : "text-superflix-text-muted"
                  )} />
                </div>
                <h2 className={cn(
                  "text-lg md:text-xl font-semibold capitalize",
                  isToday(parseISO(date)) ? "text-green-400" : "text-white"
                )}>
                  {formatDateLabel(date)}
                </h2>
                <Badge variant="outline" className="text-superflix-text-muted text-xs">
                  {groupedItems[date].length} {groupedItems[date].every(i => i.content_type === 'movie') ? (groupedItems[date].length === 1 ? 'filme' : 'filmes') : groupedItems[date].every(i => i.content_type === 'event') ? (groupedItems[date].length === 1 ? 'evento' : 'eventos') : groupedItems[date].some(i => i.content_type === 'movie' || i.content_type === 'event') ? (groupedItems[date].length === 1 ? 'lançamento' : 'lançamentos') : (groupedItems[date].length === 1 ? 'ep.' : 'eps.')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedItems[date].map((item, index) => (
                  <CalendarCard 
                    key={`${item.tmdb_id}-${item.season_number}-${item.episode_number}-${index}`}
                    item={item}
                    index={index}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CalendarPage;
