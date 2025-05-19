import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Notification } from '@/types';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/api/notifications';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  taskCompletionCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      // Set the Authorization header explicitly
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No token found - can't fetch notifications");
        return;
      }
      
      const data = await getNotifications();
      console.log("Fetched notifications:", data); // Debug log
      
      // Only update state if we have valid data
      if (Array.isArray(data)) {
        setNotifications(data);
        setError(null);
      } else {
        console.error("Invalid notification data received:", data);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Notification fetch error:', err);
    }
  }, [user]);
  
  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === id ? { ...notification, read: true } : notification
        )
      );
      // Invalidate relevant queries based on notification type
      const notification = notifications.find(n => n._id === id);
      if (notification) {
        switch (notification.type) {
          case 'MEETING_SCHEDULED':
          case 'MEETING_UPDATED':
          case 'MEETING_CANCELLED':
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            break;
          case 'TASK_ASSIGNED':
          case 'TASK_UPDATED':
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            break;
          case 'ATTENDANCE_REMINDER':
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            break;
        }
      }
    } catch (err) {
      setError('Failed to mark notification as read');
      console.error('Mark as read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      setError('Failed to mark all notifications as read');
      console.error('Mark all as read error:', err);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };  useEffect(() => {
    if (user) {
      // Add a small delay to ensure user authentication is fully established
      setTimeout(() => {
        fetchNotifications();
      }, 500);
      
      // Poll for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, user]);
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;
  const taskCompletionCount = notifications 
    ? notifications.filter(n => !n.read && n.type === 'TASK_UPDATED' && n.message.includes('completed')).length 
    : 0;
    
  // Debug notification state
  useEffect(() => {
    if (user) {
      console.log(`User ${user.name} (${user.role}) has ${unreadCount} unread notifications`);
    }
  }, [unreadCount, user]);
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        taskCompletionCount,
        markNotificationAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
        clearNotifications,
        error
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
