import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string | number;
  name: string;
  type: 'income' | 'expense';
  description?: string;
  color: string;
  transaction_count: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface CategoryListProps {
  categories: Category[];
  loading: boolean;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  loading,
  onEdit,
  onDelete
}) => {
  if (loading && categories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Nenhuma categoria encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <div key={category.id} className="bg-white dark:bg-gray-700 rounded-lg shadow border border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: category.color }}
              ></div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {category.type === 'income' ? 'Receita' : 'Despesa'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(category)}
                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                title="Editar"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(category.id.toString())}
                className="text-danger-600 hover:text-danger-900 dark:text-red-400 dark:hover:text-red-300"
                title="Deletar"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {category.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {category.description}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Transações</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {category.transaction_count}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                R$ {category.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryList;
