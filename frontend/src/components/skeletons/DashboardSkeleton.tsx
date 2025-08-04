import React from 'react';
import Skeleton from '../../ui/Skeleton';

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-1/3 mb-4" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <Skeleton className="h-40 w-full lg:col-span-2" />
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;
