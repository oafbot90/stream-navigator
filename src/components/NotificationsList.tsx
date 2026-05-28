
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Bell, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_audience: string;
  read: boolean;
  created_at: string;
}

const NotificationsList: React.FC = () => {
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock notifications for now since the table doesn't exist yet
  const fetchNotifications = async () => {
    if (!user || !currentProfile) return;

    try {
      // Simulando notificações até a tabela ser criada
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Bem-vindo ao FlixHub!',
          message: 'Aproveite nosso conteúdo exclusivo de filmes, séries e animes.',
          type: 'info',
          target_audience: 'all',
          read: false,
          created_at: new Date().toISOString()
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, currentProfile]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Mock update until database is ready
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-600';
      case 'warning': return 'bg-yellow-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-blue-600';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-superflix-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-white" />
        <h3 className="text-white font-medium">Notificações</h3>
        {unreadCount > 0 && (
          <Badge className="bg-superflix-primary text-white">
            {unreadCount}
          </Badge>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="bg-superflix-dark border-gray-800">
          <CardContent className="p-6 text-center">
            <Bell className="h-12 w-12 text-superflix-text-muted mx-auto mb-4" />
            <p className="text-superflix-text-muted">Nenhuma notificação encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`bg-superflix-dark border-gray-800 ${
                !notification.read ? 'border-l-4 border-l-superflix-primary' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                      <span className="text-xs text-superflix-text-muted">
                        {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h4 className="text-white font-medium mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-superflix-text-light text-sm">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(notification.id)}
                      className="text-superflix-text-muted hover:text-white"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
