import React from 'react';
import Skeleton from '../ui/Skeleton';

interface ProductGridSkeletonProps {
  count?: number;
  columns?: 'sm' | 'md' | 'lg' | 'xl';
}

const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
  count = 8,
  columns = 'lg',
}) => {
  const gridClasses = {
    sm: 'grid-cols-1 md:grid-cols-2',
    md: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    lg: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    xl: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  };

  return (
    <div className={`grid gap-3 ${gridClasses[columns]}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col p-4 bg-card rounded-xl border border-[hsl(var(--card-border))]"
        >
          <div className="flex items-start justify-between mb-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4 mb-1" />
          <Skeleton className="h-3 w-1/2 mb-3" />
          <div className="mt-auto">
            <div className="flex items-baseline justify-between mb-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
