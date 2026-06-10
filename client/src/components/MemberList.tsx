import React, { memo, useMemo } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import SkeletonLoader from './SkeletonLoader';
import LoadingSpinner from './LoadingSpinner';

// Validação de componentes importados
const validateIcons = () => {
  const icons = { PencilIcon, TrashIcon };
  const invalid = Object.entries(icons).filter(([name, icon]) => {
    const isValid = icon !== undefined && icon !== null && (typeof icon === 'function' || typeof icon === 'object');
    if (!isValid) {
      console.error(`âŒ Ícone ${name} está undefined ou inválido:`, typeof icon, icon);
    }
    return !isValid;
  });
  return invalid.length === 0;
};

// Componentes seguros com fallback
const SafePencilIcon: React.FC<{ className?: string }> = ({ className }) => {
  if (PencilIcon) {
    return React.createElement(PencilIcon as any, { className });
  }
  return <span className={className}>E</span>;
};

const SafeTrashIcon: React.FC<{ className?: string }> = ({ className }) => {
  if (TrashIcon) {
    return React.createElement(TrashIcon as any, { className });
  }
  return <span className={className}>X</span>;
};

interface Member {
  id: number | string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  cpf?: string;
  cell_group?: string;
  photo_url?: string;
  birth_date?: string;
  member_since?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface MemberListProps {
  members: Member[];
  loading: boolean;
  pagination: Pagination;
  onEdit: (member: Member) => void;
  onDelete: (id: string | number) => void;
  isDeleting?: boolean;
  onPageChange: (page: number) => void;
}

const MemberList: React.FC<MemberListProps> = ({
  members,
  loading,
  pagination,
  onEdit,
  onDelete,
  isDeleting = false,
  onPageChange
}) => {
  // Validar ícones
  const iconsValid = validateIcons();
  if (!iconsValid) {
    console.warn('âš ï¸ Alguns ícones não estão disponíveis, usando fallbacks');
  }

  // Validar e filtrar membros válidos
  const validMembers = useMemo(() => {
    if (!Array.isArray(members)) {
      console.error('âŒ members não é um array:', typeof members, members);
      return [];
    }
    return members.filter((member) => {
      if (!member || typeof member !== 'object') {
        console.warn('âš ï¸ Membro inválido encontrado:', member);
        return false;
      }
      if (!member.id || (typeof member.id !== 'string' && typeof member.id !== 'number')) {
        console.warn('âš ï¸ Membro sem ID válido:', member);
        return false;
      }
      if (!member.name || typeof member.name !== 'string') {
        console.warn('âš ï¸ Membro sem nome válido:', member);
        return false;
      }
      return true;
    });
  }, [members]);

  const memoizedMembers = useMemo(() => validMembers, [validMembers]);

  const getInitials = (name: string) => {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : '';
    return (first + last).toUpperCase() || '?';
  };

  // Helper para formatar data sem problemas de timezone
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';
    
    // Se já está no formato YYYY-MM-DD, converter diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
    
    // Tentar converter de outros formatos
    try {
      // Se for string de data, fazer parse manual para evitar problemas de timezone
      const parts = dateString.split(/[-\/]/);
      if (parts.length === 3) {
        let year, month, day;
        
        // Detectar formato (DD/MM/YYYY ou YYYY-MM-DD)
        if (parts[0].length === 4) {
          // YYYY-MM-DD ou YYYY/MM/DD
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
        } else {
          // DD/MM/YYYY ou DD-MM-YYYY
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
        }
        
        // Validar e formatar
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        }
      }
      
      // Fallback: usar Date
      const date = new Date(dateString + 'T00:00:00Z');
      if (!isNaN(date.getTime())) {
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      // Ignorar erros
    }
    
    return '-';
  };

  // Validar componentes
  if (!SkeletonLoader || typeof SkeletonLoader !== 'function' && typeof SkeletonLoader !== 'object') {
    console.error('âŒ SkeletonLoader está undefined ou inválido');
  }

  if (loading && validMembers.length === 0) {
    if (SkeletonLoader && typeof SkeletonLoader === 'function') {
      return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <SkeletonLoader type="table" count={5} />
        </div>
      );
    }
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (validMembers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Nenhum membro encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Aniversário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Membro Desde
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {memoizedMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </div>
                    {member.address && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {member.address}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {member.email && (
                      <div>{member.email}</div>
                    )}
                    {member.phone && (
                      <div className="text-gray-500 dark:text-gray-400">{member.phone}</div>
                    )}
                    {!member.email && !member.phone && (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(member.birth_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(member.member_since)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`badge ${
                    member.status === 'active' ? 'badge-success' : 'badge-danger'
                  }`}>
                    {member.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => {
                    if (member && onEdit && typeof onEdit === 'function') {
                      onEdit(member);
                    }
                  }}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 touch-manipulation"
                  title="Editar"
                  aria-label="Editar membro"
                >
                  <SafePencilIcon className="h-5 w-5 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300" />
                </button>
                <button
                  onClick={() => {
                    if (member && member.id && onDelete && typeof onDelete === 'function') {
                      onDelete(member.id);
                    }
                  }}
                  disabled={isDeleting}
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-danger-600 hover:text-danger-900 dark:text-red-400 dark:hover:text-red-300 touch-manipulation ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Deletar"
                  aria-label="Deletar membro"
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-danger-600"></div>
                  ) : (
                    <SafeTrashIcon className="h-5 w-5 text-danger-600 hover:text-danger-900 dark:text-red-400 dark:hover:text-red-300" />
                  )}
                </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 p-3 sm:p-4">
        {validMembers.map((member) => {
          // Validação adicional dentro do map
          if (!member || !member.id || !member.name) {
            console.warn('âš ï¸ Membro inválido no map mobile:', member);
            return null;
          }
          
          return (
          <div key={member.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 sm:p-5 border border-gray-200 dark:border-gray-600 w-full">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100 flex items-center justify-center text-sm font-semibold">
                {getInitials(member.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold leading-tight text-gray-900 dark:text-white line-clamp-2">
                      {member.name}
                    </h3>
                    {member.address && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-300 line-clamp-2">
                        {member.address}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span className={`badge ${
                      member.status === 'active' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {member.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      if (member && onEdit && typeof onEdit === 'function') {
                        onEdit(member);
                      }
                    }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 touch-manipulation"
                    title="Editar"
                    aria-label="Editar membro"
                  >
                    <SafePencilIcon className="h-5 w-5 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300" />
                  </button>
                  <button
                    onClick={() => {
                      if (member && member.id && onDelete && typeof onDelete === 'function') {
                        onDelete(member.id);
                      }
                    }}
                    disabled={isDeleting}
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-danger-600 hover:text-danger-900 dark:text-red-400 dark:hover:text-red-300 touch-manipulation ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Deletar"
                    aria-label="Deletar membro"
                  >
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-danger-600"></div>
                    ) : (
                      <SafeTrashIcon className="h-5 w-5 text-danger-600 hover:text-danger-900 dark:text-red-400 dark:hover:text-red-300" />
                    )}
                  </button>
                </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {member.phone && (
                    <div className="min-w-0">
                      <span className="text-gray-500 dark:text-gray-300">Email</span>
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {member.email}
                      </p>
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-gray-500 dark:text-gray-300">Aniversário</span>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {formatDate(member.birth_date)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-500 dark:text-gray-300">Membro desde</span>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {formatDate(member.member_since)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {((pagination.page - 1) * pagination.limit) + 1}
                </span>{' '}
                até{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{pagination.total}</span>{' '}
                resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.pages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(MemberList);
