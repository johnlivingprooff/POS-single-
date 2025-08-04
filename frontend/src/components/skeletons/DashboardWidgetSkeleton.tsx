import React from 'react';
import Skeleton from '../../ui/Skeleton';

const DashboardWidgetSkeleton: React.FC = () => (
  <div className="space-y-2">
    <Skeleton className="h-8 w-1/2 mb-2" />
    <Skeleton className="h-6 w-full mb-2" />
    <Skeleton className="h-6 w-full mb-2" />
  </div>
);

export default DashboardWidgetSkeleton;
