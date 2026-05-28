
import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Layout from '@/components/Layout';

const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const faqItems = [
    {
      question: "O que é o FlixHub?",
      answer: "FlixHub é uma plataforma de streaming que oferece acesso a filmes, séries e animes. Nosso objetivo é proporcionar a melhor experiência de entretenimento com uma interface intuitiva e funcionalidades exclusivas."
    },
    {
      question: "Como funciona o sistema de favoritos?",
      answer: "O sistema de favoritos permite que você marque filmes, séries e animes para assistir mais tarde. Basta clicar no ícone de coração em qualquer título que você queira salvar. Todos os seus favoritos ficam disponíveis na seção 'Favoritos' do seu perfil."
    },
    {
      question: "O que é a função 'Continuar Assistindo'?",
      answer: "A função 'Continuar Assistindo' salva automaticamente seu progresso em filmes e episódios de séries. Assim, você pode retomar de onde parou sem precisar lembrar em qual parte estava."
    },
    {
      question: "Preciso criar uma conta para usar o FlixHub?",
      answer: "Sim, é necessário criar uma conta para aproveitar todas as funcionalidades do FlixHub, como salvar favoritos, manter histórico de visualização e continuar assistindo de onde parou."
    },
    {
      question: "Como faço para assistir em dispositivos móveis?",
      answer: "O FlixHub é responsivo e funciona em qualquer dispositivo com um navegador moderno. Basta acessar nosso site pelo navegador do seu smartphone ou tablet."
    },
    {
      question: "É possível baixar conteúdo para assistir offline?",
      answer: "No momento, não oferecemos a funcionalidade de download para visualização offline. Estamos trabalhando para implementar essa função em versões futuras."
    },
    {
      question: "Como posso alterar minhas informações de conta?",
      answer: "Você pode acessar e alterar suas informações de conta na seção 'Perfil', disponível após fazer login no FlixHub."
    },
    {
      question: "O FlixHub está disponível em quais idiomas?",
      answer: "Atualmente, o FlixHub está disponível em português do Brasil, mas estamos trabalhando para adicionar mais opções de idiomas."
    }
  ];
  
  const filteredFAQs = searchQuery 
    ? faqItems.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqItems;

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Perguntas Frequentes</h1>
          <p className="text-superflix-text-light mb-8">
            Encontre respostas para as perguntas mais comuns sobre o FlixHub e nossos serviços.
          </p>
          
          <div className="relative mb-8">
            <input
              type="text"
              placeholder="Buscar pergunta ou palavra-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-superflix-dark border border-gray-700 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-superflix-primary"
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12 bg-superflix-dark rounded-lg">
              <p className="text-superflix-text-muted mb-2">Nenhum resultado encontrado</p>
              <p className="text-sm text-superflix-text-muted">
                Tente buscar por outras palavras-chave ou{" "}
                <a href="/contato" className="text-superflix-primary hover:underline">entre em contato</a> conosco.
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="bg-superflix-dark rounded-lg overflow-hidden">
              {filteredFAQs.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-800 last:border-b-0">
                  <AccordionTrigger className="px-6 py-4 text-white hover:text-superflix-primary hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-superflix-text-light">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          
          <div className="mt-8 p-6 bg-superflix-dark rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Ainda tem dúvidas?</h2>
            <p className="text-superflix-text-light mb-4">
              Se você não encontrou a resposta que procurava, nossa equipe de suporte está pronta para ajudar.
            </p>
            <a 
              href="/contato" 
              className="inline-block bg-superflix-primary hover:bg-superflix-primary/90 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Entre em Contato
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQPage;
