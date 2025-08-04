import { useToast } from '../components/ToastProvider';

export const useAppToast = () => {
  const toast = useToast();
  
  return {
    showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration?: number, action?: { label: string; onClick: () => void }) => {
      toast[type](message, undefined, action);
    },
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
  };
};
