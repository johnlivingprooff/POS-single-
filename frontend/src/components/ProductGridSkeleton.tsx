import React from 'react';
import Skeleton from '../ui/Skeleton';

interface ProductGridSkeletonProps {
  count?: number;
  columns?: 'sm' | 'md' | 'lg' | 'xl';
}

const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({ 
  count = 8,
  columns = 'lg'
}) => {
  const gridClasses = {
    sm: 'grid-cols-1 md:grid-cols-2',
    md: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    lg: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    xl: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
  };

  return (
    <div className={`grid gap-4 ${gridClasses[columns]}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-4 bg-white border rounded-lg shadow-sm">
          {/* Product Image Placeholder */}
          <Skeleton className="w-full h-32 mb-3" variant="rectangular" />
          
          {/* Product Name */}
          <Skeleton className="h-5 w-3/4 mb-2" />
          
          {/* SKU */}
          <Skeleton className="h-4 w-1/2 mb-3" />
          
          {/* Price */}
          <Skeleton className="h-6 w-1/3 mb-3" />
          
          {/* Add to Cart Button */}
          <Skeleton className="h-10 w-full" variant="rectangular" />
        </div>
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
