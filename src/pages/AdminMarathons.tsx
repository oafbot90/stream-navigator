import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Search, Film, Tv, GripVertical, Library, Eye, EyeOff, X, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAllMarathons, getMarathonItems, createMarathon, updateMarathon, deleteMarathon,
  addMarathonItem, removeMarathonItem, searchMovies, searchSeries,
  type Marathon, type MarathonItem
} from '@/services/marathonService';

const ADMIN_EMAILS = ['alezin1299@gmail.com', 'alezin1788@gmail.com'];

function MarathonForm({ marathon, onSave, onClose }: { marathon?: Marathon; onSave: (data: any) => void; onClose: () => void }) {
  const [title, setTitle] = useState(marathon?.title || '');
  const [description, setDescription] = useState(marathon?.description || '');
  const [posterPath, setPosterPath] = useState(marathon?.poster_path || '');
  const [backdropPath, setBackdropPath] = useState(marathon?.backdrop_path || '');
  const [position, setPosition] = useState(marathon?.position || 0);
  const [isActive, setIsActive] = useState(marathon?.is_active ?? true);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Título *</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Harry Potter" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Descrição</label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição da coleção..." rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">Poster Path (TMDB)</label>
          <Input value={posterPath} onChange={e => setPosterPath(e.target.value)} placeholder="/poster.jpg" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Backdrop Path (TMDB)</label>
          <Input value={backdropPath} onChange={e => setBackdropPath(e.target.value)} placeholder="/backdrop.jpg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">Posição</label>
          <Input type="number" value={position} onChange={e => setPosition(Number(e.target.value))} />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <span className="text-sm">{isActive ? 'Ativa' : 'Inativa'}</span>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave({ title, description, poster_path: posterPath || null, backdrop_path: backdropPath || null, position, is_active: isActive })} disabled={!title}>
          {marathon ? 'Salvar' : 'Criar Coleção'}
        </Button>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
    </div>
  );
}

function AddItemDialog({ marathonId, existingItems, onAdded }: { marathonId: string; existingItems: MarathonItem[]; onAdded: () => void }) {
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = contentType === 'movie' ? await searchMovies(query) : await searchSeries(query);
      setResults(data || []);
    } catch { setResults([]); }
    setSearching(false);
  };

  const handleAdd = async (item: any) => {
    const nextPosition = existingItems.length + 1;
    try {
      await addMarathonItem({
        marathon_id: marathonId,
        content_id: item.id,
        content_type: contentType,
        title: item.title,
        poster_path: item.poster_path,
        position: nextPosition,
      });
      toast({ title: 'Item adicionado!' });
      queryClient.invalidateQueries({ queryKey: ['admin-marathon-items', marathonId] });
      onAdded();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const existingIds = new Set(existingItems.map(i => i.content_id));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={contentType === 'movie' ? 'default' : 'outline'} onClick={() => setContentType('movie')}>
          <Film className="h-4 w-4 mr-1" /> Filmes
        </Button>
        <Button size="sm" variant={contentType === 'series' ? 'default' : 'outline'} onClick={() => setContentType('series')}>
          <Tv className="h-4 w-4 mr-1" /> Séries
        </Button>
      </div>
      <div className="flex gap-2">
        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar título..." onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <Button onClick={handleSearch} disabled={searching}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {results.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/30">
            {item.poster_path ? (
              <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt="" className="w-10 h-14 rounded object-cover" />
            ) : (
              <div className="w-10 h-14 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">N/A</div>
            )}
            <span className="flex-1 text-sm font-medium truncate">{item.title}</span>
            {existingIds.has(item.id) ? (
              <Badge variant="secondary" className="text-xs">Já adicionado</Badge>
            ) : (
              <Button size="sm" variant="outline" onClick={() => handleAdd(item)}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {results.length === 0 && query && !searching && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum resultado encontrado</p>
        )}
      </div>
    </div>
  );
}

function MarathonCard({ marathon }: { marathon: Marathon }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['admin-marathon-items', marathon.id],
    queryFn: () => getMarathonItems(marathon.id),
    enabled: expanded,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Marathon>) => updateMarathon(marathon.id, data),
    onSuccess: () => {
      toast({ title: 'Coleção atualizada!' });
      queryClient.invalidateQueries({ queryKey: ['admin-marathons'] });
      setEditing(false);
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMarathon(marathon.id),
    onSuccess: () => {
      toast({ title: 'Coleção removida!' });
      queryClient.invalidateQueries({ queryKey: ['admin-marathons'] });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => removeMarathonItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marathon-items', marathon.id] });
      toast({ title: 'Item removido!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const toggleActive = () => updateMutation.mutate({ is_active: !marathon.is_active });

  return (
    <div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {marathon.poster_path ? (
          <img src={`https://image.tmdb.org/t/p/w92${marathon.poster_path}`} alt="" className="w-12 h-16 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-12 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Library className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground truncate">{marathon.title}</h3>
            <Badge variant={marathon.is_active ? 'default' : 'secondary'} className="text-[10px] shrink-0">
              {marathon.is_active ? 'Ativa' : 'Inativa'}
            </Badge>
            <Badge variant="outline" className="text-[10px] shrink-0">#{marathon.position}</Badge>
          </div>
          {marathon.description && <p className="text-xs text-muted-foreground truncate mt-1">{marathon.description}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={toggleActive}>
            {marathon.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => {
            if (confirm('Tem certeza que deseja excluir esta coleção e todos os seus itens?')) deleteMutation.mutate();
          }}>
            <Trash2 className="h-4 w-4" />
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{items.length} itens na coleção</span>
            <Button size="sm" variant="outline" onClick={() => setAddingItem(true)}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar Item
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-xs font-bold text-primary w-6 text-center">{index + 1}</span>
                {item.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt="" className="w-8 h-12 rounded object-cover" />
                ) : (
                  <div className="w-8 h-12 rounded bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <Badge variant="outline" className="text-[10px]">{item.content_type === 'movie' ? 'Filme' : 'Série'}</Badge>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={() => removeItemMutation.mutate(item.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum item adicionado ainda</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Coleção</DialogTitle></DialogHeader>
          <MarathonForm marathon={marathon} onSave={data => updateMutation.mutate(data)} onClose={() => setEditing(false)} />
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addingItem} onOpenChange={setAddingItem}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Item à Coleção</DialogTitle></DialogHeader>
          <AddItemDialog marathonId={marathon.id} existingItems={items} onAdded={() => {}} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminMarathons() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  React.useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!isAdmin) { navigate('/'); }
  }, [user, isAdmin, navigate]);

  const { data: marathons = [], isLoading } = useQuery({
    queryKey: ['admin-marathons'],
    queryFn: getAllMarathons,
    enabled: !!isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: createMarathon,
    onSuccess: () => {
      toast({ title: 'Coleção criada!' });
      queryClient.invalidateQueries({ queryKey: ['admin-marathons'] });
      setCreating(false);
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  if (!user || !isAdmin) return null;

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Library className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Coleções</h1>
              <p className="text-sm text-muted-foreground">{marathons.length} coleções cadastradas</p>
            </div>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova Coleção
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {marathons.map(m => <MarathonCard key={m.id} marathon={m} />)}
            {marathons.length === 0 && (
              <p className="text-center text-muted-foreground py-12">Nenhuma coleção cadastrada</p>
            )}
          </div>
        )}

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Coleção</DialogTitle></DialogHeader>
            <MarathonForm onSave={data => createMutation.mutate(data)} onClose={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
