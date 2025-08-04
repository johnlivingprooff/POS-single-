import React from 'react';
import Skeleton from '../../ui/Skeleton';

const AuthSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Skeleton className="h-10 w-1/2 mb-4" />
    <Skeleton className="h-12 w-full mb-2" />
    <Skeleton className="h-12 w-full mb-2" />
    <Skeleton className="h-10 w-1/3 mt-4" />
  </div>
);

export default AuthSkeleton;
