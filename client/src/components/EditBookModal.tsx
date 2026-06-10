import React, { useState } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { ErrorHandler } from '../utils/errors';
import { toast } from 'react-toastify';
import { booksService } from '../services/booksService';

interface Livro {
  id: string;
  titulo: string;
  autor: string;
  descricao: string;
  categoria: string;
  capa: string;
  pdfUrl: string;
  tamanho: string;
  paginas: number;
  ano: number;
  tags: string[];
  downloads: number;
  avaliacao: number;
  isNovo?: boolean;
  isDestaque?: boolean;
}

interface EditBookModalProps {
  livro: Livro;
  onSave: (livro: Livro) => void;
  onClose: () => void;
}

const categorias = [
  'Teologia',
  'Devocionais',
  'Estudos Bíblicos',
  'Fé',
  'Esperança',
  'Palavras de Coach',
  'Palavras de Esperança',
  'Biografias',
  'História da Igreja',
  'Liderança',
  'Família',
  'Jovens',
  'Crianças'
];

const EditBookModal: React.FC<EditBookModalProps> = ({ livro, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    titulo: livro.titulo,
    autor: livro.autor,
    descricao: livro.descricao,
    categoria: livro.categoria,
    paginas: livro.paginas,
    ano: livro.ano,
    tags: livro.tags.join(', '),
    isNovo: livro.isNovo || false,
    isDestaque: livro.isDestaque || false
  });

  const [uploading, setUploading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.autor.trim() || !formData.descricao.trim()) {
      toast.warn('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setUploading(true);

    (async () => {
      try {
        const livroAtualizado = {
          ...livro,
          titulo: formData.titulo.trim(),
          autor: formData.autor.trim(),
          descricao: formData.descricao.trim(),
          categoria: formData.categoria,
          paginas: formData.paginas || 0,
          ano: formData.ano || new Date().getFullYear(),
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          isNovo: formData.isNovo,
          isDestaque: formData.isDestaque
        };

        await booksService.updateMetadata(livro.id, {
          titulo: livroAtualizado.titulo,
          autor: livroAtualizado.autor,
          descricao: livroAtualizado.descricao,
          categoria: livroAtualizado.categoria,
          paginas: livroAtualizado.paginas,
          ano: livroAtualizado.ano,
          tags: livroAtualizado.tags,
          isNovo: livroAtualizado.isNovo,
          isDestaque: livroAtualizado.isDestaque,
        } as any);

        onSave(livroAtualizado);
        onClose();
      } catch (error) {
        ErrorHandler.handle(error);
      } finally {
        setUploading(false);
      }
    })();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Editar Livro
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título e Autor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Título do livro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Autor *
              </label>
              <input
                type="text"
                name="autor"
                value={formData.autor}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Nome do autor"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição *
            </label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Descrição do livro..."
            />
          </div>

          {/* Categoria, Ano e Páginas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoria *
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ano
              </label>
              <input
                type="number"
                name="ano"
                value={formData.ano}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ano de publicação"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Páginas
              </label>
              <input
                type="number"
                name="paginas"
                value={formData.paginas}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Número de páginas"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Separadas por vírgula (ex: fé, esperança, amor)"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separe as tags por vírgula
            </p>
          </div>

          {/* Opções */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isNovo"
                checked={formData.isNovo}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Marcar como novo
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isDestaque"
                checked={formData.isDestaque}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Marcar como destaque
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBookModal;



