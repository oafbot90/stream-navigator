import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Função para gerar UUID compatível com todos os navegadores
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

type Notification = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  date: string;
  read: boolean;
};

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  deleteAllNotifications: () => void;
  deleteReadNotifications: () => void;
  unreadCount: number;
  sendNotificationToUser: (userId: string, notification: Omit<Notification, 'id' | 'date' | 'read'>) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Configurar Service Worker para notificações push
  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      // Verificar se já temos permissão
      if (Notification.permission === 'granted') {
        setupPushNotifications();
      } else if (Notification.permission !== 'denied') {
        // Solicitar permissão após 3 segundos se o usuário estiver na home
        setTimeout(() => {
          if (window.location.pathname === '/' || window.location.pathname === '/home') {
            requestNotificationPermission();
          }
        }, 3000);
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setupPushNotifications();
        toast({
          title: 'Notificações Ativadas!',
          description: 'Você receberá notificações mesmo quando o FlixHub estiver fechado.',
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
    }
  };

  const setupPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker pronto para notificações push');
    } catch (error) {
      console.error('Erro ao configurar notificações push:', error);
    }
  };

  const showNativePushNotification = (notification: Notification) => {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(notification.title, {
          body: notification.message,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `flixhub-${notification.id}`,
          requireInteraction: false,
          data: {
            url: '/',
            notificationId: notification.id
          }
        });
      });
    }
  };

  // Carregar notificações e configurar listener em tempo real
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Configurar listener global para notificações broadcast
      const globalChannel = supabase
        .channel('global-notifications')
        .on('broadcast', { event: 'new-notification' }, (payload) => {
          console.log('Notificação global recebida:', payload);
          const newNotification = payload.payload as Notification;
          
          setNotifications(prev => {
            // Verificar se a notificação já existe
            const exists = prev.find(n => n.id === newNotification.id);
            if (exists) return prev;
            
            const updated = [newNotification, ...prev];
            localStorage.setItem(`notifications-${user.id}`, JSON.stringify(updated));
            
            // Mostrar notificação push nativa se o usuário permitiu
            showNativePushNotification(newNotification);
            
            return updated;
          });

          // Mostrar toast para nova notificação
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        })
        .subscribe((status) => {
          console.log('Canal global de notificações:', status);
        });

      // Configurar listener específico do usuário
      const userChannel = supabase
        .channel(`user-notifications-${user.id}`)
        .on('broadcast', { event: 'new-notification' }, (payload) => {
          console.log('Notificação específica do usuário recebida:', payload);
          const newNotification = payload.payload as Notification;
          
          setNotifications(prev => {
            // Verificar se a notificação já existe
            const exists = prev.find(n => n.id === newNotification.id);
            if (exists) return prev;
            
            const updated = [newNotification, ...prev];
            localStorage.setItem(`notifications-${user.id}`, JSON.stringify(updated));
            
            // Mostrar notificação push nativa se o usuário permitiu
            showNativePushNotification(newNotification);
            
            return updated;
          });

          // Mostrar toast para nova notificação
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        })
        .subscribe((status) => {
          console.log('Canal específico do usuário:', status);
        });

      return () => {
        console.log('Removendo canais de notificação');
        supabase.removeChannel(globalChannel);
        supabase.removeChannel(userChannel);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, toast]);

  const loadNotifications = () => {
    if (!user) return;
    
    const storedNotifications = localStorage.getItem(`notifications-${user.id}`);
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        setNotifications(parsedNotifications);
        
        const unread = parsedNotifications.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Erro ao analisar notificações armazenadas:', error);
      }
    } else {
      // Notificação de boas-vindas para novos usuários
      const welcomeNotification = {
        id: generateUUID(),
        type: 'info' as const,
        title: 'Bem-vindo ao FlixHub!',
        message: 'Aproveite nosso conteúdo exclusivo de filmes, séries e animes.',
        date: new Date().toISOString(),
        read: false,
      };
      
      setNotifications([welcomeNotification]);
      setUnreadCount(1);
      localStorage.setItem(`notifications-${user.id}`, JSON.stringify([welcomeNotification]));
    }
  };

  // Salvar notificações no localStorage sempre que mudarem
  useEffect(() => {
    if (user && notifications.length > 0) {
      localStorage.setItem(`notifications-${user.id}`, JSON.stringify(notifications));
      
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    }
  }, [notifications, user]);

  const addNotification = (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    if (!user) return;
    
    const newNotification = {
      ...notification,
      id: generateUUID(),
      date: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Mostrar notificação push nativa
    showNativePushNotification(newNotification);
    
    toast({
      title: notification.title,
      description: notification.message,
    });
  };

  // Função para enviar notificação via broadcast
  const sendNotificationToUser = async (userId: string, notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    try {
      console.log('Enviando notificação via broadcast:', userId, notification);
      
      const newNotification = {
        ...notification,
        id: generateUUID(),
        date: new Date().toISOString(),
        read: false,
      };

      // Enviar via canal global para alcançar todos os usuários online
      const globalChannel = supabase.channel('global-notifications');
      await globalChannel.send({
        type: 'broadcast',
        event: 'new-notification',
        payload: newNotification
      });

      // Enviar também via canal específico do usuário como backup
      const userChannel = supabase.channel(`user-notifications-${userId}`);
      await userChannel.send({
        type: 'broadcast',
        event: 'new-notification',
        payload: newNotification
      });

      console.log('Notificação enviada com sucesso via broadcast');
    } catch (error) {
      console.error('Falha ao enviar notificação:', error);
      throw error;
    }
  };

  const markAsRead = (id: string) => {
    if (!user) return;
    
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    if (!user) return;
    
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    if (!user) return;
    
    setNotifications(prev => 
      prev.filter(notif => notif.id !== id)
    );
  };

  const deleteAllNotifications = () => {
    if (!user) return;
    
    setNotifications([]);
  };

  // Nova função para excluir apenas notificações lidas
  const deleteReadNotifications = () => {
    if (!user) return;
    
    setNotifications(prev => 
      prev.filter(notif => !notif.read)
    );
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        deleteReadNotifications,
        unreadCount,
        sendNotificationToUser,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
