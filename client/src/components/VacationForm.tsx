import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { User } from '../types/User';

interface VacationFormProps {
  onSave: (data: any) => void;
  onClose: () => void;
  initialData?: any;
}

const VacationForm: React.FC<VacationFormProps> = ({ onSave, onClose, initialData }) => {
  const [formData, setFormData] = useState(initialData || { pastorId: '', start: '', end: '' });
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, 'members');
      const querySnapshot = await getDocs(usersRef);
      const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(userList);
    };
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pastor = users.find(user => user.id === formData.pastorId);
    const title = pastor ? `Férias do Pastor ${pastor.name}` : 'Férias';
    const pastorName = pastor ? pastor.name : '';
    onSave({ ...formData, title, pastorName });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="pastorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pastor</label>
        <select
          id="pastorId"
          name="pastorId"
          value={formData.pastorId}
          onChange={handleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Selecione um pastor</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label htmlFor="start" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Início</label>
        <input
          type="date"
          id="start"
          name="start"
          value={formData.start}
          onChange={handleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="end" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Fim</label>
        <input
          type="date"
          id="end"
          name="end"
          value={formData.end}
          onChange={handleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Salvar
        </button>
      </div>
    </form>
  );
};

export default VacationForm;
