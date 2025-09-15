import React from 'react';
import Skeleton from '../ui/Skeleton';

interface FormSkeletonProps {
  fields?: number;
  buttons?: number;
  showTitle?: boolean;
}

const FormSkeleton: React.FC<FormSkeletonProps> = ({ 
  fields = 4,
  buttons = 2,
  showTitle = true
}) => {
  return (
    <div className="mobile-form-group">
      {showTitle && (
        <Skeleton className="h-6 w-1/3 mb-6" />
      )}
      
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full mobile-skeleton" variant="rectangular" />
        </div>
      ))}
      
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2 pt-4">
        {Array.from({ length: buttons }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full sm:w-20 mobile-skeleton" variant="rectangular" />
        ))}
      </div>
    </div>
  );
};

export default FormSkeleton;
