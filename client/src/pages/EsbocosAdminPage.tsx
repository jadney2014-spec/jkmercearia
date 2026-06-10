import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreateEsbocoDTO,
  Esboco,
  esbocosService,
  StatusEsboco,
  TemaPrincipal,
  TipoCulto,
  EstruturaEsboco,
} from '../services/esbocosService';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

const statusLabels: Record<StatusEsboco, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  ARQUIVADO: 'Arquivado',
};

const temas: { value: TemaPrincipal; label: string }[] = [
  { value: 'FAMILIA', label: 'Família' },
  { value: 'FE', label: 'Fé' },
  { value: 'SANTIDADE', label: 'Santidade' },
  { value: 'AVIVAMENTO', label: 'Avivamento' },
  { value: 'CURAS', label: 'Curas' },
  { value: 'JOVENS', label: 'Jovens' },
  { value: 'MISSOES', label: 'Missões' },
  { value: 'OUTRO', label: 'Outros temas' },
];

const EsbocosAdminPage: React.FC = () => {
  const [esbocos, setEsbocos] = useState<Esboco[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);
  const [criando, setCriando] = useState(false);
  const [mensagemCriacao, setMensagemCriacao] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroTema, setFiltroTema] = useState<string>('TODOS');

  const [form, setForm] = useState<CreateEsbocoDTO>({
    titulo: '',
    temaPrincipal: 'OUTRO',
    textoBiblicoBase: '',
    autorNome: '',
    estrutura: {
      introducao: '',
      topico1: '',
      topico2: '',
      topico3: '',
      topico4: '',
      topico5: '',
      topico6: '',
      topico7: '',
      topico8: '',
      topico9: '',
      conclusao: '',
      apelo: '',
    },
    tipoCulto: 'DOMINGO',
  });

  const handleChange = (field: keyof CreateEsbocoDTO, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEstruturaChange = (field: keyof EstruturaEsboco, value: string) => {
    setForm((prev) => ({
      ...prev,
      estrutura: {
        ...prev.estrutura,
        [field]: value,
      },
    }));
  };

  const carregarEsbocos = async () => {
    try {
      setLoading(true);
      const todos = await esbocosService.listarTodos();
      setEsbocos(todos);
      setErro(null);
    } catch (e) {
      console.error(e);
      setErro('Não foi possível carregar os esboços.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEsbocos();
  }, []);

  const atualizarStatus = async (id: number, status: StatusEsboco) => {
    try {
      setAtualizandoId(id);
      await esbocosService.atualizarStatus(id, { status, aprovadoPor: 'Admin' });
      await carregarEsbocos();
    } catch (e) {
      console.error(e);
      setErro('Não foi possível atualizar o status do esboço.');
    } finally {
      setAtualizandoId(null);
    }
  };

  const removerEsboco = async (id: number) => {
    const confirmar = window.confirm('Tem certeza que deseja remover este esboço definitivamente?');
    if (!confirmar) return;

    try {
      setAtualizandoId(id);
      await esbocosService.removerEsboco(id);
      await carregarEsbocos();
    } catch (e) {
      console.error(e);
      setErro('Não foi possível remover o esboço.');
    } finally {
      setAtualizandoId(null);
    }
  };

  const esbocosFiltrados = esbocos.filter((esboco) => {
    if (filtroStatus !== 'TODOS' && esboco.status !== filtroStatus) return false;
    if (filtroTema !== 'TODOS' && esboco.temaPrincipal !== filtroTema) return false;
    if (termoBusca) {
      const busca = termoBusca.toLowerCase();
      return (
        esboco.titulo.toLowerCase().includes(busca) ||
        esboco.autorNome.toLowerCase().includes(busca) ||
        esboco.textoBiblicoBase.toLowerCase().includes(busca) ||
        esboco.estrutura.introducao.toLowerCase().includes(busca)
      );
    }
    return true;
  });

  const esbocosAprovados = esbocos.filter((e) => e.status === 'APROVADO').length;
  const esbocosPendentes = esbocos.filter((e) => e.status === 'PENDENTE').length;

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gerenciamento de Esboços
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gerencie os esboços de pregação da igreja
              </p>
            </div>
            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center sm:justify-start w-full sm:w-auto"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {mostrarForm ? 'Cancelar' : 'Novo Esboço'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulário de criação */}
        {mostrarForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Novo esboço de pregação
            </h2>

            {mensagemCriacao && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm">
                {mensagemCriacao}
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setErro(null);
                setMensagemCriacao(null);

                if (!form.titulo.trim() || !form.textoBiblicoBase.trim() || !form.autorNome.trim()) {
                  setErro('Preencha pelo menos o título, o texto bíblico base e o nome do autor.');
                  return;
                }

                if (!form.estrutura.introducao.trim()) {
                  setErro('Preencha pelo menos a introdução do esboço.');
                  return;
                }

                try {
                  setCriando(true);
                  await esbocosService.criarEsboco(form);
                  setMensagemCriacao('Esboço criado com sucesso! Agora você pode gerenciá-lo na lista abaixo.');
                  setForm({
                    titulo: '',
                    temaPrincipal: 'OUTRO',
                    textoBiblicoBase: '',
                    autorNome: '',
                    estrutura: {
                      introducao: '',
                      topico1: '',
                      topico2: '',
                      topico3: '',
                      topico4: '',
                      topico5: '',
                      topico6: '',
                      topico7: '',
                      topico8: '',
                      topico9: '',
                      conclusao: '',
                      apelo: '',
                    },
                    tipoCulto: 'DOMINGO',
                  });
                  setMostrarForm(false);
                  await carregarEsbocos();
                } catch (e) {
                  console.error(e);
                  setErro('Não foi possível criar o esboço. Tente novamente mais tarde.');
                } finally {
                  setCriando(false);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => handleChange('titulo', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tema principal *
                  </label>
                  <select
                    value={form.temaPrincipal}
                    onChange={(e) =>
                      handleChange('temaPrincipal', e.target.value as TemaPrincipal)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {temas.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Texto bíblico base *
                  </label>
                  <input
                    type="text"
                    value={form.textoBiblicoBase}
                    onChange={(e) => handleChange('textoBiblicoBase', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: João 3:16"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Autor *
                  </label>
                  <input
                    type="text"
                    value={form.autorNome}
                    onChange={(e) => handleChange('autorNome', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Introdução *
                </label>
                <textarea
                  value={form.estrutura.introducao}
                  onChange={(e) => handleEstruturaChange('introducao', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <div key={num}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tópico {num}
                    </label>
                    <textarea
                      value={form.estrutura[`topico${num}` as keyof EstruturaEsboco] || ''}
                      onChange={(e) =>
                        handleEstruturaChange(`topico${num}` as keyof EstruturaEsboco, e.target.value)
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Conclusão
                  </label>
                  <textarea
                    value={form.estrutura.conclusao || ''}
                    onChange={(e) => handleEstruturaChange('conclusao', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apelo
                  </label>
                  <textarea
                    value={form.estrutura.apelo || ''}
                    onChange={(e) => handleEstruturaChange('apelo', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center"
                >
                  {criando ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Salvando...</span>
                    </>
                  ) : (
                    'Salvar Esboço'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {erro}
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            <div className="sm:col-span-2 lg:col-span-6">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por título, autor ou texto bíblico..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="lg:col-span-3">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="TODOS">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="APROVADO">Aprovado</option>
                <option value="REPROVADO">Reprovado</option>
                <option value="ARQUIVADO">Arquivado</option>
              </select>
            </div>
            <div className="lg:col-span-3">
              <select
                value={filtroTema}
                onChange={(e) => setFiltroTema(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="TODOS">Todos os temas</option>
                {temas.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Esboços</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{esbocos.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprovados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{esbocosAprovados}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <ArchiveBoxIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{esbocosPendentes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Esboços */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : esbocosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {esbocos.length === 0 ? 'Nenhum esboço cadastrado' : 'Nenhum esboço encontrado'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {esbocos.length === 0
                ? 'Comece adicionando esboços de pregação'
                : 'Tente ajustar os filtros ou termo de busca'}
            </p>
            {esbocos.length === 0 && (
              <button
                onClick={() => setMostrarForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center mx-auto"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Adicionar Primeiro Esboço
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {esbocosFiltrados.map((esboco, index) => (
              <motion.div
                key={esboco.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {esboco.titulo}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                        por <span className="font-semibold">{esboco.autorNome}</span>
                      </p>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                        {esboco.textoBiblicoBase}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        esboco.status === 'APROVADO'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : esboco.status === 'PENDENTE'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : esboco.status === 'REPROVADO'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {statusLabels[esboco.status]}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {esboco.estrutura.introducao}
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                      {temas.find((t) => t.value === esboco.temaPrincipal)?.label || esboco.temaPrincipal}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => atualizarStatus(esboco.id, 'APROVADO')}
                      disabled={atualizandoId === esboco.id || esboco.status === 'APROVADO'}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      title="Aprovar"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => atualizarStatus(esboco.id, 'REPROVADO')}
                      disabled={atualizandoId === esboco.id || esboco.status === 'REPROVADO'}
                      className="bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reprovar"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => atualizarStatus(esboco.id, 'ARQUIVADO')}
                      disabled={atualizandoId === esboco.id || esboco.status === 'ARQUIVADO'}
                      className="bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Arquivar"
                    >
                      <ArchiveBoxIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => removerEsboco(esboco.id)}
                      disabled={atualizandoId === esboco.id}
                      className="bg-red-800 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remover"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EsbocosAdminPage;
