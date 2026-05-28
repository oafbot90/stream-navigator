import React from 'react';
import Layout from '@/components/Layout';
import ContentCard from '@/components/ContentCard';
import { useFavorites } from '@/services/favoritesService';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const FavoritesPage: React.FC = () => {
  const { data: favorites, isLoading } = useFavorites();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-20 sm:pt-32 pb-16">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Meus Favoritos</h1>
          {favorites && favorites.length > 0 && (
            <span className="text-xs sm:text-sm text-muted-foreground ml-auto">
              {favorites.length} {favorites.length === 1 ? 'título' : 'títulos'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !favorites || favorites.length === 0 ? (
          <div className="text-center my-20 space-y-4">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Nenhum favorito ainda</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Adicione filmes e séries aos seus favoritos clicando no ícone de coração nas páginas de detalhes.
            </p>
            <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
              Explorar conteúdo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {favorites.map(fav => (
              <ContentCard
                key={fav.id}
                id={fav.content_id}
                title={fav.title}
                posterPath={fav.poster_path || null}
                voteAverage={0}
                type={fav.content_type as 'movie' | 'tv'}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FavoritesPage;
