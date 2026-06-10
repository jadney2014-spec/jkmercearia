import React, { useEffect, useState } from 'react';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { requestNotificationPermission, checkNotificationPermission } from '../utils/fcm';
import { toast } from 'react-toastify';
import Button from './Button';

const NotificationSetup: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setHasPermission(checkNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setHasPermission(true);
        toast.success('Notificações ativadas com sucesso!');
      } else {
        toast.error('Não foi possível ativar as notificações');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao ativar notificações');
    } finally {
      setIsRequesting(false);
    }
  };

  if (hasPermission) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <BellIcon className="h-5 w-5" />
        <span>Notificações ativadas</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleRequestPermission}
      disabled={isRequesting}
      variant="secondary"
      size="sm"
      className="flex items-center gap-2"
    >
      {isRequesting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>Ativando...</span>
        </>
      ) : (
        <>
          <BellSlashIcon className="h-5 w-5" />
          <span>Ativar Notificações</span>
        </>
      )}
    </Button>
  );
};

export default NotificationSetup;
