import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReleaseNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  tmdb_id: string;
  poster: string | null;
  air_date: string;
  date: string;
  read: boolean;
}

interface CalendarNotificationsData {
  success: boolean;
  today: string;
  total_releases: number;
  favorite_matches: number;
  notifications: ReleaseNotification[];
  hot_releases: ReleaseNotification[];
}

export function useCalendarNotifications() {
  const { user } = useAuth();
  const [data, setData] = useState<CalendarNotificationsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: responseData, error: fnError } = await supabase.functions.invoke(
        'calendar-notifications',
        {
          body: {},
        }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      setData(responseData);

      // Show browser notification if there are favorite matches
      if (responseData?.notifications?.length > 0 && Notification.permission === 'granted') {
        const notification = responseData.notifications[0];
        
        // Check if we already showed this notification today
        const shownKey = `notification_shown_${notification.id}`;
        if (!localStorage.getItem(shownKey)) {
          new Notification(notification.title, {
            body: notification.message,
            icon: notification.poster || '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: `release-${notification.tmdb_id}`,
          });
          localStorage.setItem(shownKey, 'true');
        }
      }

      return responseData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(message);
      console.error('Error fetching calendar notifications:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchNotifications();
    
    // Check for new releases every hour
    const interval = setInterval(fetchNotifications, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications, user?.id]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchNotifications,
  };
}
