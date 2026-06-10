import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { devotionalsAPI } from '../services/devotionalsAPI';

export default function DevocionalHistorico() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const todayId = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await devotionalsAPI.listRecent(60);
      setItems(rows);
    } catch (e) {
      console.error('Erro ao carregar devocionais:', e);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpenIcon className="h-7 w-7" />
            Histórico de Devocionais
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Últimos devocionais publicados</p>
        </div>

        <Link
          to="/tesouraria/devocional"
          className="px-4 py-2 min-h-[44px] rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
        >
          Voltar
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">Nenhum devocional encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((d) => (
            <Link
              key={d.id}
              to={d.date === todayId ? '/tesouraria/devocional' : `/tesouraria/devocional?date=${encodeURIComponent(d.date)}`}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:shadow-md transition-shadow"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
              <div className="mt-1 font-semibold text-gray-900 dark:text-white">{d.title}</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{d.verseRef}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 min-h-[44px] rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
}
