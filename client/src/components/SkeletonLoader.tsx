import React from 'react';
import Skeleton from './Skeleton';

interface SkeletonLoaderProps {
  type?: 'table' | 'card' | 'list' | 'form' | 'dashboard';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'list', 
  count = 3 
}) => {
  const renderTable = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex space-x-4">
        <Skeleton variant="rectangular" height={40} className="flex-1" />
        <Skeleton variant="rectangular" height={40} className="flex-1" />
        <Skeleton variant="rectangular" height={40} className="flex-1" />
        <Skeleton variant="rectangular" height={40} width={100} />
      </div>
      {/* Rows */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton variant="rectangular" height={48} className="flex-1" />
          <Skeleton variant="rectangular" height={48} className="flex-1" />
          <Skeleton variant="rectangular" height={48} className="flex-1" />
          <Skeleton variant="rectangular" height={48} width={100} />
        </div>
      ))}
    </div>
  );

  const renderCard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <Skeleton variant="rectangular" height={200} className="mb-4" />
          <Skeleton variant="text" height={24} width="80%" className="mb-2" />
          <Skeleton variant="text" height={16} width="60%" />
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" height={20} width="60%" />
            <Skeleton variant="text" height={16} width="40%" />
          </div>
          <Skeleton variant="rectangular" height={36} width={80} />
        </div>
      ))}
    </div>
  );

  const renderForm = () => (
    <div className="space-y-6">
      <Skeleton variant="rectangular" height={48} />
      <Skeleton variant="rectangular" height={48} />
      <Skeleton variant="rectangular" height={120} />
      <Skeleton variant="rectangular" height={48} />
      <div className="flex space-x-4">
        <Skeleton variant="rectangular" height={48} className="flex-1" />
        <Skeleton variant="rectangular" height={48} className="flex-1" />
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <Skeleton variant="text" height={16} width="50%" className="mb-2" />
            <Skeleton variant="text" height={32} width="70%" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <Skeleton variant="text" height={24} width="30%" className="mb-4" />
        <Skeleton variant="rectangular" height={300} />
      </div>
    </div>
  );

  const renderers = {
    table: renderTable,
    card: renderCard,
    list: renderList,
    form: renderForm,
    dashboard: renderDashboard
  };

  return (
    <div className="skeleton-loader" aria-label="Carregando conteúdo...">
      {renderers[type]()}
    </div>
  );
};

export default SkeletonLoader;



