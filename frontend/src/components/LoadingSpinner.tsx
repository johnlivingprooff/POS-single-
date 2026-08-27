import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  variant?: 'default' | 'overlay';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text,
  variant = 'default',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card rounded-xl border border-[hsl(var(--card-border))] shadow-lg p-6 flex flex-col items-center space-y-3">
          <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
          {text && (
            <span className={cn(textSizeClasses[size], 'text-card-foreground')}>{text}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
      {text && (
        <span className={cn(textSizeClasses[size], 'text-muted-foreground')}>{text}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
