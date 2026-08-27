import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  style,
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'rounded',
    text: 'rounded-sm',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  };

  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-muted via-muted/80 to-muted bg-[length:200%_100%] ${variantClasses[variant]} ${className}`}
      style={{ width, height, ...style }}
      data-testid="skeleton"
    />
  );
};

export default Skeleton;
