import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { usePin } from '../contexts/PinContext';
import Modal from './Modal';
import Button from './Button';

export default function PinProtectedRoute({ children }: { children: React.ReactElement }) {
  const { hasPin, unlocked, unlock, setup } = usePin();
  const { role, profile, loading } = useUserRole();
  const navigate = useNavigate();

  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return null;
  }

  const canAccessFinance = role === 'admin' || profile?.financeiro_access === true;
  const isAdmin = role === 'admin';
  const shouldSetup = !hasPin;
  const canManagePin = isAdmin || (canAccessFinance && shouldSetup);
  const showModal = !canAccessFinance || !unlocked;

  const validatePin = (value: string) => /^\d{4,6}$/.test(value);

  const title = !canAccessFinance
    ? 'Acesso negado'
    : shouldSetup
      ? canManagePin
        ? 'Criar PIN de acesso'
        : 'PIN necessário'
      : 'Confirmar PIN';

  const description = !canAccessFinance
    ? 'Você não tem permissão para acessar o financeiro. Peça ao administrador para liberar seu acesso.'
    : shouldSetup
      ? canManagePin
        ? 'Defina um PIN universal para proteger as áreas financeiras.'
        : 'O PIN universal ainda não foi definido. Peça para um administrador configurar.'
      : 'Digite o PIN universal para acessar a área financeira.';

  const onClose = () => {
    setError(null);
    setPin('');
    setPin2('');
    navigate('/tesouraria/members', { replace: true });
  };

  const onSubmit = async () => {
    setError(null);

    if (!validatePin(pin)) {
      setError(shouldSetup ? 'Crie um PIN numérico de 4 a 6 dígitos.' : 'Informe seu PIN (4 a 6 dígitos).');
      return;
    }

    if (shouldSetup) {
      if (!canManagePin) {
        setError('Você não tem permissão para definir o PIN universal.');
        return;
      }
      if (pin !== pin2) {
        setError('Os PINs não conferem.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (shouldSetup) {
        await setup(pin);
      } else {
        const ok = await unlock(pin);
        if (!ok) {
          setError('PIN incorreto.');
          return;
        }
      }

      setPin('');
      setPin2('');
      setError(null);
    } catch {
      setError(shouldSetup ? 'Não foi possível salvar o PIN.' : 'Erro ao validar o PIN.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {canAccessFinance && unlocked ? children : null}
      <Modal isOpen={showModal} onClose={onClose} title={title}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>

          {!canAccessFinance ? null : shouldSetup && !canManagePin ? (
            <div className="text-sm text-gray-700 dark:text-gray-200">
              Você não tem permissão para configurar o PIN.
            </div>
          ) : (
            <>
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
            </>
          )}

          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Voltar
            </Button>
            {!canAccessFinance ? null : (
              <Button onClick={onSubmit} loading={submitting} disabled={shouldSetup && !canManagePin}>
                {shouldSetup ? 'Salvar PIN' : 'Entrar'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
