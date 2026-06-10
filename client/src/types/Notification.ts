// Tipos para sistema de notificações

export type NotificationType = 
  | 'nova_escala'
  | 'lembrete_escala_24h'
  | 'lembrete_escala_1h'
  | 'confirmacao_presenca'
  | 'escala_atualizada'
  | 'escala_cancelada'
  | 'substituicao_solicitada'
  | 'substituicao_aprovada'
  | 'substituicao_recebida'
  | 'novo_evento'
  | 'atividade_igreja';

export type NotificationPriority = 'low' | 'normal' | 'high';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    escalaId?: string;
    eventoId?: string;
    ministerioId?: string;
    [key: string]: any;
  };
  read: boolean;
  priority: NotificationPriority;
  createdAt: Date | string;
  scheduledFor?: Date | string; // Para notificações agendadas
}

export interface NotificationSettings {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  notificationTypes: {
    [key in NotificationType]: boolean;
  };
  reminder24h: boolean;
  reminder1h: boolean;
}

export const NOTIFICATION_TEMPLATES: Record<NotificationType, {
  title: string;
  message: (data?: any) => string;
  priority: NotificationPriority;
}> = {
  nova_escala: {
    title: 'Nova Escala Criada',
    message: (data) => `Você foi escalado para ${data?.ministerioNome || 'o ministério'} em ${data?.data || 'data não informada'}`,
    priority: 'high',
  },
  lembrete_escala_24h: {
    title: 'Lembrete: Escala Amanhã',
    message: (data) => `Lembrete: Você tem uma escala amanhã às ${data?.horario || 'horário não informado'} - ${data?.ministerioNome || 'Ministério'}`,
    priority: 'normal',
  },
  lembrete_escala_1h: {
    title: 'Lembrete: Escala em 1 hora',
    message: (data) => `Sua escala começa em 1 hora! ${data?.ministerioNome || 'Ministério'} às ${data?.horario || 'horário não informado'}`,
    priority: 'high',
  },
  confirmacao_presenca: {
    title: 'Presença Confirmada',
    message: (data) => `${data?.membroNome || 'Membro'} confirmou presença na escala de ${data?.ministerioNome || 'Ministério'}`,
    priority: 'normal',
  },
  escala_atualizada: {
    title: 'Escala Atualizada',
    message: (data) => `A escala de ${data?.ministerioNome || 'Ministério'} foi atualizada`,
    priority: 'normal',
  },
  escala_cancelada: {
    title: 'Escala Cancelada',
    message: (data) => `A escala de ${data?.ministerioNome || 'Ministério'} foi cancelada`,
    priority: 'high',
  },
  substituicao_solicitada: {
    title: 'Substituição Solicitada',
    message: (data) => `${data?.membroNome || 'Um membro'} solicitou substituição na escala de ${data?.ministerioNome || 'Ministério'}. ${data?.motivo ? `Motivo: ${data.motivo}` : ''}`,
    priority: 'high',
  },
  substituicao_aprovada: {
    title: 'Substituição Aprovada',
    message: (data) => `Sua solicitação de substituição foi aprovada. ${data?.substitutoNome || 'Substituto'} assumirá sua escala em ${data?.ministerioNome || 'Ministério'}`,
    priority: 'normal',
  },
  substituicao_recebida: {
    title: 'Você Foi Escalado por Substituição',
    message: (data) => `Você foi escalado para substituir ${data?.membroOriginalNome || 'um membro'} na escala de ${data?.ministerioNome || 'Ministério'} em ${data?.data || 'data não informada'}`,
    priority: 'high',
  },
  novo_evento: {
    title: 'Novo Evento',
    message: (data) => `Novo evento: ${data?.titulo || 'Evento'} em ${data?.data || 'data não informada'}`,
    priority: 'normal',
  },
  atividade_igreja: {
    title: 'Atividade da Igreja',
    message: (data) => data?.mensagem || 'Nova atividade disponível',
    priority: 'low',
  },
};
