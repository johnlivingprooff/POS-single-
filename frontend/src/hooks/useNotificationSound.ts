import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api-utils';

interface UseNotificationSoundOptions {
  enabled?: boolean;
  pollingInterval?: number;
}

export const useNotificationSound = (options: UseNotificationSoundOptions = {}) => {
  const { enabled = true, pollingInterval = 30000 } = options;
  const { token } = useAuthStore();
  const previousCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on first render
  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      // Create a subtle notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const createNotificationSound = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      };

      audioRef.current = { play: createNotificationSound } as any;
    }
  }, [enabled]);

  const { data } = useQuery({
    queryKey: ['notification-sound-check'],
    queryFn: async () => {
      const res = await apiFetch('/notifications', token);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    refetchInterval: pollingInterval,
    enabled: enabled && !!token,
  });

  // Check for new notifications and play sound
  useEffect(() => {
    if (data?.notifications) {
      const currentUnreadCount = data.notifications.filter((n: any) => !n.isRead).length;
      
      // Play sound if unread count increased
      if (currentUnreadCount > previousCountRef.current && previousCountRef.current > 0) {
        audioRef.current?.play?.();
      }
      
      previousCountRef.current = currentUnreadCount;
    }
  }, [data]);

  return {
    unreadCount: data?.notifications?.filter((n: any) => !n.isRead).length || 0,
    notifications: data?.notifications || []
  };
};
