import { useEffect } from 'react';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BellIcon, CheckCircleIcon, EyeIcon, ClockIcon, Settings } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import NotificationBadge from './NotificationBadge';

interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  scheduledAt?: string;
}

export default function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { token } = useAuthStore();
  const navigate = useNavigate();
  
  const { data, refetch } = useQuery<{ notifications: Notification[] }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-notification-dropdown]')) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const recentNotifications = notifications.slice(0, 5); // Show only 5 most recent

  const getNotificationIcon = (type: string) => {
    if (type.includes('delivery')) return '✅';
    if (type.includes('restock')) return '🔄';
    if (type.includes('system')) return '🔔';
    if (type.includes('error')) return '❌';
    return '📢';
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateMessage = (message: string, maxLength = 80) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  return (
    <div className={`relative ${className || ''}`} data-notification-dropdown>
      <NotificationBadge>
        <button 
          onClick={() => setOpen(v => !v)} 
          className="relative p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          title={`${unreadCount} unread notifications`}
        >
          <BellIcon className={`w-6 h-6 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
        </button>
      </NotificationBadge>
      
      {open && (
        <div className="absolute right-0 z-50 w-96 mt-2 bg-white border rounded-lg shadow-xl max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isLoading}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  {markAllAsRead.isLoading ? 'Marking...' : 'Mark all read'}
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/notifications/settings');
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                title="Notification Settings"
              >
                <Settings className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/notifications');
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                <EyeIcon className="w-3 h-3" />
                View All
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead.mutate(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
                        }`}>
                          {truncateMessage(notification.message)}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              notification.type.includes('delivery') ? 'bg-green-100 text-green-700' :
                              notification.type.includes('restock') ? 'bg-yellow-100 text-yellow-700' :
                              notification.type.includes('system') ? 'bg-blue-100 text-blue-700' :
                              notification.type.includes('error') ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {notification.type.replace('_', ' ')}
                            </span>
                            
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead.mutate(notification.id);
                                }}
                                disabled={markAsRead.isLoading}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Mark as read"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 5 && (
            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/notifications');
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all {notifications.length} notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
