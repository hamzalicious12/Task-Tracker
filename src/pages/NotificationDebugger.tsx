import React, { useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

const NotificationDebugger = () => {
  const { notifications, unreadCount, markNotificationAsRead } = useNotifications();
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const handleDebug = () => {
    setDebugInfo(JSON.stringify({
      user: user ? {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email
      } : 'No user logged in',
      notificationsCount: notifications.length,
      unreadCount,
      notifications: notifications.map(n => ({
        id: n._id,
        type: n.type,
        title: n.title,
        read: n.read,
        date: n.createdAt
      }))
    }, null, 2));
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Notification Debugger</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Current Notifications</h2>
            <button 
              onClick={handleDebug}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Refresh Debug Info
            </button>
          </div>
          
          <div className="mb-6">
            <p className="mb-2"><strong>User:</strong> {user?.name} ({user?.role})</p>
            <p className="mb-2"><strong>Total Notifications:</strong> {notifications.length}</p>
            <p><strong>Unread Notifications:</strong> {unreadCount}</p>
          </div>
          
          {notifications.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Notification List</h3>
              <ul className="divide-y divide-gray-200">
                {notifications.map(notification => (
                  <li key={notification._id} className="py-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Unread
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Type: {notification.type} • 
                          Created: {format(new Date(notification.createdAt), 'PPpp')}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationAsRead(notification._id)}
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">No notifications found.</p>
          )}
          
          {debugInfo && (
            <div className="mt-8">
              <h3 className="font-medium text-gray-700 mb-2">Debug Information</h3>
              <div className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
                <pre className="text-xs text-gray-800">{debugInfo}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationDebugger;
