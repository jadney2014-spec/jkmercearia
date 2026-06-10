import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import { useUserRole } from '../hooks/useUserRole';
import LoadingSpinner from '../components/LoadingSpinner';

type FinanceUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  financeiro_access: boolean;
};

export default function FinanceAccessAdmin() {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<FinanceUserRow[]>([]);
  const [search, setSearch] = useState('');
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});

  const isAdmin = role === 'admin';

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin) {
      navigate('/tesouraria/members', { replace: true });
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const ref = collection(db, 'user_profiles');
        const q = query(ref, orderBy('name', 'asc'));
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: String(data.name || ''),
            email: String(data.email || ''),
            role: String(data.role || 'membro'),
            financeiro_access: !!data.financeiro_access,
          } as FinanceUserRow;
        });
        setUsers(rows);
      } catch (e) {
        console.error('Erro ao carregar user_profiles:', e);
        toast.error('Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [roleLoading, isAdmin, navigate]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const toggleAccess = async (userId: string, enabled: boolean) => {
    setSavingIds((p) => ({ ...p, [userId]: true }));
    try {
      const ref = doc(db, 'user_profiles', userId);
      await updateDoc(ref, {
        financeiro_access: enabled,
        updatedAt: new Date(),
      } as any);

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, financeiro_access: enabled } : u)));
      toast.success(enabled ? 'Acesso ao financeiro liberado' : 'Acesso ao financeiro removido');
    } catch (e) {
      console.error('Erro ao atualizar financeiro_access:', e);
      toast.error('Erro ao salvar permissão');
    } finally {
      setSavingIds((p) => ({ ...p, [userId]: false }));
    }
  };

  if (roleLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acesso ao Financeiro</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecione quais usuários podem acessar Dashboard, Transações e Relatórios (via PIN universal).
          </p>
        </div>

        <div className="w-full sm:w-80">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
            placeholder="Buscar por nome, email ou função"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Função</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Financeiro</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const saving = !!savingIds[u.id];
                  const disabled = saving;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {u.name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{u.email || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{u.role}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={u.financeiro_access}
                            disabled={disabled}
                            onChange={(e) => toggleAccess(u.id, e.target.checked)}
                            className="h-5 w-5"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-200">
                            {u.financeiro_access ? 'Liberado' : 'Bloqueado'}
                          </span>
                        </label>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
