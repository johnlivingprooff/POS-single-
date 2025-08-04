import React from 'react';
import Skeleton from '../../ui/Skeleton';

const ReportsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-1/2 mb-4" />
    <Skeleton className="h-8 w-full mb-2" />
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-16 w-full mb-2" />
    ))}
  </div>
);

export default ReportsSkeleton;
