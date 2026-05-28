
import React from 'react';
import Layout from '@/components/Layout';

const DMCAPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Política DMCA</h1>
          <p className="text-superflix-text-muted mb-8">Última atualização: 9 de abril de 2025</p>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-superflix-text-light mb-6">
              O FlixHub respeita os direitos de propriedade intelectual de terceiros e espera que seus usuários façam o mesmo. De acordo com o Digital Millennium Copyright Act (DMCA), respondemos a notificações de alegadas infrações de direitos autorais.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Notificação de Infração de Direitos Autorais</h2>
            <p className="text-superflix-text-light mb-6">
              Se você acredita que o conteúdo disponível no FlixHub infringe seus direitos autorais, você pode enviar uma notificação por escrito que inclua as seguintes informações:
            </p>
            
            <ol className="list-decimal pl-6 text-superflix-text-light mb-6 space-y-2">
              <li>Uma assinatura física ou eletrônica do proprietário dos direitos autorais ou de uma pessoa autorizada a agir em seu nome.</li>
              <li>Identificação da obra protegida por direitos autorais que você alega ter sido infringida.</li>
              <li>Identificação do material que você alega estar infringindo e onde está localizado no FlixHub, com detalhes suficientes para que possamos encontrá-lo.</li>
              <li>Seu endereço, número de telefone e endereço de e-mail.</li>
              <li>Uma declaração de que você acredita de boa-fé que o uso do material da maneira reclamada não é autorizado pelo proprietário dos direitos autorais, seu agente ou pela lei.</li>
              <li>Uma declaração de que as informações em sua notificação são precisas e, sob pena de perjúrio, que você é o proprietário dos direitos autorais ou está autorizado a agir em nome do proprietário.</li>
            </ol>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Enviar Notificação DMCA</h2>
            <p className="text-superflix-text-light mb-6">
              As notificações DMCA podem ser enviadas para:
            </p>
            <p className="text-superflix-text-light mb-6">
              <strong>Email:</strong> dmca@flixhub.com<br />
              <strong>Endereço Postal:</strong><br />
              FlixHub - Departamento Legal<br />
              Avenida Paulista, 1000<br />
              São Paulo, SP, Brasil<br />
              CEP: 01310-100
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contra-notificação</h2>
            <p className="text-superflix-text-light mb-6">
              Se o material que você postou foi removido como resultado de uma notificação DMCA e você acredita que foi removido por engano, você pode enviar uma contra-notificação que inclua:
            </p>
            <ol className="list-decimal pl-6 text-superflix-text-light mb-6 space-y-2">
              <li>Sua assinatura física ou eletrônica.</li>
              <li>Identificação do material que foi removido e o local onde aparecia antes de ser removido.</li>
              <li>Uma declaração sob pena de perjúrio de que você acredita de boa-fé que o material foi removido ou desativado como resultado de um erro ou identificação incorreta do material.</li>
              <li>Seu nome, endereço e número de telefone, e uma declaração de que você consente com a jurisdição do Tribunal Federal do distrito onde seu endereço está localizado ou, se seu endereço estiver fora dos Estados Unidos, de qualquer distrito judicial no qual o FlixHub possa ser encontrado, e que você aceitará o serviço de processo da pessoa que forneceu a notificação DMCA ou de um agente dessa pessoa.</li>
            </ol>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Política de Infratores Reincidentes</h2>
            <p className="text-superflix-text-light mb-6">
              O FlixHub tem uma política de encerrar, em circunstâncias apropriadas, as contas de usuários que são infratores reincidentes de direitos autorais.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Alterações na Política DMCA</h2>
            <p className="text-superflix-text-light mb-6">
              O FlixHub pode revisar esta política DMCA a qualquer momento. A versão mais recente estará sempre disponível em nosso site.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contato</h2>
            <p className="text-superflix-text-light mb-6">
              Se você tiver dúvidas sobre nossa política DMCA, entre em contato conosco em dmca@flixhub.com ou através da nossa <a href="/contato" className="text-superflix-primary hover:underline">página de contato</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DMCAPage;
