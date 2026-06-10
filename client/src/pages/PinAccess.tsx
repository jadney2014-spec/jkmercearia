import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { usePin } from '../contexts/PinContext';
import { useUserRole } from '../hooks/useUserRole';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function PinAccess() {
  const navigate = useNavigate();
  const query = useQuery();
  const next = query.get('next') || '/tesouraria/dashboard';
  const forceSetup = query.get('setup') === '1';

  const { hasPin, unlock, setup } = usePin();
  const { role, profile, loading: roleLoading } = useUserRole();

  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const shouldSetup = forceSetup || !hasPin;

  const canAccessFinance = role === 'admin' || profile?.financeiro_access === true;
  const canManagePin = role === 'admin';

  useEffect(() => {
    if (roleLoading) return;
    if (!canAccessFinance) {
      navigate('/tesouraria/members', { replace: true });
    }
  }, [roleLoading, canAccessFinance, navigate]);

  const validatePin = (value: string) => /^\d{4,6}$/.test(value);

  const onSubmit = async () => {
    setError(null);

    if (shouldSetup) {
      if (!canManagePin) {
        setError('Apenas administradores podem definir o PIN universal.');
        return;
      }
      if (!validatePin(pin)) {
        setError('Crie um PIN numérico de 4 a 6 dígitos.');
        return;
      }
      if (pin !== pin2) {
        setError('Os PINs não conferem.');
        return;
      }

      setLoading(true);
      try {
        await setup(pin);
        navigate(next, { replace: true });
      } catch {
        setError('Não foi possível salvar o PIN.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!validatePin(pin)) {
      setError('Informe seu PIN (4 a 6 dígitos).');
      return;
    }

    setLoading(true);
    try {
      const ok = await unlock(pin);
      if (!ok) {
        setError('PIN incorreto.');
        return;
      }
      navigate(next, { replace: true });
    } catch {
      setError('Erro ao validar o PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-xl shadow p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {shouldSetup ? 'Criar PIN de acesso' : 'Confirmar PIN'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {shouldSetup
            ? 'Defina um PIN para proteger as áreas financeiras (Dashboard, Transações e Relatórios).'
            : 'Digite seu PIN para acessar a área financeira.'}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PIN</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
              placeholder="4 a 6 dígitos"
              maxLength={6}
            />
          </div>

          {shouldSetup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar PIN</label>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={pin2}
                onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                placeholder="Repita o PIN"
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <Button onClick={onSubmit} loading={loading} className="w-full">
            {shouldSetup ? 'Salvar PIN' : 'Entrar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
