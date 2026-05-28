
import React from 'react';
import { Link } from 'react-router-dom';
import flixhubLogo from '@/assets/flixhub-logo.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-superflix-dark py-8 mt-12 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between mb-8">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="inline-block mb-4">
              <img src={flixhubLogo} alt="FlixHub" className="h-14 object-contain" />
            </Link>
            <p className="text-superflix-text-muted max-w-md">
              Seu centro definitivo de streaming para filmes, séries e animes.
              Experimente entretenimento premium ao seu alcance.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 sm:gap-6">
            <div>
              <h3 className="text-white font-medium mb-4">Navegar</h3>
              <ul className="space-y-2 text-superflix-text-muted">
                <li>
                  <Link to="/movies" className="hover:text-white transition-colors">
                    Filmes
                  </Link>
                </li>
                <li>
                  <Link to="/tvshows" className="hover:text-white transition-colors">
                    Séries
                  </Link>
                </li>
                <li>
                  <Link to="/anime" className="hover:text-white transition-colors">
                    Anime
                  </Link>
                </li>
                <li>
                  <Link to="/kids" className="hover:text-white transition-colors">
                    Infantil
                  </Link>
                </li>
                <li>
                  <Link to="/doramas" className="hover:text-white transition-colors">
                    Doramas
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-superflix-text-muted mb-4 md:mb-0">
            &copy; {currentYear} FlixHub. Todos os direitos reservados.
          </p>
          <p className="text-xs text-superflix-text-muted">
            Desenvolvido com TMDB. Este site não armazena nenhum arquivo em seu servidor.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
