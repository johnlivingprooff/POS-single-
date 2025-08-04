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
  showActions = true
}) => {
  const gridCols: { [key: string]: string } = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-2',
    '3': 'grid-cols-3',
    '4': 'grid-cols-4',
    '5': 'grid-cols-5',
    '6': 'grid-cols-6'
  };

  return (
    <div className={`grid gap-4 ${gridCols[String(columns)] || 'grid-cols-3'}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-6 bg-white border rounded-lg shadow-sm">
          {/* Card Image */}
          {showImage && (
            <Skeleton className="w-full h-32 mb-4" variant="rectangular" />
          )}
          
          {/* Card Title */}
          <Skeleton className="w-3/4 h-6 mb-3" />
          
          {/* Card Subtitle */}
          <Skeleton className="w-1/2 h-4 mb-2" />
          
          {/* Card Content Lines */}
          <div className="mb-4 space-y-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-2/3 h-4" />
            <Skeleton className="w-4/5 h-4" />
          </div>
          
          {/* Card Actions */}
          {showActions && (
            <div className="flex space-x-2">
              <Skeleton className="w-16 h-8" variant="rectangular" />
              <Skeleton className="w-16 h-8" variant="rectangular" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CardGridSkeleton;
