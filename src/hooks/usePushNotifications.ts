
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: 'default'
  });

  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = async () => {
    try {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      
      if (!isSupported) {
        setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
        return;
      }

      const permission = Notification.permission;
      
      // Check if already subscribed
      let isSubscribed = false;
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await (registration as any).pushManager.getSubscription();
        isSubscribed = !!subscription;
      }

      setState({
        isSupported: true,
        isSubscribed,
        isLoading: false,
        permission
      });

    } catch (error) {
      console.error('Error checking notification support:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!state.isSupported) {
        toast({
          title: 'Notificações não suportadas',
          description: 'Seu navegador não suporta notificações push.',
          variant: 'destructive',
        });
        return false;
      }

      const permission = await Notification.requestPermission();
      
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        await subscribeToPush();
        toast({
          title: 'Notificações ativadas',
          description: 'Você receberá notificações quando o FlixHub estiver aberto.',
        });
        return true;
      } else {
        toast({
          title: 'Permissão negada',
          description: 'Você pode ativar as notificações nas configurações do navegador.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar as notificações.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Para um ambiente real, você precisaria de uma chave VAPID do servidor
      // Por enquanto, vamos apenas registrar para notificações locais
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: null // Em produção, use uma chave VAPID real
      });

      setState(prev => ({ ...prev, isSubscribed: true }));
      
      // Aqui você enviaria a subscription para o seu servidor
      console.log('Push subscription:', subscription);
      
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        setState(prev => ({ ...prev, isSubscribed: false }));
        
        toast({
          title: 'Notificações desativadas',
          description: 'Você não receberá mais notificações push.',
        });
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
    }
  };

  // Função para mostrar uma notificação local (para teste)
  const showTestNotification = () => {
    if (state.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('FlixHub', {
          body: 'Esta é uma notificação de teste!',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'test-notification',
          requireInteraction: false,
          data: {
            url: '/'
          }
        });
      });
    }
  };

  return {
    ...state,
    requestPermission,
    unsubscribeFromPush,
    showTestNotification,
    checkNotificationSupport
  };
};
