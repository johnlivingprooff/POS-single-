import React from 'react';
import { toast } from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

// Legacy ToastRoot component for backward compatibility
export const ToastRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Updated useAppToast hook using react-hot-toast
export const useAppToast = () => {
  const showToast = (
    title: string,
    description?: string,
    options?: ToastOptions
  ) => {
    const message = description ? `${title}: ${description}` : title;
    
    // Determine toast type based on title
    if (title.toLowerCase().includes('error') || title.toLowerCase().includes('failed')) {
      toast.error(message, options);
    } else if (title.toLowerCase().includes('success') || title.toLowerCase().includes('completed')) {
      toast.success(message, options);
    } else if (title.toLowerCase().includes('warning') || title.toLowerCase().includes('warn')) {
      toast(message, { 
        icon: '⚠️',
        ...options
      });
    } else {
      toast(message, options);
    }
  };

  return { showToast };
};
