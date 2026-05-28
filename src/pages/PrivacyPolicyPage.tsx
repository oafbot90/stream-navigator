
import React from 'react';
import Layout from '@/components/Layout';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Política de Privacidade</h1>
          <p className="text-superflix-text-muted mb-8">Última atualização: 9 de abril de 2025</p>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-superflix-text-light mb-6">
              Sua privacidade é importante para nós. Esta Política de Privacidade explica como o FlixHub coleta, usa, armazena e protege suas informações pessoais quando você utiliza nossa plataforma.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Informações que Coletamos</h2>
            <p className="text-superflix-text-light mb-4">
              Coletamos os seguintes tipos de informações:
            </p>
            <ul className="list-disc pl-6 text-superflix-text-light mb-6 space-y-2">
              <li><strong>Informações de Conta:</strong> Quando você se registra, coletamos seu endereço de e-mail e senha.</li>
              <li><strong>Informações de Uso:</strong> Coletamos dados sobre como você interage com o FlixHub, incluindo histórico de visualização, favoritos e progresso de visualização.</li>
              <li><strong>Dispositivo e Navegação:</strong> Coletamos informações sobre seu dispositivo e navegador quando você acessa o FlixHub.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Como Usamos suas Informações</h2>
            <p className="text-superflix-text-light mb-4">
              Usamos suas informações para:
            </p>
            <ul className="list-disc pl-6 text-superflix-text-light mb-6 space-y-2">
              <li>Fornecer, manter e melhorar o FlixHub.</li>
              <li>Personalizar sua experiência e recomendar conteúdo relevante.</li>
              <li>Processar e lembrar suas preferências e configurações.</li>
              <li>Comunicar-se com você sobre atualizações, recursos e ofertas.</li>
              <li>Analisar tendências e uso para melhorar nossos serviços.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Compartilhamento de Informações</h2>
            <p className="text-superflix-text-light mb-6">
              Não vendemos ou alugamos suas informações pessoais a terceiros. Podemos compartilhar informações nas seguintes circunstâncias:
            </p>
            <ul className="list-disc pl-6 text-superflix-text-light mb-6 space-y-2">
              <li>Com provedores de serviços que nos ajudam a operar o FlixHub.</li>
              <li>Para cumprir com obrigações legais, como responder a ordens judiciais.</li>
              <li>Para proteger nossos direitos, privacidade, segurança ou propriedade.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Segurança</h2>
            <p className="text-superflix-text-light mb-6">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Seus Direitos</h2>
            <p className="text-superflix-text-light mb-4">
              Você tem os seguintes direitos em relação às suas informações pessoais:
            </p>
            <ul className="list-disc pl-6 text-superflix-text-light mb-6 space-y-2">
              <li>Acessar e receber uma cópia de suas informações.</li>
              <li>Retificar informações imprecisas.</li>
              <li>Solicitar a exclusão de suas informações.</li>
              <li>Restringir ou se opor ao processamento de suas informações.</li>
              <li>Portar seus dados para outro serviço.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Alterações nesta Política</h2>
            <p className="text-superflix-text-light mb-6">
              Podemos atualizar esta Política de Privacidade periodicamente. A versão mais recente será sempre publicada em nosso site com a data da última atualização.
            </p>
            
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Contato</h2>
            <p className="text-superflix-text-light mb-6">
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos suas informações, entre em contato conosco em privacidade@flixhub.com ou através da nossa <a href="/contato" className="text-superflix-primary hover:underline">página de contato</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;
