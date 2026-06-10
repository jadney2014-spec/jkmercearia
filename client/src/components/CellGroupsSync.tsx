import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import storage from '../utils/storage';

interface SyncStatus {
  lastSync: string | null;
  isSyncing: boolean;
  hasChanges: boolean;
}

const CellGroupsSync: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    isSyncing: false,
    hasChanges: false
  });

  useEffect(() => {
    // Verificar status de sincronização
    const lastSync = storage.getString('cellGroupsLastSync');
    setSyncStatus(prev => ({
      ...prev,
      lastSync
    }));

    // Verificar se há mudanças não sincronizadas
    checkForChanges();
  }, []);

  const checkForChanges = () => {
    const cellGroups = storage.getJSON<any[]>('cellGroups');
    const publicCellGroups = storage.getJSON<any[]>('publicCellGroups');

    if (cellGroups && publicCellGroups) {
      // Comparar timestamps ou conteúdo
      const hasChanges = cellGroups.some((group: any) => {
        const publicGroup = publicCellGroups.find((pg: any) => pg.id === group.id);
        return !publicGroup || publicGroup.updatedAt !== group.updatedAt;
      });

      setSyncStatus(prev => ({
        ...prev,
        hasChanges
      }));
    }
  };

  const syncToPublic = () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const cellGroups = storage.getJSON<any[]>('cellGroups');
      if (cellGroups && Array.isArray(cellGroups)) {
        // Converter para formato público
        const publicGroups = cellGroups.map((group: any) => ({
          id: group.id,
          title: group.title,
          subtitle: group.subtitle,
          description: group.description,
          image: group.image || '', // Incluir imagem na sincronização
          icon: group.icon?.name || group.icon || 'UserGroupIcon',
          color: group.color,
          members: 0, // Sempre mostrar 0 para não exibir quantidade
          meetings: group.meetings,
          location: group.location,
          leader: group.leader,
          features: [], // Sempre array vazio para não exibir atividades
          isPopular: group.isPopular,
          isActive: group.isActive,
          maxMembers: group.maxMembers,
          updatedAt: group.updatedAt
        }));

        const timestamp = new Date().toISOString();

        // Salvar versão pública
        storage.setJSON('publicCellGroups', publicGroups);
        storage.setString('cellGroupsLastSync', timestamp);

        setSyncStatus({
          lastSync: timestamp,
          isSyncing: false,
          hasChanges: false
        });

        toast.success('Grupos celulares sincronizados com sucesso!');
      } else {
        toast.info('Nenhum grupo para sincronizar.');
        setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      }
    } catch (error) {
      // Fallback para grupos padrão se houver erro
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      toast.error('Erro ao sincronizar grupos celulares');
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Nunca sincronizado';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {syncStatus.isSyncing ? (
              <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
            ) : syncStatus.hasChanges ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Sincronização de Grupos Celulares
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Última sincronização: {formatLastSync(syncStatus.lastSync)}
            </p>
            {syncStatus.hasChanges && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Há mudanças não sincronizadas
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={syncToPublic}
          disabled={syncStatus.isSyncing}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {syncStatus.isSyncing ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Sincronizar
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CellGroupsSync;
