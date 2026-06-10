import React, { useState } from 'react';
import PastorVacationCalendar from '../components/PastorVacationCalendar';
import Modal from '../components/Modal';
import VacationForm from '../components/VacationForm';
import VacationStats from '../components/VacationStats';
import { usePastorVacationData } from '../hooks/usePastorVacationData';

const FeriasPastores: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Carregar dados uma única vez e compartilhar entre componentes
  const { vacations, loading, error, createVacation, deleteVacation, refresh } = usePastorVacationData();

  const handleSave = (data: any) => {
    createVacation({
      ...data,
      start: new Date(data.start),
      end: new Date(data.end),
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Férias dos Pastores</h1>
          <p className="mt-1 text-md text-slate-600 dark:text-gray-400">
            Gerencie as férias dos pastores.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700"
        >
          Adicionar Férias
        </button>
      </div>

      {/* Gráficos de Estatísticas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <VacationStats vacations={vacations} loading={loading} />
      </div>

      {/* Calendário */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Calendário de Férias
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Clique em uma férias no calendário para visualizar detalhes ou removê-la.
        </p>
        <PastorVacationCalendar 
          vacations={vacations} 
          loading={loading} 
          error={error} 
          deleteVacation={deleteVacation}
          onRefresh={refresh}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Férias">
        <VacationForm onSave={handleSave} onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default FeriasPastores;
