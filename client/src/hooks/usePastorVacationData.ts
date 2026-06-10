import { useState, useEffect, useCallback } from 'react';
import { pastorVacationAPI, VacationEvent } from '../services/pastorVacationAPI';

export const usePastorVacationData = () => {
  const [vacations, setVacations] = useState<VacationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVacations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const vacationData = await pastorVacationAPI.getVacations();
      setVacations(vacationData);
    } catch (err) {
      setError('Failed to load vacations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVacations();
  }, [loadVacations]);

  const createVacation = useCallback(async (vacationData: Omit<VacationEvent, 'id'>) => {
    try {
      setLoading(true);
      await pastorVacationAPI.createVacation(vacationData);
      loadVacations();
    } catch (err) {
      setError('Failed to create vacation.');
    } finally {
      setLoading(false);
    }
  }, [loadVacations]);

  const updateVacation = useCallback(async (id: string, vacationData: Partial<Omit<VacationEvent, 'id'>>) => {
    try {
      setLoading(true);
      await pastorVacationAPI.updateVacation(id, vacationData);
      setVacations(prev => prev.map(v => v.id === id ? { ...v, ...vacationData, id, start: v.start, end: v.end, title: v.title, pastorId: v.pastorId } : v));
    } catch (err) {
      setError('Failed to update vacation.');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVacation = useCallback(async (id: string) => {
    try {
      // Otimização: remoção otimista (não mostrar loading)
      setVacations(prev => prev.filter(v => v.id !== id));
      await pastorVacationAPI.deleteVacation(id);
    } catch (err) {
      // Em caso de erro, recarregar para restaurar estado
      setError('Failed to delete vacation.');
      loadVacations();
    }
  }, [loadVacations]);

  return {
    vacations,
    loading,
    error,
    refresh: loadVacations,
    createVacation,
    updateVacation,
    deleteVacation,
  };
};
