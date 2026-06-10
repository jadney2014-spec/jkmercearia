import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../firebase/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import Button from '../components/Button';
import { devotionalsAPI } from '../services/devotionalsAPI';

export default function DevocionalAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  const isAdmin = role === 'admin';

  const todayId = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayId);
  const [title, setTitle] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [verseText, setVerseText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (d: string) => {
    setLoading(true);
    try {
      const existing = await devotionalsAPI.getByDate(d);
      setTitle(existing?.title || '');
      setVerseRef(existing?.verseRef || '');
      setVerseText(existing?.verseText || '');
      setImageUrl(existing?.imageUrl || '');
      setBody(existing?.body || '');
    } catch (e) {
      console.error('Erro ao carregar devocional:', e);
      toast.error('Erro ao carregar devocional');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin) {
      navigate('/tesouraria/devocional', { replace: true });
      return;
    }
    load(date);
  }, [roleLoading, isAdmin, navigate]);

  const onChangeDate = (next: string) => {
    setDate(next);
    load(next);
  };

  const onSave = async () => {
    if (!date) {
      toast.error('Selecione a data');
      return;
    }
    if (!title.trim()) {
      toast.error('Informe o título');
      return;
    }
    if (!verseRef.trim()) {
      toast.error('Informe a referência do versículo');
      return;
    }
    if (!body.trim()) {
      toast.error('Escreva o devocional');
      return;
    }

    setSaving(true);
    try {
      await devotionalsAPI.upsert(
        {
          date,
          title: title.trim(),
          verseRef: verseRef.trim(),
          verseText: verseText.trim() || undefined,
          body: body.trim(),
          imageUrl: imageUrl.trim() || undefined,
        },
        { userId: user?.uid }
      );
      toast.success('Devocional salvo');
    } catch (e) {
      console.error('Erro ao salvar devocional:', e);
      toast.error('Erro ao salvar devocional');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!date) return;
    const ok = window.confirm('Deseja excluir o devocional desta data?');
    if (!ok) return;

    setSaving(true);
    try {
      await devotionalsAPI.remove(date);
      toast.success('Devocional removido');
      setTitle('');
      setVerseRef('');
      setVerseText('');
      setImageUrl('');
      setBody('');
    } catch (e) {
      console.error('Erro ao excluir devocional:', e);
      toast.error('Erro ao excluir devocional');
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading) {
    return <div className="text-sm text-gray-600 dark:text-gray-400">Carregando...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpenIcon className="h-7 w-7" />
            Gerenciar Devocional
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Criar/editar por data (1 devocional por dia)</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate('/tesouraria/devocional')}
          >
            Ver hoje
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => onChangeDate(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="Ex: Confiança em Deus"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referência do versículo</label>
            <input
              type="text"
              value={verseRef}
              onChange={(e) => setVerseRef(e.target.value)}
              className="input w-full"
              placeholder="Ex: Salmos 23:1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Texto do versículo (opcional)</label>
            <input
              type="text"
              value={verseText}
              onChange={(e) => setVerseText(e.target.value)}
              className="input w-full"
              placeholder="Ex: O Senhor é o meu pastor..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagem (URL opcional)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="input w-full"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Devocional</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input w-full min-h-[200px]"
            placeholder="Escreva o devocional aqui..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button type="button" variant="danger" onClick={onDelete} disabled={saving}>
            Excluir
          </Button>
          <Button type="button" onClick={onSave} loading={saving}>
            Salvar
          </Button>
        </div>

        {loading ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">Carregando dados...</div>
        ) : null}
      </div>
    </div>
  );
}
