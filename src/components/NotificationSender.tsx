
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, Send, Users, UserCheck } from 'lucide-react';

interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_audience: 'all' | 'premium' | 'vip' | 'active' | 'expired';
}

const NotificationSender: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notification, setNotification] = useState<NotificationData>({
    title: '',
    message: '',
    type: 'info',
    target_audience: 'all'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSendNotification = async () => {
    if (!notification.title.trim() || !notification.message.trim()) {
      toast({
        title: 'Erro',
        description: 'Título e mensagem são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          ...notification,
          admin_id: user?.id,
          admin_email: user?.email
        }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Notificação enviada para ${data.users_count} usuários`,
      });

      // Reset form
      setNotification({
        title: '',
        message: '',
        type: 'info',
        target_audience: 'all'
      });

    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar a notificação',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAudienceBadge = (audience: string) => {
    switch (audience) {
      case 'all':
        return <Badge className="bg-blue-600"><Users className="w-3 h-3 mr-1" />Todos os usuários</Badge>;
      case 'premium':
        return <Badge className="bg-purple-600">Usuários Premium</Badge>;
      case 'vip':
        return <Badge className="bg-yellow-600">Usuários VIP</Badge>;
      case 'active':
        return <Badge className="bg-green-600"><UserCheck className="w-3 h-3 mr-1" />Usuários Ativos</Badge>;
      case 'expired':
        return <Badge variant="destructive">Usuários Expirados</Badge>;
      default:
        return <Badge variant="outline">{audience}</Badge>;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <Card className="bg-superflix-dark border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Enviar Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-white">Título</Label>
          <Input
            id="title"
            value={notification.title}
            onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Digite o título da notificação"
            className="bg-superflix-darker border-gray-700 text-white"
          />
        </div>

        <div>
          <Label htmlFor="message" className="text-white">Mensagem</Label>
          <Textarea
            id="message"
            value={notification.message}
            onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Digite a mensagem da notificação"
            className="bg-superflix-darker border-gray-700 text-white min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type" className="text-white">Tipo</Label>
            <Select
              value={notification.type}
              onValueChange={(value: any) => setNotification(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="bg-superflix-darker border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-superflix-darker border-gray-700">
                <SelectItem value="info" className="flex items-center">
                  <span className="text-blue-500 mr-2">●</span> Informação
                </SelectItem>
                <SelectItem value="success" className="flex items-center">
                  <span className="text-green-500 mr-2">●</span> Sucesso
                </SelectItem>
                <SelectItem value="warning" className="flex items-center">
                  <span className="text-yellow-500 mr-2">●</span> Aviso
                </SelectItem>
                <SelectItem value="error" className="flex items-center">
                  <span className="text-red-500 mr-2">●</span> Erro
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="audience" className="text-white">Público-alvo</Label>
            <Select
              value={notification.target_audience}
              onValueChange={(value: any) => setNotification(prev => ({ ...prev, target_audience: value }))}
            >
              <SelectTrigger className="bg-superflix-darker border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-superflix-darker border-gray-700">
                <SelectItem value="all">Todos os usuários</SelectItem>
                <SelectItem value="premium">Usuários Premium</SelectItem>
                <SelectItem value="vip">Usuários VIP</SelectItem>
                <SelectItem value="active">Usuários Ativos</SelectItem>
                <SelectItem value="expired">Usuários Expirados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 bg-superflix-darker rounded-lg border border-gray-700">
          <h4 className="text-white font-medium mb-2">Prévia da Notificação</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${getTypeColor(notification.type)}`}>●</span>
              <span className="text-white font-medium">
                {notification.title || 'Título da notificação'}
              </span>
            </div>
            <p className="text-superflix-text-light text-sm">
              {notification.message || 'Mensagem da notificação aparecerá aqui...'}
            </p>
            <div className="flex justify-between items-center">
              {getAudienceBadge(notification.target_audience)}
              <span className="text-xs text-superflix-text-muted">
                Agora mesmo
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSendNotification}
          disabled={isLoading || !notification.title.trim() || !notification.message.trim()}
          className="w-full bg-superflix-primary hover:bg-superflix-primary/90"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar Notificação
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationSender;
