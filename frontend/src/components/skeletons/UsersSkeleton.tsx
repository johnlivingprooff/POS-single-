import React from 'react';
import Skeleton from '../../ui/Skeleton';

const UsersSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-1/2 mb-4" />
    <Skeleton className="h-8 w-full mb-2" />
    {[...Array(8)].map((_, i) => (
      <Skeleton key={i} className="h-12 w-full mb-2" />
    ))}
  </div>
);

export default UsersSkeleton;
