// Componente para controle de acesso baseado em roles
import React from 'react';
import { useUserRole } from '../hooks/useUserRole';
import type { UserRole } from '../types/Role';

interface RoleBasedAccessProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  children,
  allowedRoles,
  fallback = null,
}) => {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook para verificar permissão específica
export const useHasPermission = (resource: string, action: string): boolean => {
  const { role } = useUserRole();
  const { hasPermission } = require('../types/Role');
  return hasPermission(role, resource, action);
};
