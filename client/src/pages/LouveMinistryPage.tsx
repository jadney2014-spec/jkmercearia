import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  Bars3Icon,
  MusicalNoteIcon,
  UserGroupIcon,
  UsersIcon,
  Squares2X2Icon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  PuzzlePieceIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { ministeriosAPI } from '../services/scalesAPI';
import { membersAPI } from '../services/api';
import type { Ministerio } from '../types/Scale';
import { useNavigate } from 'react-router-dom';

type Tab = 'info' | 'members';

const LouveMinistryPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(true);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [selectedMinisterioId, setSelectedMinisterioId] = useState<string>('');
  const [members, setMembers] = useState<any[]>([]);

  const selectedMinisterio = useMemo(() => {
    return ministerios.find((m) => m.id === selectedMinisterioId) || null;
  }, [ministerios, selectedMinisterioId]);

  const load = async () => {
    try {
      setLoading(true);
      const [mins, memResp] = await Promise.all([ministeriosAPI.getMinisterios(), membersAPI.getMembers()]);
      setMinisterios(mins);
      setMembers(memResp.data?.members || []);
      if (!selectedMinisterioId && mins.length > 0) {
        setSelectedMinisterioId(mins[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ministryMembers = useMemo(() => {
    if (!selectedMinisterio) return [];
    const ids = new Set(selectedMinisterio.membros_habilitados || []);
    return members.filter((m) => ids.has(m.id));
  }, [members, selectedMinisterio]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-6">
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Menu"
              onClick={() => navigate('/tesouraria/dashboard')}
            >
              <Bars3Icon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ministério</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Comunidade Cristã Resgate</p>
            </div>
          </div>
          <button
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Atualizar"
            onClick={load}
          >
            <ArrowPathIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="mt-4">
          <select
            value={selectedMinisterioId}
            onChange={(e) => setSelectedMinisterioId(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl px-4 py-3 outline-none border border-transparent focus:border-primary-500"
          >
            {ministerios.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700">
          <div className="h-32 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-600/30 via-slate-900 to-slate-950" />
          <div className="p-4 -mt-10">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <MusicalNoteIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold">{selectedMinisterio?.nome || 'Selecione um ministério'}</div>
                <div className="text-sm text-slate-200">{selectedMinisterio?.descricao || ' '}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 flex gap-1">
          <button
            onClick={() => setTab('info')}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              tab === 'info'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Informações
          </button>
          <button
            onClick={() => setTab('members')}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              tab === 'members'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Membros ({selectedMinisterio?.membros_habilitados?.length || 0})
          </button>
        </div>
      </div>

      {tab === 'info' && (
        <div className="px-4 mt-4 space-y-3">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              <button
                className="w-full flex items-center justify-between px-4 py-4"
                onClick={() => navigate('/tesouraria/ministries')}
              >
                <div className="flex items-center gap-3">
                  <UsersIcon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Equipes</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
              <button
                className="w-full flex items-center justify-between px-4 py-4"
                onClick={() => navigate('/tesouraria/ministries')}
              >
                <div className="flex items-center gap-3">
                  <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Funções</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
              <button
                className="w-full flex items-center justify-between px-4 py-4"
                onClick={() => navigate('/tesouraria/ministries')}
              >
                <div className="flex items-center gap-3">
                  <Squares2X2Icon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Classificações</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
              <button
                className="w-full flex items-center justify-between px-4 py-4"
                onClick={() => navigate('/tesouraria/ministries')}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Administradores</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
              <button
                className="w-full flex items-center justify-between px-4 py-4"
                onClick={() => navigate('/tesouraria/ministries')}
              >
                <div className="flex items-center gap-3">
                  <PuzzlePieceIcon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Módulos</span>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="px-4 mt-4">
          {ministryMembers.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-300 font-medium">Nenhum membro encontrado</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Adicione membros habilitados no ministério.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {ministryMembers.map((m) => {
                  const initials = (m.name || '')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p: string) => p[0]?.toUpperCase())
                    .join('');

                  return (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-4">
                      <div className="h-10 w-10 rounded-full bg-primary-600/20 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold">
                        {initials || 'M'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{m.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{m.email || ' '}</div>
                      </div>
                      <button className="text-gray-400" aria-label="Opções">⋮</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/tesouraria/ministries')}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-2xl bg-primary-600 text-white shadow-lg flex items-center justify-center md:bottom-6"
        aria-label="Adicionar"
      >
        <PlusIcon className="h-7 w-7" />
      </button>
    </div>
  );
};

export default LouveMinistryPage;
