import React from 'react';
import Skeleton from '../../ui/Skeleton';

const CustomersSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-1/2 mb-2" />
    <Skeleton className="h-8 w-full mb-2" />
    {[...Array(10)].map((_, i) => (
      <Skeleton key={i} className="h-10 w-full mb-2" />
    ))}
  </div>
);

export default CustomersSkeleton;
