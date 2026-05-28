
import React from 'react';
import Layout from '@/components/Layout';

const TermsOfServicePage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Termos de Serviço</h1>
          <p className="text-superflix-text-muted mb-8">Última atualização: 9 de abril de 2025</p>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-superflix-text-light mb-6">
              Bem-vindo ao FlixHub. Ao acessar ou usar nossa plataforma, você concorda com estes Termos de Serviço. Por favor, leia-os cuidadosamente.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-superflix-text-light mb-6">
              Ao criar uma conta ou usar o FlixHub, você concorda com estes Termos de Serviço. Se você não concordar com algum aspecto destes termos, não deverá utilizar nossa plataforma.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Contas de Usuário</h2>
            <p className="text-superflix-text-light mb-4">
              Para acessar determinados recursos do FlixHub, você precisará criar uma conta. Ao criar uma conta, você concorda em:
            </p>
            <ul className="list-disc pl-6 text-superflix-text-light mb-6 space-y-2">
              <li>Fornecer informações precisas e completas.</li>
              <li>Manter a confidencialidade da sua senha e restringir o acesso à sua conta.</li>
              <li>Ser responsável por todas as atividades que ocorram em sua conta.</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado da sua conta.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Uso Aceitável</h2>
            <p className="text-superflix-text-light mb-4">
              Você concorda em usar o FlixHub apenas para fins legais e de acordo com estes Termos. Você não deve:
            </p>
            <ul className="list-disc pl-6 text-superflix-text-light mb-6 space-y-2">
              <li>Violar quaisquer leis ou regulamentos aplicáveis.</li>
              <li>Interferir ou tentar interferir no funcionamento adequado do FlixHub.</li>
              <li>Contornar, desativar ou interferir nos recursos de segurança da plataforma.</li>
              <li>Usar o FlixHub para distribuir malware ou outros códigos prejudiciais.</li>
              <li>Tentar acessar áreas ou recursos não autorizados da plataforma.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Propriedade Intelectual</h2>
            <p className="text-superflix-text-light mb-6">
              O FlixHub e todo o seu conteúdo, recursos e funcionalidades são de propriedade do FlixHub, seus licenciadores ou outros provedores de tal material, e são protegidos por direitos autorais, marcas registradas e outras leis de propriedade intelectual.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Limitação de Responsabilidade</h2>
            <p className="text-superflix-text-light mb-6">
              Em nenhuma circunstância o FlixHub, seus diretores, funcionários ou agentes serão responsáveis por quaisquer danos indiretos, punitivos, incidentais, especiais, consequenciais ou exemplares, incluindo, sem limitação, danos por perda de lucros, perda de dados, ou outros danos intangíveis decorrentes do uso ou da incapacidade de usar o serviço.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Alterações nos Termos</h2>
            <p className="text-superflix-text-light mb-6">
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. Continuando a acessar ou usar o FlixHub após a publicação de alterações, você concorda em ficar vinculado aos termos revisados.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Rescisão</h2>
            <p className="text-superflix-text-light mb-6">
              Podemos encerrar ou suspender sua conta e acesso ao FlixHub imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar estes Termos.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Lei Aplicável</h2>
            <p className="text-superflix-text-light mb-6">
              Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar seus conflitos de disposições legais.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Contato</h2>
            <p className="text-superflix-text-light mb-6">
              Se você tiver dúvidas sobre estes Termos, entre em contato conosco em termos@flixhub.com ou através da nossa <a href="/contato" className="text-superflix-primary hover:underline">página de contato</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfServicePage;
