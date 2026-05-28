
import React from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useIsFavorite, useAddToFavorites, useRemoveFromFavorites } from '@/services/favoritesService';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';

interface FavoriteButtonProps {
  contentId: string;
  contentType: 'movie' | 'tv';
  title: string;
  posterPath?: string;
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  contentId,
  contentType,
  title,
  posterPath,
  className
}) => {
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: isFavorite, isLoading } = useIsFavorite(contentId, contentType);
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Faça login primeiro",
        description: "Você precisa estar logado para adicionar aos favoritos",
      });
      navigate('/auth');
      return;
    }
    
    if (!currentProfile) {
      toast({
        title: "Selecione um perfil",
        description: "Você precisa selecionar um perfil para adicionar aos favoritos",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFavorite) {
        await removeFromFavorites.mutateAsync({ contentId, contentType });
        toast({
          title: "Removido dos favoritos",
          description: `${title} foi removido dos seus favoritos`,
        });
      } else {
        await addToFavorites.mutateAsync({ contentId, contentType, title, posterPath });
        toast({
          title: "Adicionado aos favoritos",
          description: `${title} foi adicionado aos seus favoritos`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleFavorite}
      disabled={isLoading || addToFavorites.isPending || removeFromFavorites.isPending || (!!user && !currentProfile)}
      className={`${className || ''}`}
    >
      <Heart
        className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`}
      />
    </Button>
  );
};

export default FavoriteButton;
