
import React from 'react';
import Layout from '@/components/Layout';

const AboutPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Sobre Nós</h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-superflix-text-light mb-6">
              FlixHub é uma plataforma dedicada a oferecer uma experiência premium de streaming para amantes de filmes, séries e animes. Nossa missão é proporcionar acesso aos melhores conteúdos de entretenimento com uma interface intuitiva e funcionalidades que melhoram sua experiência de visualização.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Nossa Visão</h2>
            <p className="text-superflix-text-light mb-6">
              Acreditamos que o entretenimento de qualidade deve ser acessível e fácil de encontrar. Nosso objetivo é criar um hub central onde os usuários possam descobrir, acompanhar e desfrutar de seu conteúdo favorito sem complicações.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Nossos Valores</h2>
            <ul className="list-disc pl-6 text-superflix-text-light mb-6 space-y-2">
              <li>Qualidade acima de quantidade</li>
              <li>Experiência do usuário em primeiro lugar</li>
              <li>Constante inovação e melhoria</li>
              <li>Respeito aos criadores de conteúdo</li>
              <li>Comunidade e feedback valorizado</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Nossa Equipe</h2>
            <p className="text-superflix-text-light mb-6">
              Somos um grupo de entusiastas apaixonados por cinema, tecnologia e design. Nossa equipe diversificada trabalha constantemente para melhorar a plataforma e trazer as melhores soluções para nossos usuários.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Entre em Contato</h2>
            <p className="text-superflix-text-light">
              Estamos sempre abertos a feedback, sugestões e parcerias. Não hesite em nos contatar através da nossa página de <a href="/contato" className="text-superflix-primary hover:underline">contato</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;
