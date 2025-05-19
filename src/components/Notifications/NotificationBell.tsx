import { useState, useRef, useEffect } from 'react';
import { Bell, Calendar, CheckCircle, AlertTriangle, Clock, BookOpen } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Notification } from '@/types';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { notifications, unreadCount, taskCompletionCount, markNotificationAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Debug log to see if notifications are available
  useEffect(() => {
    if (user?.role === 'CEO') {
      console.log('CEO notifications:', notifications);
      console.log('Unread count:', unreadCount);
    }
  }, [notifications, unreadCount, user?.role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'MEETING_SCHEDULED':
      case 'MEETING_UPDATED':
      case 'MEETING_CANCELLED':
        return <Calendar className="h-5 w-5 text-indigo-600" />;
      case 'TASK_ASSIGNED':
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      case 'TASK_UPDATED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'TASK_DUE_SOON':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'ATTENDANCE_REMINDER':
        return <Clock className="h-5 w-5 text-purple-600" />;
      case 'MEETING_REMINDER':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };
  const handleNotificationClick = async (notification: Notification) => {
    await markNotificationAsRead(notification._id);
    
    // Navigate to the relevant page based on notification type
    if (notification.type.startsWith('MEETING_')) {
      navigate(user?.role === 'CEO' ? '/ceo/meetings' : '/director/meetings');
    } else if (notification.type.startsWith('TASK_')) {
      navigate(user?.role === 'CEO' ? '/ceo/departments' : '/director/team');
    } else if (notification.type === 'ATTENDANCE_REMINDER') {
      navigate(user?.role === 'CEO' ? '/ceo/attendance' : '/director/attendance');
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  };
  // Safety check to prevent rendering errors
  const safeUnreadCount = typeof unreadCount === 'number' ? unreadCount : 0;
  const safeTaskCompletionCount = typeof taskCompletionCount === 'number' ? taskCompletionCount : 0;

  return (
    <div className="relative" ref={dropdownRef}>      
      <button
        className="relative p-2 text-gray-600 hover:text-gray-900"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-6 w-6" />
        {safeUnreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {safeUnreadCount}
          </span>
        )}
        {user?.role === 'CEO' && safeTaskCompletionCount > 0 && (
          <span className="absolute bottom-0 right-0 inline-flex items-center justify-center h-3 w-3 bg-green-500 rounded-full transform translate-x-1/2 translate-y-1/2 border border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-[32rem] overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition-colors ${
                    !notification.read && notification.type === 'TASK_UPDATED' && 
                    notification.message.includes('completed') && user?.role === 'CEO'
                      ? 'bg-green-50'
                      : notification.read 
                        ? 'bg-white' 
                        : 'bg-indigo-50'
                  } hover:bg-gray-50`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 pt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 ml-2">
                          {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;