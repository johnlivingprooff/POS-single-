import React from 'react';
import Skeleton from '../ui/Skeleton';

const DashboardPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <Skeleton className="h-8 w-48" />
      
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-6 bg-white border rounded-lg shadow-sm">
            <div className="flex items-center">
              <Skeleton variant="circular" className="w-12 h-12 mr-4" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts/Graphs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Card */}
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-64 w-full" variant="rectangular" />
          </div>
          
          {/* Another Chart/Table */}
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton variant="circular" className="w-8 h-8" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column - Sidebar Content */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" variant="rectangular" />
              ))}
            </div>
          </div>
          
          {/* Alerts */}
          <div className="p-6 bg-white border rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <Skeleton variant="circular" className="w-5 h-5 mr-2" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-3 border rounded">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPageSkeleton;
