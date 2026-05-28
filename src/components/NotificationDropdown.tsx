
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, X, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/contexts/NotificationsContext";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from "@/hooks/use-mobile";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface NotificationDropdownProps {
  isMobile?: boolean;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isMobile: isMobileProp }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAllNotifications,
    deleteReadNotifications
  } = useNotifications();
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobileFromHook = useIsMobile();
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileFromHook;

  // Handler for marking all as read
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAllAsRead();
  };

  // Handler for clearing all notifications
  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteAllNotifications();
    setIsOpen(false);
  };

  // Handler for clearing read notifications
  const handleClearRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteReadNotifications();
  };

  // Handler for when notification is clicked
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  // Handler for delete button
  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification(id);
  };

  // Function to format the date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data desconhecida';
    }
  };

  // Get the notification type color
  const getNotificationColor = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  const readNotificationsCount = notifications.filter(n => n.read).length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative mr-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96 bg-superflix-dark border-gray-800" align="end">
        <div className="flex justify-between items-center p-2">
          <DropdownMenuLabel className="text-lg">Notificações</DropdownMenuLabel>
          <div className="flex space-x-1">
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs hover:bg-superflix-primary hover:text-white"
                  onClick={handleMarkAllAsRead}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Marcar lidas
                </Button>
                {readNotificationsCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs hover:bg-orange-600 hover:text-white"
                    onClick={handleClearRead}
                  >
                    <BookOpen className="mr-1 h-3.5 w-3.5" />
                    Limpar lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs hover:bg-red-600 hover:text-white"
                  onClick={handleClearAll}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Limpar tudo
                </Button>
              </>
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="bg-gray-800" />
        
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400">
            <Bell className="mx-auto h-8 w-8 mb-2 opacity-30" />
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] overflow-y-auto">
            {notifications.map((notification: NotificationItem) => (
              <DropdownMenuItem
                key={notification.id}
                className={`px-4 py-3 flex flex-col items-start gap-1 cursor-pointer border-b border-gray-800 last:border-0 focus:bg-superflix-dark/50 ${
                  !notification.read ? 'bg-superflix-dark/30' : ''
                }`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex justify-between w-full items-start">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getNotificationColor(notification.type)}`} />
                    <span className="font-medium">{notification.title}</span>
                    {!notification.read && (
                      <span className="text-xs bg-superflix-primary text-white px-1.5 py-0.5 rounded-full">
                        Novo
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white -mt-1 -mr-1"
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{notification.message}</p>
                <span className="text-xs text-gray-400">{formatDate(notification.date)}</span>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
