import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Users, Play, Pause, Popcorn, MessageCircle, X, VolumeX, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from '@/components/VideoPlayer';

interface ChatMessage {
  id: string;
  profile_name: string;
  avatar_url: string | null;
  message: string;
  created_at: string;
  user_id: string;
}

interface RoomMember {
  id: string;
  user_id: string;
  profile_name: string;
  avatar_url: string | null;
}

const CinemaRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [syncDelay, setSyncDelay] = useState<number | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const isCreator = room?.created_by === user?.id;
  const mutedUsers: string[] = room?.muted_users || [];

  const [isPlaying, setIsPlaying] = useState(false);
  const ignoreNextSync = useRef(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadRoom();
    joinRoom();

    const chatChannel = supabase
      .channel(`cinema-chat-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cinema_chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    const membersChannel = supabase
      .channel(`cinema-members-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cinema_room_members', filter: `room_id=eq.${roomId}` }, () => loadMembers())
      .subscribe();

    const roomChannel = supabase
      .channel(`cinema-room-${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cinema_rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const newRoom = payload.new;
        setRoom(newRoom);
        if (!ignoreNextSync.current) {
          setIsPlaying(newRoom.is_playing);
          // Calculate sync delay
          if (newRoom.synced_at) {
            const delay = (Date.now() - new Date(newRoom.synced_at).getTime()) / 1000;
            setSyncDelay(delay > 1 ? Math.round(delay) : null);
          }
        }
        ignoreNextSync.current = false;
      })
      .subscribe();

    // Typing presence channel
    const presenceChannel = supabase
      .channel(`cinema-typing-${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typing = Object.values(state).flat().filter((s: any) => s.typing && s.user_id !== user?.id).map((s: any) => s.name);
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(presenceChannel);
      leaveRoom();
    };
  }, [roomId, user]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const loadRoom = async () => {
    const { data } = await supabase.from('cinema_rooms' as any).select('*').eq('id', roomId!).single();
    if (data) {
      setRoom(data);
      setIsPlaying((data as any).is_playing || false);
      if ((data as any).content_id && (data as any).content_type === 'movie') {
        const { data: streams } = await supabase.from('movie_streams').select('url').eq('movie_id', (data as any).content_id).limit(1);
        if (streams && streams.length > 0) setStreamUrl(streams[0].url);
      } else if ((data as any).content_id && ((data as any).content_type === 'series' || (data as any).content_type === 'tv')) {
        const { data: episodes } = await supabase.from('series_episodes').select('id').eq('series_id', (data as any).content_id).order('season_number', { ascending: true }).order('episode_number', { ascending: true }).limit(1);
        if (episodes && episodes.length > 0) {
          const { data: streams } = await supabase.from('episode_streams').select('url').eq('episode_id', episodes[0].id).limit(1);
          if (streams && streams.length > 0) setStreamUrl(streams[0].url);
        }
      }
    }
    await Promise.all([loadMembers(), loadMessages()]);
    setLoading(false);
  };

  const loadMembers = async () => {
    const { data } = await supabase.from('cinema_room_members' as any).select('*').eq('room_id', roomId!);
    if (data) setMembers(data as any[]);
  };

  const loadMessages = async () => {
    const { data } = await supabase.from('cinema_chat_messages' as any).select('*').eq('room_id', roomId!).order('created_at', { ascending: true }).limit(200);
    if (data) setMessages(data as any[]);
  };

  const joinRoom = async () => {
    await supabase.from('cinema_room_members' as any).upsert({
      room_id: roomId,
      user_id: user!.id,
      profile_name: currentProfile?.name || 'Anônimo',
      avatar_url: currentProfile?.avatar_url || null,
    } as any, { onConflict: 'room_id,user_id' });
  };

  const leaveRoom = async () => {
    await supabase.from('cinema_room_members' as any).delete().eq('room_id', roomId!).eq('user_id', user!.id);
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    if (mutedUsers.includes(user!.id)) {
      toast({ title: 'Você está silenciado', variant: 'destructive' });
      return;
    }
    await supabase.from('cinema_chat_messages' as any).insert({
      room_id: roomId,
      user_id: user!.id,
      profile_name: currentProfile?.name || 'Anônimo',
      avatar_url: currentProfile?.avatar_url || null,
      message: chatInput.trim(),
    } as any);
    setChatInput('');
  };

  const handleTyping = () => {
    clearTimeout(typingTimeout.current);
    const channel = supabase.channel(`cinema-typing-${roomId}`);
    channel.track({ typing: true, user_id: user?.id, name: currentProfile?.name || 'Anônimo' });
    typingTimeout.current = setTimeout(() => {
      channel.track({ typing: false, user_id: user?.id, name: currentProfile?.name || 'Anônimo' });
    }, 2000);
  };

  const togglePlaySync = useCallback(async () => {
    if (!isCreator) {
      toast({ title: 'Apenas o host pode controlar', variant: 'destructive' });
      return;
    }
    const newState = !isPlaying;
    ignoreNextSync.current = true;
    setIsPlaying(newState);

    await supabase.from('cinema_rooms' as any).update({
      is_playing: newState,
      status: newState ? 'playing' : 'waiting',
      synced_at: new Date().toISOString(),
    } as any).eq('id', roomId!);

    await supabase.from('cinema_chat_messages' as any).insert({
      room_id: roomId,
      user_id: user!.id,
      profile_name: '🎬 Sistema',
      message: newState ? '▶️ Reprodução iniciada pelo host' : '⏸️ Reprodução pausada pelo host',
    } as any);
  }, [isPlaying, isCreator, roomId, user]);

  const toggleMuteUser = async (userId: string) => {
    if (!isCreator) return;
    const currentMuted: string[] = room?.muted_users || [];
    const newMuted = currentMuted.includes(userId)
      ? currentMuted.filter(id => id !== userId)
      : [...currentMuted, userId];
    await supabase.from('cinema_rooms' as any).update({ muted_users: newMuted } as any).eq('id', roomId!);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Sala não encontrada</p>
        <Button onClick={() => navigate('/cinema')} variant="outline">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-card/90 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate('/cinema')} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-foreground font-semibold text-sm truncate max-w-[200px]">{room.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {members.length}/{room.total_seats}
              {room.content_title && <span className="text-primary truncate max-w-[150px]">• 🎬 {room.content_title}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isCreator && streamUrl && (
            <Button
              size="sm"
              className={`gap-1 text-xs h-8 ${isPlaying ? 'bg-destructive hover:bg-destructive/90' : 'bg-green-600 hover:bg-green-700'}`}
              onClick={togglePlaySync}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? 'Pausar Todos' : 'Play Todos'}
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowChat(!showChat)}>
            {showChat ? <EyeOff className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Sync status + delay indicator */}
      {!isCreator && (
        <div className={`px-4 py-1 text-center text-xs font-medium flex items-center justify-center gap-2 ${isPlaying ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
          {isPlaying ? '● Reprodução em andamento' : '⏸ Aguardando o host'}
          {syncDelay && syncDelay > 1 && (
            <span className="text-orange-400 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> {syncDelay}s atraso
            </span>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* Video area - expands when chat is hidden */}
        <div className={`${showChat ? 'flex-1' : 'w-full'} bg-background flex items-center justify-center relative transition-all duration-300`}>
          {streamUrl ? (
            <div className="w-full h-full">
              <VideoPlayer
                src={streamUrl}
                title={room.content_title || room.name}
                poster={room.content_poster ? (room.content_poster.startsWith('http') ? room.content_poster : `https://image.tmdb.org/t/p/w780${room.content_poster}`) : undefined}
              />
            </div>
          ) : (
            <div className="text-center p-8">
              <Popcorn className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Nenhum conteúdo disponível</p>
              {room.content_title && <p className="text-muted-foreground/60 text-sm mt-2">Stream não encontrado: {room.content_title}</p>}
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card border-l border-border flex flex-col h-[40vh] sm:h-auto overflow-hidden"
            >
              {/* Members bar */}
              <div className="px-3 py-2 border-b border-border flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {members.map((m) => (
                  <div key={m.id} className="flex flex-col items-center min-w-[44px] group relative" title={m.profile_name}>
                    <Avatar className="h-7 w-7 border border-border">
                      <AvatarImage src={m.avatar_url || ''} />
                      <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{m.profile_name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-[9px] text-muted-foreground truncate max-w-[40px] mt-0.5">{m.profile_name}</span>
                    {isCreator && m.user_id !== user?.id && (
                      <button onClick={() => toggleMuteUser(m.user_id)} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-card border border-border rounded-full p-0.5 transition-opacity" title={mutedUsers.includes(m.user_id) ? 'Desmutar' : 'Silenciar'}>
                        <VolumeX className={`h-2.5 w-2.5 ${mutedUsers.includes(m.user_id) ? 'text-destructive' : 'text-muted-foreground'}`} />
                      </button>
                    )}
                    {mutedUsers.includes(m.user_id) && (
                      <VolumeX className="h-2.5 w-2.5 text-destructive absolute bottom-3 right-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Messages */}
              <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && (
                  <p className="text-muted-foreground/50 text-center text-xs mt-8">Sem mensagens ainda</p>
                )}
                {messages.map((msg) => {
                  const isSystem = msg.profile_name === '🎬 Sistema';
                  const isMe = msg.user_id === user?.id && !isSystem;
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isSystem && !isMe && (
                        <Avatar className="h-6 w-6 mt-1 shrink-0">
                          <AvatarImage src={msg.avatar_url || ''} />
                          <AvatarFallback className="text-[9px] bg-secondary">{msg.profile_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[80%] rounded-xl px-3 py-1.5 text-sm ${
                        isSystem
                          ? 'bg-primary/10 text-primary text-center w-full max-w-full text-xs'
                          : isMe
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary text-foreground rounded-bl-sm'
                      }`}>
                        {!isMe && !isSystem && (
                          <p className="text-[10px] text-primary font-medium">{msg.profile_name}</p>
                        )}
                        <p className="break-words text-[13px]">{msg.message}</p>
                        <p className={`text-[9px] mt-0.5 ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground/50'} ${isMe ? 'text-right' : ''}`}>{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="px-3 py-1 text-[10px] text-muted-foreground/60 italic">
                  {typingUsers.join(', ')} digitando...
                </div>
              )}

              {/* Chat input */}
              <div className="p-2.5 border-t border-border flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => { setChatInput(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={mutedUsers.includes(user?.id || '') ? 'Você está silenciado' : 'Mensagem...'}
                  className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
                  maxLength={500}
                  disabled={mutedUsers.includes(user?.id || '')}
                />
                <Button size="icon" className="shrink-0 h-9 w-9" onClick={sendMessage} disabled={!chatInput.trim() || mutedUsers.includes(user?.id || '')}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CinemaRoom;
