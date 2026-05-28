
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Shuffle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SurpriseMeButton: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const getRandomContent = async () => {
    setIsLoading(true);
    try {
      const contentTypes = ['movie', 'tv', 'anime'];
      const randomType = contentTypes[Math.floor(Math.random() * contentTypes.length)];

      let randomContent: { id: string; title: string; type: 'movie' | 'tv' } | null = null;

      if (randomType === 'movie') {
        const { count } = await supabase
          .from('movies_catalog')
          .select('id', { count: 'exact', head: true });
        if (count && count > 0) {
          const offset = Math.floor(Math.random() * count);
          const { data } = await supabase
            .from('movies_catalog')
            .select('id, title')
            .range(offset, offset)
            .limit(1);
          if (data && data.length > 0) {
            randomContent = { id: data[0].id, title: data[0].title, type: 'movie' };
          }
        }
      } else if (randomType === 'anime') {
        const { count } = await supabase
          .from('series_catalog')
          .select('id', { count: 'exact', head: true })
          .contains('genres', ['Animação']);
        if (count && count > 0) {
          const offset = Math.floor(Math.random() * count);
          const { data } = await supabase
            .from('series_catalog')
            .select('id, title')
            .contains('genres', ['Animação'])
            .range(offset, offset)
            .limit(1);
          if (data && data.length > 0) {
            randomContent = { id: data[0].id, title: data[0].title, type: 'tv' };
          }
        }
      } else {
        const { count } = await supabase
          .from('series_catalog')
          .select('id', { count: 'exact', head: true });
        if (count && count > 0) {
          const offset = Math.floor(Math.random() * count);
          const { data } = await supabase
            .from('series_catalog')
            .select('id, title')
            .range(offset, offset)
            .limit(1);
          if (data && data.length > 0) {
            randomContent = { id: data[0].id, title: data[0].title, type: 'tv' };
          }
        }
      }

      if (randomContent) {
        navigate(`/details/${randomContent.type}/${randomContent.id}`);
        toast({
          title: 'Surpresa!',
          description: `Encontramos algo especial para você: ${randomContent.title}`,
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível encontrar conteúdo no momento. Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error getting random content:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar conteúdo aleatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={getRandomContent}
      disabled={isLoading}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
          Procurando...
        </>
      ) : (
        <>
          <Shuffle className="h-4 w-4 mr-2" />
          Me Surpreenda!
        </>
      )}
    </Button>
  );
};

export default SurpriseMeButton;
