
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';

const ContactPage: React.FC = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Mensagem enviada",
        description: "Obrigado por entrar em contato! Responderemos em breve.",
      });
      
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Entre em Contato</h1>
          
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="bg-superflix-dark p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Informações de Contato</h2>
                
                <div className="space-y-4 text-superflix-text-light">
                  <div>
                    <h3 className="text-superflix-primary font-medium mb-1">Email</h3>
                    <p>contato@flixhub.com</p>
                  </div>
                  
                  <div>
                    <h3 className="text-superflix-primary font-medium mb-1">Suporte</h3>
                    <p>suporte@flixhub.com</p>
                  </div>
                  
                  <div>
                    <h3 className="text-superflix-primary font-medium mb-1">Endereço</h3>
                    <p>
                      Avenida Paulista, 1000<br />
                      São Paulo, SP, Brasil<br />
                      CEP: 01310-100
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-superflix-primary font-medium mb-1">Horário de Atendimento</h3>
                    <p>Segunda a Sexta: 9h às 18h</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-3">
              <form onSubmit={handleSubmit} className="bg-superflix-dark p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Envie uma Mensagem</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-superflix-text-light mb-1">Nome</label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-superflix-darker border-gray-700"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-superflix-text-light mb-1">Email</label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-superflix-darker border-gray-700"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-superflix-text-light mb-1">Assunto</label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="bg-superflix-darker border-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-superflix-text-light mb-1">Mensagem</label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={6}
                      className="bg-superflix-darker border-gray-700 resize-none"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-superflix-primary hover:bg-superflix-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Enviar Mensagem
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
