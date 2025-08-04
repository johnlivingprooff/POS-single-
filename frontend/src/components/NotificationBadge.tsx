import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api-utils';

interface NotificationBadgeProps {
  children: React.ReactNode;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ children, className = '' }) => {
  const { token } = useAuthStore();
  
  const { data } = useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      const res = await apiFetch('/notifications', token);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
    enabled: !!token,
  });

  const unreadCount = data?.notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <div className={`relative ${className}`}>
      {children}
      {unreadCount > 0 && (
        <span className="absolute -top-0 -right-0 inline-flex items-center justify-center min-w-[18px] h-[18px] text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBadge;
