import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import { useUserRole } from '../hooks/useUserRole';
import LoadingSpinner from '../components/LoadingSpinner';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: 'membro' | 'lider' | 'admin' | 'secretaria' | 'tesouraria' | 'midia' | string;
};

export default function AdminsAdmin() {
  const navigate = useNavigate();
  const { role, loading: roleLoading, profile } = useUserRole();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
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
          } as UserRow;
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
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }, [users, search]);

  const adminCount = useMemo(() => users.filter((u) => u.role === 'admin').length, [users]);

  const setUserRole = async (userId: string, newRole: 'membro' | 'lider' | 'admin' | 'secretaria' | 'tesouraria' | 'midia') => {
    setSavingIds((p) => ({ ...p, [userId]: true }));
    try {
      const current = users.find((u) => u.id === userId);
      if (current?.role === 'admin' && newRole !== 'admin' && adminCount <= 1) {
        toast.error('Não é possível remover o último administrador.');
        return;
      }

      const ref = doc(db, 'user_profiles', userId);
      await updateDoc(ref, {
        role: newRole,
        updatedAt: new Date(),
      } as any);

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast.success('Permissões atualizadas');
    } catch (e) {
      console.error('Erro ao atualizar role:', e);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administradores</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gerencie quem é administrador. Por segurança, não é permitido remover o último admin.
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
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200">
          Total de admins: <span className="font-semibold">{adminCount}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Função</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
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
                  const isRowLastAdmin = u.role === 'admin' && adminCount <= 1;
                  const isSelf = profile?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{u.name || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{u.email || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={u.role}
                          disabled={saving || isRowLastAdmin}
                          onChange={(e) => setUserRole(u.id, e.target.value as any)}
                          className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="membro">membro</option>
                          <option value="lider">lider</option>
                          <option value="secretaria">secretaria</option>
                          <option value="tesouraria">tesouraria</option>
                          <option value="midia">midia</option>
                          <option value="admin">admin</option>
                        </select>
                        {isRowLastAdmin && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Último admin
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          className="text-sm font-medium text-primary-600 dark:text-primary-400 disabled:opacity-50"
                          disabled={saving}
                          onClick={() => setUserRole(u.id, u.role === 'admin' ? 'membro' : 'admin')}
                        >
                          {u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                        </button>
                        {isSelf && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Você</div>
                        )}
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
