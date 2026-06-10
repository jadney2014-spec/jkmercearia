import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

export interface BirthdayMember {
  id: string;
  name: string;
  birth_date: string;
  phone?: string;
  email?: string;
}

export interface BirthdayNotification {
  id: string;
  type: 'daily' | 'weekly';
  date: string;
  timestamp: Timestamp;
  today: Array<{ id: string; name: string }>;
  thisWeek: Array<{ id: string; name: string }>;
  todayCount: number;
  weekCount: number;
  emailSent: boolean;
  whatsappSent: boolean;
  status: 'completed' | 'error' | 'pending';
  error?: string;
}

export interface UseBirthdaysReturn {
  todayBirthdays: BirthdayMember[];
  weekBirthdays: BirthdayMember[];
  loading: boolean;
  error: string | null;
  lastNotification: BirthdayNotification | null;
  refresh: () => Promise<void>;
}

export function useBirthdays(): UseBirthdaysReturn {
  const [todayBirthdays, setTodayBirthdays] = useState<BirthdayMember[]>([]);
  const [weekBirthdays, setWeekBirthdays] = useState<BirthdayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<BirthdayNotification | null>(null);

  const calculateBirthdays = useCallback(async () => {
    try {
      setError(null);

      // Buscar todos os membros (filtrar birth_date no código)
      const membersRef = collection(db, 'members');
      const membersSnapshot = await getDocs(membersRef);

      if (membersSnapshot.empty) {
        setTodayBirthdays([]);
        setWeekBirthdays([]);
        setLoading(false);
        return;
      }

      const allMembers: BirthdayMember[] = [];
      membersSnapshot.forEach(doc => {
        try {
          const data = doc.data();
          // Validar dados antes de adicionar
          if (data && data.birth_date && typeof data.birth_date === 'string') {
            const birthDate = new Date(data.birth_date);
            // Verificar se a data é válida
            if (!isNaN(birthDate.getTime())) {
              allMembers.push({
                id: doc.id || String(Date.now()),
                name: data.name || 'Nome não informado',
                birth_date: data.birth_date,
                phone: data.phone || undefined,
                email: data.email || undefined
              });
            }
          }
        } catch (err) {
          console.warn('Erro ao processar membro:', doc.id, err);
        }
      });

      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();

      // Calcular início e fim da semana (domingo a sábado)
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Filtrar aniversariantes do dia
      const todayBdays = allMembers.filter(member => {
        try {
          if (!member.birth_date) return false;
          const birthDate = new Date(member.birth_date);
          if (isNaN(birthDate.getTime())) return false;
          const birthMonth = birthDate.getMonth() + 1;
          const birthDay = birthDate.getDate();
          return birthMonth === currentMonth && birthDay === currentDay;
        } catch {
          return false;
        }
      });

      // Filtrar aniversariantes da semana
      const weekBdays = allMembers.filter(member => {
        try {
          if (!member.birth_date) return false;
          const birthDate = new Date(member.birth_date);
          if (isNaN(birthDate.getTime())) return false;
          const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          return thisYear >= startOfWeek && thisYear <= endOfWeek;
        } catch {
          return false;
        }
      });

      // Remover duplicatas
      const weekOnlyBdays = weekBdays.filter(
        member => !todayBdays.some(todayMember => todayMember.id === member.id)
      );

      setTodayBirthdays(todayBdays);
      setWeekBirthdays(weekOnlyBdays);
      setLoading(false);
    } catch (err: any) {
      console.error('Erro ao calcular aniversários:', err);
      setError(err.message || 'Erro ao carregar aniversários');
      setLoading(false);
    }
  }, []);

  const loadLastNotification = useCallback(async () => {
    try {
      const notificationsRef = collection(db, 'birthday_notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('type', '==', 'daily'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      // Índice composto necessário (Firestore):
      // collection: birthday_notifications
      // fields:
      // - type ASC
      // - timestamp DESC
      
      const snapshot = await getDocs(notificationsQuery);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setLastNotification({
          id: doc.id,
          ...doc.data()
        } as BirthdayNotification);
      }
    } catch (err: any) {
      if (err?.code === 'failed-precondition' || String(err?.message || '').toLowerCase().includes('requires an index')) {
        console.warn('Query de birthday_notifications precisa de índice composto. Última notificação ficará indisponível até criar o índice.', {
          code: err?.code,
          message: err?.message,
        });
        return;
      }

      console.error('Erro ao carregar última notificação:', err);
    }
  }, []);

  useEffect(() => {
    if (!db) {
      console.warn('Firestore não está disponível');
      setLoading(false);
      return;
    }

    calculateBirthdays();
    loadLastNotification();

    // Escutar mudanças em tempo real com debounce
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      const membersRef = collection(db, 'members');
      const unsubscribe = onSnapshot(
        membersRef, 
        () => {
          // Debounce para evitar muitas atualizações
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          timeoutId = setTimeout(() => {
            calculateBirthdays().catch(err => {
              console.error('Erro ao recalcular aniversários:', err);
            });
          }, 500);
        },
        (error) => {
          console.error('Erro ao escutar mudanças em members:', error);
          // Não definir erro para não quebrar a UI
        }
      );

      let unsubscribeNotifications: (() => void) | null = null;
      
      try {
        const notificationsRef = collection(db, 'birthday_notifications');
        unsubscribeNotifications = onSnapshot(
          query(notificationsRef, orderBy('timestamp', 'desc'), limit(1)),
          (snapshot) => {
            try {
              if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                if (data && data.timestamp) {
                  setLastNotification({
                    id: doc.id,
                    ...data
                  } as BirthdayNotification);
                }
              }
            } catch (err) {
              console.error('Erro ao processar notificação:', err);
            }
          },
          (error) => {
            // Ignorar erros de índice - a query pode não ter índice ainda
            const errorCode = (error as any)?.code as string | undefined;
            if (errorCode === 'failed-precondition' || String((error as any)?.message || '').toLowerCase().includes('requires an index')) {
              return;
            }

            if (errorCode !== 'failed-precondition') {
              console.error('Erro ao escutar mudanças em birthday_notifications:', error);
            }
          }
        );
      } catch (queryError: any) {
        // Se a query falhar (provavelmente por falta de índice), apenas logar
        console.warn('Não foi possível configurar listener de notificações:', queryError.message);
      }

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        unsubscribe();
        if (unsubscribeNotifications) {
          unsubscribeNotifications();
        }
      };
    } catch (error: any) {
      console.error('Erro ao configurar listeners:', error);
      // Não definir erro para não quebrar a UI
    }
  }, [calculateBirthdays, loadLastNotification]);

  const refresh = useCallback(async () => {
    await calculateBirthdays();
    await loadLastNotification();
  }, [calculateBirthdays, loadLastNotification]);

  return {
    todayBirthdays,
    weekBirthdays,
    loading,
    error,
    lastNotification,
    refresh
  };
}

