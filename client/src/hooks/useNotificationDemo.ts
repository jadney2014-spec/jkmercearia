import { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

// Hook para demonstrar notificações automáticas
export const useNotificationDemo = () => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Notificação de boas-vindas
    const welcomeTimer = setTimeout(() => {
      addNotification({
        title: 'Bem-vindo ao Sistema de Tesouraria!',
        message: 'Seu dashboard está atualizado com as últimas informações financeiras.',
        type: 'info',
        priority: 'medium',
        category: 'system',
        autoHide: true,
        duration: 5000
      });
    }, 2000);

    // Notificação de meta atingida (exemplo)
    const goalTimer = setTimeout(() => {
      addNotification({
        title: 'ðŸŽ‰ Meta Atingida!',
        message: 'Você alcançou 80% da sua meta mensal de receitas!',
        type: 'achievement',
        priority: 'high',
        category: 'goals',
        action: {
          label: 'Ver Detalhes',
          onClick: () => console.log('Ver detalhes da meta')
        }
      });
    }, 8000);

    // Notificação de transação importante
    const transactionTimer = setTimeout(() => {
      addNotification({
        title: 'Nova Transação Importante',
        message: 'Receita de R$ 5.000,00 registrada com sucesso.',
        type: 'success',
        priority: 'medium',
        category: 'financial',
        autoHide: true,
        duration: 4000
      });
    }, 12000);

    // Notificação de alerta
    const alertTimer = setTimeout(() => {
      addNotification({
        title: 'Alerta de Saldo Baixo',
        message: 'Seu saldo atual está abaixo do recomendado. Considere revisar as despesas.',
        type: 'warning',
        priority: 'urgent',
        category: 'financial',
        persistent: true,
        action: {
          label: 'Revisar Despesas',
          onClick: () => console.log('Ir para despesas')
        }
      });
    }, 15000);

    return () => {
      clearTimeout(welcomeTimer);
      clearTimeout(goalTimer);
      clearTimeout(transactionTimer);
      clearTimeout(alertTimer);
    };
  }, [addNotification]);
};

export default useNotificationDemo;
