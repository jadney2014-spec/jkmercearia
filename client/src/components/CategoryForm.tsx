import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string | number;
  name: string;
  type: 'income' | 'expense';
  description?: string;
  color: string;
  default_amount?: number; // Adicionado
}

interface CategoryFormProps {
  category?: Category | null;
  onSave: (data: any) => void;
  onClose: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
    description: '',
    color: '#3B82F6',
    default_amount: 0, // Adicionado
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Removido colorOptions não utilizado

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        type: category.type || 'income',
        description: category.description || '',
        color: category.color || '#3B82F6',
        default_amount: category.default_amount || 0, // Adicionado
      });
    }
  }, [category]);

  // Auto-scroll para campo ativo quando teclado aparece (mobile)
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (window.innerWidth <= 640) {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'default_amount' ? parseFloat(value) || 0 : value // Converte para número se for default_amount
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.type) {
      newErrors.type = 'Tipo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-[100dvh] pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full w-full max-h-[95vh] flex flex-col m-2 sm:m-0">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white pr-2">
                  {category ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 touch-manipulation"
                  aria-label="Fechar"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-5 overflow-y-auto flex-1">
                {/* Nome e Tipo */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className={`input mt-1 ${errors.name ? 'border-red-500' : ''}`}
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={handleInputFocus}
                      placeholder="Nome da categoria"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo *
                    </label>
                    <select
                      id="type"
                      name="type"
                      className={`input mt-1 ${errors.type ? 'border-red-500' : ''}`}
                      value={formData.type}
                      onChange={handleChange}
                      onFocus={handleInputFocus}
                    >
                      <option value="income">Receita</option>
                      <option value="expense">Despesa</option>
                    </select>
                    {errors.type && (
                      <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label htmlFor="description" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="input mt-1 min-h-[100px] resize-y"
                    value={formData.description}
                    onChange={handleChange}
                    onFocus={handleInputFocus}
                    placeholder="Descrição da categoria..."
                  />
                </div>

                {/* Valor Padrão (default_amount) */}
                <div>
                  <label htmlFor="default_amount" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor Padrão (opcional)
                  </label>
                  <input
                    type="number"
                    id="default_amount"
                    name="default_amount"
                    className="input mt-1"
                    value={formData.default_amount}
                    onChange={handleChange}
                    onFocus={handleInputFocus}
                    placeholder="Ex: 100.00"
                    step="0.01" // Permite valores decimais
                  />
                </div>

                {/* Cor */}
                <div>
                  <label htmlFor="color" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cor
                  </label>
                  <input
                    type="text"
                    name="color"
                    id="color"
                    value={formData.color}
                    onChange={handleChange}
                    onFocus={handleInputFocus}
                    required
                    className="input mt-1"
                    placeholder="#RRGGBB"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3 sm:gap-0 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                className="btn btn-primary sm:ml-3 sm:w-auto w-full min-h-[44px]"
              >
                {category ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary mt-3 sm:mt-0 sm:w-auto w-full min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
