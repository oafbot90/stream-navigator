
import React from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Sobre: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold text-white mb-8">Informações</h1>
        
        <Tabs defaultValue="sobre" className="w-full">
          <TabsList className="mb-8 flex flex-wrap bg-superflix-dark">
            <TabsTrigger value="sobre">Sobre Nós</TabsTrigger>
            <TabsTrigger value="contato">Contato</TabsTrigger>
            <TabsTrigger value="faq">Perguntas Frequentes</TabsTrigger>
            <TabsTrigger value="privacidade">Privacidade</TabsTrigger>
            <TabsTrigger value="termos">Termos de Serviço</TabsTrigger>
            <TabsTrigger value="dmca">DMCA</TabsTrigger>
          </TabsList>
          
          <div className="bg-superflix-dark rounded-lg p-6 md:p-8">
            <TabsContent value="sobre">
              <h2 className="text-2xl font-bold text-white mb-4">Sobre o FlixHub</h2>
              <p className="text-superflix-text-light mb-4">
                FlixHub é uma plataforma de streaming que oferece uma ampla variedade de filmes, séries e animes. Nossa missão é proporcionar entretenimento de qualidade para todos os gostos, reunindo conteúdo diversificado em um único lugar.
              </p>
              <p className="text-superflix-text-light mb-4">
                Fundada em 2023, a FlixHub nasceu da paixão por conteúdo audiovisual e da vontade de criar uma experiência de streaming simplificada e acessível. Nosso objetivo é continuar expandindo nosso catálogo e melhorando a experiência do usuário.
              </p>
              <p className="text-superflix-text-light">
                Na FlixHub, valorizamos a diversidade de conteúdo e buscamos oferecer opções para todos os públicos. Trabalhamos constantemente para trazer as melhores produções nacionais e internacionais, dos clássicos aos lançamentos mais recentes.
              </p>
            </TabsContent>
            
            <TabsContent value="contato">
              <h2 className="text-2xl font-bold text-white mb-4">Entre em Contato</h2>
              <p className="text-superflix-text-light mb-6">
                Estamos sempre disponíveis para ouvir sugestões, responder dúvidas e resolver problemas. Entre em contato conosco através dos canais abaixo:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Email de Suporte:</h3>
                  <p className="text-superflix-text-light">suporte@flixhub.com</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Email Comercial:</h3>
                  <p className="text-superflix-text-light">comercial@flixhub.com</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Horário de Atendimento:</h3>
                  <p className="text-superflix-text-light">Segunda a Sexta, das 9h às 18h</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="faq">
              <h2 className="text-2xl font-bold text-white mb-4">Perguntas Frequentes</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">O FlixHub é gratuito?</h3>
                  <p className="text-superflix-text-light">
                    Sim, o FlixHub é uma plataforma gratuita que oferece acesso a filmes, séries e animes. Nosso modelo é sustentado por anúncios e parcerias.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">É necessário criar uma conta para assistir?</h3>
                  <p className="text-superflix-text-light">
                    Não é obrigatório, mas recomendamos criar uma conta para acessar funcionalidades como favoritos, histórico de visualização e continuar de onde parou.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Como posso assistir em dispositivos móveis?</h3>
                  <p className="text-superflix-text-light">
                    O FlixHub é otimizado para navegadores em smartphones e tablets. Basta acessar nosso site pelo navegador do seu dispositivo.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Por que alguns vídeos não carregam?</h3>
                  <p className="text-superflix-text-light">
                    Problemas de carregamento podem ocorrer devido à sua conexão com a internet ou problemas temporários nos servidores. Tente recarregar a página ou tentar novamente mais tarde.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Como reporto conteúdo impróprio ou problemas?</h3>
                  <p className="text-superflix-text-light">
                    Você pode reportar qualquer problema através da nossa página de contato ou enviando um email para suporte@flixhub.com.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="privacidade">
              <h2 className="text-2xl font-bold text-white mb-4">Política de Privacidade</h2>
              <p className="text-superflix-text-light mb-4">
                Última atualização: 09 de abril de 2023
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">1. Informações Coletadas</h3>
                  <p className="text-superflix-text-light">
                    Coletamos informações como nome, email, preferências de conteúdo e histórico de visualização para melhorar sua experiência na plataforma.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">2. Uso das Informações</h3>
                  <p className="text-superflix-text-light">
                    Utilizamos suas informações para personalizar sua experiência, melhorar nossos serviços, enviar notificações sobre novos conteúdos e processamentos internos.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">3. Compartilhamento de Dados</h3>
                  <p className="text-superflix-text-light">
                    Não vendemos ou compartilhamos suas informações pessoais com terceiros, exceto quando necessário para prestar nossos serviços ou quando exigido por lei.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">4. Cookies e Tecnologias Semelhantes</h3>
                  <p className="text-superflix-text-light">
                    Utilizamos cookies para melhorar a navegação, personalizar conteúdo e analisar o tráfego do site.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">5. Seus Direitos</h3>
                  <p className="text-superflix-text-light">
                    Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento. Para exercer esses direitos, entre em contato conosco.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="termos">
              <h2 className="text-2xl font-bold text-white mb-4">Termos de Serviço</h2>
              <p className="text-superflix-text-light mb-4">
                Última atualização: 09 de abril de 2023
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">1. Aceitação dos Termos</h3>
                  <p className="text-superflix-text-light">
                    Ao acessar ou usar o FlixHub, você concorda com estes Termos de Serviço e nossa Política de Privacidade.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">2. Elegibilidade</h3>
                  <p className="text-superflix-text-light">
                    Para usar o FlixHub, você deve ter pelo menos 13 anos de idade. Se for menor de 18 anos, deve ter permissão dos pais ou responsável legal.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">3. Contas de Usuário</h3>
                  <p className="text-superflix-text-light">
                    Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">4. Conteúdo da Plataforma</h3>
                  <p className="text-superflix-text-light">
                    Todo o conteúdo disponível no FlixHub é protegido por direitos autorais e outras leis de propriedade intelectual.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">5. Comportamento do Usuário</h3>
                  <p className="text-superflix-text-light">
                    Você concorda em não usar o FlixHub para qualquer finalidade ilegal ou não autorizada, incluindo a violação de direitos autorais.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">6. Alterações nos Termos</h3>
                  <p className="text-superflix-text-light">
                    Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor após a publicação dos termos atualizados.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="dmca">
              <h2 className="text-2xl font-bold text-white mb-4">Política DMCA</h2>
              <p className="text-superflix-text-light mb-6">
                O FlixHub respeita os direitos de propriedade intelectual de terceiros e espera que seus usuários façam o mesmo. Se você acredita que seu trabalho foi copiado de uma maneira que constitui violação de direitos autorais, por favor forneça as seguintes informações:
              </p>
              
              <div className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-superflix-text-light">
                  <li>Uma assinatura física ou eletrônica do proprietário dos direitos autorais ou da pessoa autorizada a agir em seu nome;</li>
                  <li>Identificação da obra protegida por direitos autorais que você alega ter sido violada;</li>
                  <li>Identificação do material que você alega estar violando e que deve ser removido, com informações suficientes para nos permitir localizar o material;</li>
                  <li>Informações de contato, como seu endereço, número de telefone e endereço de e-mail;</li>
                  <li>Uma declaração de que você acredita de boa-fé que o uso do material da maneira reclamada não é autorizado pelo proprietário dos direitos autorais, seu agente ou pela lei;</li>
                  <li>Uma declaração, sob pena de perjúrio, de que as informações fornecidas estão corretas e que você é o proprietário dos direitos autorais ou está autorizado a agir em nome do proprietário.</li>
                </ol>
              </div>
              
              <p className="text-superflix-text-light mt-6">
                Envie sua notificação DMCA para: <span className="text-white">dmca@flixhub.com</span>
              </p>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Sobre;
