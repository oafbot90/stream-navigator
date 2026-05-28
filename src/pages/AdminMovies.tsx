import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Film, Search, ChevronLeft, ChevronRight, Trash2, ExternalLink, Pencil, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { moviesCatalogService } from '@/services/moviesCatalogService';
import { motion } from 'framer-motion';

const PAGE_SIZE = 30;

const AdminMovies: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-movies', page, searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        const movies = await moviesCatalogService.searchMovies(searchQuery, PAGE_SIZE);
        return { movies, total: movies.length };
      }
      return moviesCatalogService.getMovies(page, PAGE_SIZE);
    },
  });

  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);


  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este filme?')) return;
    await supabase.from('movie_streams').delete().eq('movie_id', id);
    await supabase.from('movies_catalog').delete().eq('id', id);
    window.location.reload();
  };

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20">
                  <Film className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-foreground tracking-tight">Catálogo de Filmes</h1>
                  <p className="text-sm text-muted-foreground">{(data?.total || 0).toLocaleString('pt-BR')} filmes no banco de dados</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="rounded-xl"><Link to="/admin"><ChevronLeft className="h-4 w-4 mr-1" /> Admin</Link></Button>
                <Button asChild size="sm" className="rounded-xl gap-1"><Link to="/admin/add-movie"><Plus className="h-4 w-4" /> Adicionar</Link></Button>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <div className="flex gap-2 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por título..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl bg-card/40 border-border/30" />
            </div>
            {search && <Button type="button" variant="ghost" onClick={() => setSearch('')} className="rounded-xl gap-1"><X className="h-4 w-4" /> Limpar</Button>}
          </div>


          {/* Grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {data?.movies.map((movie, i) => (
                  <motion.div key={movie.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                    <div className="rounded-2xl border border-border/20 bg-card/30 overflow-hidden group relative hover:border-primary/30 transition-all">
                      <div className="aspect-[2/3] relative overflow-hidden">
                        <img src={moviesCatalogService.getPosterUrl(movie.poster_path, 'w342')} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center gap-1.5 pb-3">
                          <Button size="sm" variant="secondary" className="h-8 w-8 rounded-xl p-0" asChild><Link to={`/admin/edit-movie/${movie.id}`}><Pencil className="h-3.5 w-3.5" /></Link></Button>
                          <Button size="sm" variant="secondary" className="h-8 w-8 rounded-xl p-0" asChild><Link to={`/details/movie/${movie.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link></Button>
                          <Button size="sm" variant="destructive" className="h-8 w-8 rounded-xl p-0" onClick={() => handleDelete(movie.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-foreground truncate">{movie.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{movie.release_year || '—'} • ⭐ {movie.vote_average?.toFixed(1) || '—'}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {!searchQuery && totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-10">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl gap-1">
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{page}</span>
                    <span className="text-xs text-muted-foreground">de {totalPages}</span>
                  </div>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl gap-1">
                    Próxima <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminMovies;
