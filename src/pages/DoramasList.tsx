import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import ContentCard from '@/components/ContentCard';
import { supabase } from '@/integrations/supabase/client';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';

interface DoramaItem {
  id: string;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string | null;
  type: 'movie' | 'tv';
}

const PAGE_SIZE = 30;
const DORAMA_TAGS = ['Dorama', 'Doramas', 'K-Drama', 'J-Drama', 'C-Drama',
  'Coreano', 'Japonês', 'Chinês', 'Tailandês', 'Asian'];

const DoramasList: React.FC = () => {
  const { toast } = useToast();
  const [allItems, setAllItems] = useState<DoramaItem[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoramas = async () => {
      try {
        setIsLoading(true);

        // 1) Tags explícitas
        const tagFilter = DORAMA_TAGS.map(t => `genres.cs.{${t}}`).join(',');
        const [moviesRes, seriesRes] = await Promise.all([
          supabase.from('movies_catalog').select('*').or(tagFilter).order('vote_average', { ascending: false }).limit(10000),
          supabase.from('series_catalog').select('*').or(tagFilter).order('vote_average', { ascending: false }).limit(10000),
        ]);

        let movieData: any[] = moviesRes.data || [];
        let seriesData: any[] = seriesRes.data || [];

        // 2) Fallback CJK em Drama
        if (movieData.length + seriesData.length === 0) {
          const [m2, s2] = await Promise.all([
            supabase.from('movies_catalog').select('*').contains('genres', ['Drama']).order('vote_average', { ascending: false }).limit(5000),
            supabase.from('series_catalog').select('*').contains('genres', ['Drama']).order('vote_average', { ascending: false }).limit(5000),
          ]);
          const hasCJK = (it: any) => {
            const o = it.original_title || it.title || '';
            return /[\u3000-\u9FFF\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF]/.test(o);
          };
          movieData = (m2.data || []).filter(hasCJK);
          seriesData = (s2.data || []).filter(hasCJK);
        }

        // 3) Fallback final: traz todo o catálogo
        if (movieData.length + seriesData.length === 0) {
          const [m3, s3] = await Promise.all([
            supabase.from('movies_catalog').select('*').order('vote_average', { ascending: false }).limit(10000),
            supabase.from('series_catalog').select('*').order('vote_average', { ascending: false }).limit(10000),
          ]);
          movieData = m3.data || [];
          seriesData = s3.data || [];
        }

        const movies: DoramaItem[] = movieData.map((m: any) => ({
          id: m.id, title: m.title, poster_path: m.poster_path,
          vote_average: m.vote_average || 0, release_date: m.release_date, type: 'movie' as const,
        }));
        const series: DoramaItem[] = seriesData.map((s: any) => ({
          id: s.id, title: s.title, poster_path: s.poster_path,
          vote_average: s.vote_average || 0, release_date: s.first_air_date, type: 'tv' as const,
        }));

        const all = [...movies, ...series].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        setAllItems(all);
        setPage(1);
      } catch (error) {
        console.error('Erro ao buscar doramas:', error);
        toast({ title: 'Erro', description: 'Falha ao carregar doramas.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoramas();
  }, [toast]);

  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = useMemo(
    () => allItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [allItems, currentPage]
  );

  const goTo = (p: number) => {
    const np = Math.min(Math.max(1, p), totalPages);
    setPage(np);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };
    add(1);
    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
      if (i > 1 && i < totalPages) add(i);
    }
    if (totalPages > 1) add(totalPages);
    const out: (number | 'ellipsis')[] = [];
    for (let i = 0; i < pages.length; i++) {
      out.push(pages[i]);
      const next = pages[i + 1];
      if (typeof pages[i] === 'number' && typeof next === 'number' && (next as number) - (pages[i] as number) > 1) {
        out.push('ellipsis');
      }
    }
    return out;
  }, [currentPage, totalPages]);

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-20 sm:pt-32 pb-16">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Doramas</h1>
          <span className="text-xs sm:text-sm text-muted-foreground">{allItems.length.toLocaleString('pt-BR')} títulos</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center my-16">
            <p className="text-muted-foreground">Nenhum dorama encontrado no catálogo.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {visible.map(d => (
                <ContentCard key={`${d.type}-${d.id}`} id={d.id} title={d.title}
                  posterPath={d.poster_path} releaseDate={d.release_date}
                  voteAverage={d.vote_average} type={d.type} />
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent className="flex-wrap">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); goTo(currentPage - 1); }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {pageNumbers.map((p, idx) =>
                    p === 'ellipsis' ? (
                      <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === currentPage}
                          onClick={(e) => { e.preventDefault(); goTo(p); }}
                        >{p}</PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); goTo(currentPage + 1); }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default DoramasList;
