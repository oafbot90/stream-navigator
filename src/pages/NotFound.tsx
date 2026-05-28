
import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

const NotFound: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 pt-40 pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-superflix-primary mb-6">404</h1>
          <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">Página Não Encontrada</h2>
          <p className="text-superflix-text-muted mb-8">
            Ops! Parece que você entrou em território desconhecido.
            A página que você está procurando não existe ou foi movida.
          </p>
          <Link to="/">
            <Button className="bg-superflix-primary hover:bg-superflix-primary/90 text-white">
              <Home className="mr-2 h-4 w-4" />
              Voltar para a Página Inicial
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
