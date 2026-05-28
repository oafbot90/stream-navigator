import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContentCard from './ContentCard';
import { CatalogMovie } from '@/services/moviesCatalogService';

interface ContentRowProps {
  title: string;
  items: CatalogMovie[];
  viewAllLink?: string;
}

const ContentRow: React.FC<ContentRowProps> = memo(({ title, items, viewAllLink }) => {
  if (!items || items.length === 0) {
    return (
      <div className="mt-6 sm:mt-8 mb-8 sm:mb-12">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 px-1">{title}</h2>
        <div className="bg-superflix-dark rounded-md p-4 sm:p-6 text-center text-superflix-text-muted text-sm sm:text-base">
          Nenhum conteúdo encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 sm:mt-8 mb-8 sm:mb-12">
      <div className="flex justify-between items-center mb-3 sm:mb-4 px-1">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{title}</h2>
        
        {viewAllLink && (
          <Link to={viewAllLink}>
            <Button variant="link" size="sm" className="text-superflix-text-muted hover:text-white text-xs sm:text-sm p-0 h-auto">
              Ver todos
              <ChevronRight className="ml-0.5 sm:ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </Link>
        )}
      </div>
      
      <div className="flex overflow-x-auto gap-2.5 sm:gap-3 md:gap-4 pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            id={item.id}
            title={item.title}
            posterPath={item.poster_path}
            releaseDate={item.release_date}
            type={item.content_type === 'tv' ? 'tv' : 'movie'}
            voteAverage={item.vote_average}
          />
        ))}
      </div>
    </div>
  );
});

ContentRow.displayName = 'ContentRow';

export default ContentRow;
