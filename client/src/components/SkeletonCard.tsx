import React from 'react';
import Skeleton from './Skeleton';

interface SkeletonCardProps {
  delay?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ delay = 0 }) => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse"
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" height={16} width="33%" />
        <Skeleton variant="rectangular" height={32} width={64} />
      </div>
      <div className="space-y-3">
        <Skeleton variant="text" height={12} width="100%" />
        <Skeleton variant="text" height={12} width="66%" />
        <Skeleton variant="text" height={12} width="50%" />
      </div>
    </div>
  );
};

export default SkeletonCard;
