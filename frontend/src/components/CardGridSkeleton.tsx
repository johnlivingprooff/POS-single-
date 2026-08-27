import React from 'react';
import Skeleton from '../ui/Skeleton';

interface CardGridSkeletonProps {
  count?: number;
  columns?: number;
  showImage?: boolean;
  showActions?: boolean;
}

const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
  columns = 3,
  showImage = false,
  showActions = true,
}) => {
  const gridCols: { [key: string]: string } = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-2',
    '3': 'grid-cols-3',
    '4': 'grid-cols-4',
    '5': 'grid-cols-5',
    '6': 'grid-cols-6',
  };

  return (
    <div className={`grid gap-4 ${gridCols[String(columns)] || 'grid-cols-3'}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-6 bg-card rounded-xl border border-[hsl(var(--card-border))]">
          {showImage && (
            <Skeleton className="w-full h-32 mb-4 rounded-lg" variant="rectangular" />
          )}
          <Skeleton className="w-3/4 h-6 mb-3" />
          <Skeleton className="w-1/2 h-4 mb-2" />
          <div className="mb-4 space-y-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-2/3 h-4" />
            <Skeleton className="w-4/5 h-4" />
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Skeleton className="w-16 h-8 rounded-lg" variant="rectangular" />
              <Skeleton className="w-16 h-8 rounded-lg" variant="rectangular" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CardGridSkeleton;
