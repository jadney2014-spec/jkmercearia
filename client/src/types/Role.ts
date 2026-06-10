// Tipos para sistema de roles e permissões

export type UserRole = 'membro' | 'lider' | 'admin' | 'secretaria' | 'tesouraria' | 'midia';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  financeiro_access?: boolean;
  ministerio_id?: string; // ID do ministério (para líderes)
  ministerio_nome?: string; // Nome do ministério (para líderes)
  phone?: string;
  photoURL?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Permission {
  resource: string; // 'escalas', 'membros', 'financeiro', etc.
  actions: string[]; // ['read', 'write', 'delete', 'manage']
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  membro: [
    {
      resource: 'escalas',
      actions: ['read_own', 'confirm_presence']
    },
    {
      resource: 'eventos',
      actions: ['read']
    },
    {
      resource: 'atividades',
      actions: ['read']
    }
  ],
  lider: [
    {
      resource: 'escalas',
      actions: ['read', 'write', 'delete', 'manage_own_ministry']
    },
    {
      resource: 'membros',
      actions: ['read_own_ministry', 'write_own_ministry']
    },
    {
      resource: 'eventos',
      actions: ['read', 'write']
    },
    {
      resource: 'atividades',
      actions: ['read', 'write']
    }
  ],
  admin: [
    {
      resource: 'escalas',
      actions: ['read', 'write', 'delete', 'manage']
    },
    {
      resource: 'membros',
      actions: ['read', 'write', 'delete', 'manage']
    },
    {
      resource: 'ministerios',
      actions: ['read', 'write', 'delete', 'manage']
    },
    {
      resource: 'eventos',
      actions: ['read', 'write', 'delete', 'manage']
    },
    {
      resource: 'financeiro',
      actions: ['read', 'write', 'delete', 'manage']
    },
    {
      resource: 'configuracoes',
      actions: ['read', 'write', 'manage']
    }
  ],
  secretaria: [
    {
      resource: 'membros',
      actions: ['read', 'write']
    },
    {
      resource: 'pessoas',
      actions: ['read', 'write']
    },
    {
      resource: 'escalas',
      actions: ['read', 'write']
    },
    {
      resource: 'relatorios_escalas',
      actions: ['read']
    },
    {
      resource: 'ferias_pastores',
      actions: ['read', 'write']
    }
  ],
  tesouraria: [
    {
      resource: 'financeiro',
      actions: ['read', 'write']
    },
    {
      resource: 'relatorios',
      actions: ['read']
    }
  ],
  midia: [
    {
      resource: 'escalas',
      actions: ['read', 'write']
    },
    {
      resource: 'eventos',
      actions: ['read', 'write']
    }
  ]
};

export const hasPermission = (
  role: UserRole,
  resource: string,
  action: string
): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  const resourcePermission = permissions.find(p => p.resource === resource);
  
  if (!resourcePermission) return false;
  
  // Admin tem acesso total
  if (role === 'admin') return true;
  
  // Verificar ação específica
  return resourcePermission.actions.includes(action) || 
         resourcePermission.actions.includes('manage');
};

export const canManageEscalas = (role: UserRole): boolean => {
  return role === 'admin' || role === 'lider';
};

export const canViewAllEscalas = (role: UserRole): boolean => {
  return role === 'admin';
};

export const canManageMembers = (role: UserRole): boolean => {
  return role === 'admin' || role === 'lider';
};
