import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Users, Film, Trash2, Popcorn, DoorOpen, Coins, Store, Search, Lock, Eye, Flame, Clock, Trophy, Filter, Share2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { coinService, ROOM_COST, DAILY_ROOM_LIMIT } from '@/services/coinService';

interface CinemaRoom {
  id: string;
  name: string;
  total_seats: number;
  created_by: string;
  content_title: string | null;
  content_poster: string | null;
  content_id: string | null;
  content_type: string | null;
  status: string;
  created_at: string;
  member_count?: number;
  is_private?: boolean;
  is_paid?: boolean;
  entry_cost?: number;
}

interface MovieOption {
  id: string;
  title: string;
  poster_path: string | null;
  content_type?: string;
}

type FilterType = 'all' | 'public' | 'private' | 'paid' | 'free' | 'available' | 'full';

const FlixCinema: React.FC = () => {
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<CinemaRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [dailyRoomCount, setDailyRoomCount] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSeats, setNewSeats] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [entryCost, setEntryCost] = useState(5);
  const [movieSearch, setMovieSearch] = useState('');
  const [movieResults, setMovieResults] = useState<MovieOption[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieOption | null>(null);
  const [searchingMovies, setSearchingMovies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [passwordDialogRoom, setPasswordDialogRoom] = useState<CinemaRoom | null>(null);
  const [enteredPassword, setEnteredPassword] = useState('');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchRooms();
    loadBalance();

    const channel = supabase
      .channel('cinema-rooms-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cinema_rooms' }, () => fetchRooms())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadBalance = async () => {
    if (!user) return;
    const [bal, count] = await Promise.all([
      coinService.getBalance(user.id),
      coinService.getDailyRoomCount(user.id),
    ]);
    setBalance(bal);
    setDailyRoomCount(count);
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('cinema_rooms' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const roomsWithCounts = await Promise.all(
        (data as any[]).map(async (room: any) => {
          const { count } = await supabase
            .from('cinema_room_members' as any)
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);
          return { ...room, member_count: count || 0 };
        })
      );
      setRooms(roomsWithCounts);
    }
    setLoading(false);
  };

  const filteredRooms = useMemo(() => {
    let result = rooms;
    if (searchQuery) {
      result = result.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content_title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    switch (activeFilter) {
      case 'public': result = result.filter(r => !r.is_private); break;
      case 'private': result = result.filter(r => r.is_private); break;
      case 'paid': result = result.filter(r => r.is_paid); break;
      case 'free': result = result.filter(r => !r.is_paid); break;
      case 'available': result = result.filter(r => (r.member_count || 0) < r.total_seats); break;
      case 'full': result = result.filter(r => (r.member_count || 0) >= r.total_seats); break;
    }
    return result;
  }, [rooms, searchQuery, activeFilter]);

  const trendingRooms = useMemo(() =>
    [...rooms].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 6),
    [rooms]
  );

  const recentRooms = useMemo(() => rooms.slice(0, 10), [rooms]);

  const searchMovies = async (query: string) => {
    setMovieSearch(query);
    if (query.length < 2) { setMovieResults([]); return; }
    setSearchingMovies(true);
    const [moviesRes, seriesRes] = await Promise.all([
      supabase.from('movies_catalog').select('id, title, poster_path').ilike('title', `%${query}%`).limit(10),
      supabase.from('series_catalog').select('id, title, poster_path').ilike('title', `%${query}%`).limit(10),
    ]);
    setMovieResults([
      ...(moviesRes.data || []).map(m => ({ ...m, content_type: 'movie' })),
      ...(seriesRes.data || []).map(s => ({ ...s, content_type: 'series' })),
    ]);
    setSearchingMovies(false);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !selectedMovie || !user) return;

    const canCreate = await coinService.incrementDailyRoomCount(user.id);
    if (!canCreate) {
      toast({ title: 'Limite diário atingido', description: `Máximo de ${DAILY_ROOM_LIMIT} salas por dia`, variant: 'destructive' });
      return;
    }

    const success = await coinService.spendCoins(user.id, ROOM_COST, `Criar sala: ${newName}`);
    if (!success) {
      toast({ title: 'Moedas insuficientes', description: `Você precisa de ${ROOM_COST} moedas`, variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('cinema_rooms' as any)
      .insert({
        name: newName.trim(),
        total_seats: newSeats,
        created_by: user.id,
        content_id: selectedMovie.id,
        content_type: selectedMovie.content_type,
        content_title: selectedMovie.title,
        content_poster: selectedMovie.poster_path,
        status: 'waiting',
        is_private: isPrivate,
        room_password: isPrivate ? roomPassword : null,
        is_paid: isPaid,
        entry_cost: isPaid ? entryCost : 0,
      } as any);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar a sala', variant: 'destructive' });
      await coinService.addCoins(user.id, ROOM_COST, 'refund', 'Reembolso: erro ao criar sala');
    } else {
      toast({ title: '🎬 Sala criada!', description: `"${newName}" está pronta` });
      setNewName(''); setNewSeats(10); setSelectedMovie(null); setMovieSearch('');
      setIsPrivate(false); setRoomPassword(''); setIsPaid(false); setEntryCost(5);
      setCreateOpen(false);
      loadBalance();
      fetchRooms();
    }
  };

  const handleEnterRoom = async (room: CinemaRoom) => {
    if (room.is_private && room.created_by !== user?.id) {
      setPasswordDialogRoom(room);
      return;
    }
    if (room.is_paid && room.created_by !== user?.id) {
      const cost = room.entry_cost || 0;
      if (cost > 0) {
        const success = await coinService.spendCoins(user!.id, cost, `Entrada na sala: ${room.name}`);
        if (!success) {
          toast({ title: 'Moedas insuficientes', description: `Entrada custa ${cost} moedas`, variant: 'destructive' });
          return;
        }
        // Give coins to room creator
        await coinService.addCoins(room.created_by, cost, 'room_entry', `Entrada na sala: ${room.name}`);
      }
    }
    navigate(`/cinema/${room.id}`);
  };

  const handlePasswordSubmit = async () => {
    if (!passwordDialogRoom) return;
    // Check password by querying room
    const { data } = await supabase
      .from('cinema_rooms' as any)
      .select('room_password')
      .eq('id', passwordDialogRoom.id)
      .single();
    if ((data as any)?.room_password === enteredPassword) {
      setPasswordDialogRoom(null);
      setEnteredPassword('');
      if (passwordDialogRoom.is_paid && passwordDialogRoom.created_by !== user?.id) {
        const cost = passwordDialogRoom.entry_cost || 0;
        if (cost > 0) {
          const success = await coinService.spendCoins(user!.id, cost, `Entrada na sala: ${passwordDialogRoom.name}`);
          if (!success) {
            toast({ title: 'Moedas insuficientes', variant: 'destructive' });
            return;
          }
          await coinService.addCoins(passwordDialogRoom.created_by, cost, 'room_entry', `Entrada: ${passwordDialogRoom.name}`);
        }
      }
      navigate(`/cinema/${passwordDialogRoom.id}`);
    } else {
      toast({ title: 'Senha incorreta', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('cinema_rooms' as any).delete().eq('id', id);
    fetchRooms();
  };

  const shareRoom = (room: CinemaRoom) => {
    const url = `${window.location.origin}/cinema/${room.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!', description: 'Compartilhe com seus amigos' });
  };

  const filters: { key: FilterType; label: string; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'public', label: 'Públicas', icon: <Eye className="h-3 w-3" /> },
    { key: 'private', label: 'Privadas', icon: <Lock className="h-3 w-3" /> },
    { key: 'paid', label: 'Pagas', icon: <Coins className="h-3 w-3" /> },
    { key: 'free', label: 'Gratuitas' },
    { key: 'available', label: 'Com vaga' },
    { key: 'full', label: 'Cheias' },
  ];

  const RoomCard = ({ room, compact = false }: { room: CinemaRoom; compact?: boolean }) => (
    <Card className={`bg-card/60 backdrop-blur-sm border-border/50 overflow-hidden hover:border-primary/40 transition-all duration-300 group ${compact ? 'flex' : ''}`}>
      <div className={`${compact ? 'w-24 h-20 shrink-0' : 'h-36'} bg-gradient-to-br from-secondary to-background flex items-center justify-center relative overflow-hidden`}>
        {room.content_poster ? (
          <img
            src={room.content_poster.startsWith('http') ? room.content_poster : `https://image.tmdb.org/t/p/w300${room.content_poster}`}
            alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Film className="h-10 w-10 text-muted-foreground" />
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {room.is_private && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-background/80"><Lock className="h-2.5 w-2.5" /></Badge>}
          {room.is_paid && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary"><Coins className="h-2.5 w-2.5 mr-0.5" />{room.entry_cost}</Badge>}
        </div>
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            room.status === 'playing' ? 'bg-green-500/90 text-white' :
            room.status === 'ended' ? 'bg-muted text-muted-foreground' :
            'bg-primary/90 text-primary-foreground'
          }`}>
            {room.status === 'playing' ? '● AO VIVO' : room.status === 'ended' ? 'Encerrada' : 'Aguardando'}
          </span>
        </div>
      </div>

      <div className={`p-3 ${compact ? 'flex-1 flex flex-col justify-center' : ''}`}>
        <h3 className="font-semibold text-foreground text-sm truncate">{room.name}</h3>
        {room.content_title && (
          <p className="text-xs text-primary truncate mt-0.5">🎬 {room.content_title}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> {room.member_count}/{room.total_seats}
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => shareRoom(room)}>
              <Share2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1 text-xs bg-primary hover:bg-primary/90"
              onClick={() => handleEnterRoom(room)}
            >
              <DoorOpen className="h-3 w-3" /> Entrar
            </Button>
            {room.created_by === user?.id && (
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(room.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Popcorn className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">FlixCinema</h1>
              <p className="text-xs text-muted-foreground">Assista junto com amigos em tempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/cinema/missions')}
              className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-3 py-1.5 hover:bg-primary/20 transition-colors"
            >
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary text-xs hidden sm:inline">Missões</span>
            </button>

            <button
              onClick={() => navigate('/cinema/shop')}
              className="flex items-center gap-1.5 bg-yellow-600/20 border border-yellow-600/40 rounded-full px-3 py-1.5 hover:bg-yellow-600/30 transition-colors"
            >
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-bold text-yellow-500 text-sm">{balance}</span>
            </button>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5 text-sm" disabled={balance < ROOM_COST}>
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova Sala</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground flex items-center gap-2">
                    <Popcorn className="h-5 w-5 text-primary" /> Criar Sala de Cinema
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  {/* Room cost info */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="text-foreground">Custo fixo: <strong>{ROOM_COST} moedas</strong></span>
                    </div>
                    <span className="text-xs text-muted-foreground">{dailyRoomCount}/{DAILY_ROOM_LIMIT} hoje</span>
                  </div>

                  {dailyRoomCount >= DAILY_ROOM_LIMIT && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                      ⚠️ Limite diário atingido. Tente novamente amanhã.
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Nome da sala</label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Sessão Marvel" className="bg-secondary border-border" maxLength={50} />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Assentos ({newSeats})</label>
                    <Input type="number" value={newSeats} onChange={(e) => setNewSeats(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))} min={2} max={50} className="bg-secondary border-border" />
                  </div>

                  {/* Private toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground font-medium">Sala Privada</p>
                        <p className="text-xs text-muted-foreground">Exige senha para entrar</p>
                      </div>
                    </div>
                    <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                  </div>
                  {isPrivate && (
                    <Input value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} placeholder="Definir senha" className="bg-secondary border-border" maxLength={20} />
                  )}

                  {/* Paid toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="text-sm text-foreground font-medium">Sala Paga</p>
                        <p className="text-xs text-muted-foreground">Cobrar entrada dos usuários</p>
                      </div>
                    </div>
                    <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                  </div>
                  {isPaid && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Valor de entrada (moedas)</label>
                      <Input type="number" value={entryCost} onChange={(e) => setEntryCost(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))} min={1} max={100} className="bg-secondary border-border" />
                    </div>
                  )}

                  {/* Movie Selection */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Selecionar Filme/Série *</label>
                    {selectedMovie ? (
                      <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-primary/30">
                        {selectedMovie.poster_path && (
                          <img src={selectedMovie.poster_path.startsWith('http') ? selectedMovie.poster_path : `https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`} alt="" className="w-10 h-14 rounded object-cover" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{selectedMovie.title}</p>
                          <p className="text-xs text-muted-foreground">{selectedMovie.content_type === 'movie' ? 'Filme' : 'Série'}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedMovie(null)}>✕</Button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input value={movieSearch} onChange={(e) => searchMovies(e.target.value)} placeholder="Buscar filme ou série..." className="pl-10 bg-secondary border-border" />
                        </div>
                        <div className="max-h-[180px] overflow-y-auto space-y-1 mt-2">
                          {searchingMovies && <p className="text-center text-muted-foreground text-sm py-2">Buscando...</p>}
                          {movieResults.map((item) => (
                            <button key={item.id} onClick={() => { setSelectedMovie(item); setMovieSearch(''); setMovieResults([]); }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors text-left">
                              {item.poster_path ? (
                                <img src={item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w92${item.poster_path}`} alt="" className="w-8 h-12 rounded object-cover" />
                              ) : (
                                <div className="w-8 h-12 rounded bg-secondary flex items-center justify-center"><Film className="h-3 w-3 text-muted-foreground" /></div>
                              )}
                              <div>
                                <p className="text-foreground text-sm">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.content_type === 'movie' ? 'Filme' : 'Série'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <Button onClick={handleCreate} className="w-full" disabled={!newName.trim() || !selectedMovie || dailyRoomCount >= DAILY_ROOM_LIMIT}>
                    Criar Sala ({ROOM_COST} moedas)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar salas..." className="pl-10 bg-secondary/50 border-border/50" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeFilter === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {f.icon}{f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Trending Rooms */}
            {trendingRooms.length > 0 && !searchQuery && activeFilter === 'all' && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" /> Salas em Alta
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {trendingRooms.map((room, i) => (
                    <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <RoomCard room={room} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent / Filtered */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                {searchQuery || activeFilter !== 'all' ? (
                  <><Filter className="h-5 w-5 text-primary" /> Resultados ({filteredRooms.length})</>
                ) : (
                  <><Clock className="h-5 w-5 text-primary" /> Salas Recentes</>
                )}
              </h2>
              {(searchQuery || activeFilter !== 'all' ? filteredRooms : recentRooms).length === 0 ? (
                <div className="text-center py-16">
                  <Popcorn className="h-14 w-14 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma sala encontrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(searchQuery || activeFilter !== 'all' ? filteredRooms : recentRooms).map((room, i) => (
                    <motion.div key={room.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                      <RoomCard room={room} compact />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Password Dialog */}
      <Dialog open={!!passwordDialogRoom} onOpenChange={() => { setPasswordDialogRoom(null); setEnteredPassword(''); }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Sala Privada</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Digite a senha para entrar em "{passwordDialogRoom?.name}"</p>
          <Input value={enteredPassword} onChange={(e) => setEnteredPassword(e.target.value)} placeholder="Senha" type="password" className="bg-secondary border-border" onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} />
          <Button onClick={handlePasswordSubmit} className="w-full">Entrar</Button>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default FlixCinema;
