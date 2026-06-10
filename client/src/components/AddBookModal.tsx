import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, DocumentArrowUpIcon, PhotoIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { booksService, Livro } from '../services/booksService';
import { compressImageFile } from '../utils/imageCompression';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: Livro) => void;
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

const AddBookModal: React.FC<AddBookModalProps> = ({ isOpen, onClose, onAddBook }) => {
  console.log('ðŸ” AddBookModal renderizado - isOpen:', isOpen);
  
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    descricao: '',
    categoria: 'Teologia',
    ano: new Date().getFullYear(),
    paginas: 0,
    tags: '',
    pdfFile: null as File | null,
    capaFile: null as File | null
  });

  const [uploading, setUploading] = useState(false);
  const [optimizingCover, setOptimizingCover] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ano' || name === 'paginas' ? parseInt(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'capa') => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [type === 'pdf' ? 'pdfFile' : 'capaFile']: file
      }));
    }
  };

  const handleOptimizeCover = async () => {
    if (!formData.capaFile) {
      toast.warn('Selecione uma capa antes de otimizar.');
      return;
    }

    setOptimizingCover(true);
    try {
      const before = formData.capaFile;
      const after = await compressImageFile(before, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.86,
        mimeType: 'image/jpeg',
      });

      setFormData(prev => ({
        ...prev,
        capaFile: after,
      }));

      const beforeMb = before.size / 1024 / 1024;
      const afterMb = after.size / 1024 / 1024;
      toast.success(`Capa otimizada: ${beforeMb.toFixed(2)}MB → ${afterMb.toFixed(2)}MB`);
    } catch (e) {
      toast.error('Não foi possível otimizar a capa.');
    } finally {
      setOptimizingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.titulo.trim()) {
      toast.warn('Por favor, digite o título do livro');
      return;
    }
    
    if (!formData.autor.trim()) {
      toast.warn('Por favor, digite o nome do autor');
      return;
    }
    
    if (!formData.descricao.trim()) {
      toast.warn('Por favor, digite a descrição do livro');
      return;
    }
    
    if (!formData.pdfFile) {
      toast.warn('Por favor, selecione o arquivo PDF do livro');
      return;
    }
    
    if (!formData.capaFile) {
      toast.warn('Por favor, selecione a capa do livro');
      return;
    }

    setUploading(true);
    try {
      const novoLivro = await booksService.create(
        {
          titulo: formData.titulo.trim(),
          autor: formData.autor.trim(),
          descricao: formData.descricao.trim(),
          categoria: formData.categoria,
          paginas: formData.paginas || 0,
          ano: formData.ano || new Date().getFullYear(),
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          isNovo: true,
          isDestaque: false,
        },
        formData.pdfFile!,
        formData.capaFile!
      );

      onAddBook(novoLivro);
      
      // Reset form
      setFormData({
        titulo: '',
        autor: '',
        descricao: '',
        categoria: 'Teologia',
        ano: new Date().getFullYear(),
        paginas: 0,
        tags: '',
        pdfFile: null,
        capaFile: null
      });
      
      // Mostrar mensagem de sucesso
      toast.success('Livro adicionado com sucesso à biblioteca!');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = (error as any)?.code ? String((error as any).code) : '';
      toast.error(code ? `Erro ao adicionar livro (${code}): ${message}` : `Erro ao adicionar livro: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Adicionar Novo Livro
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Como adicionar livros reais:
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>- Baixe o PDF do livro da internet</li>
              <li>- Encontre ou crie uma imagem da capa (JPG, PNG)</li>
              <li>- Preencha todas as informações do livro</li>
              <li>- Selecione os arquivos PDF e da capa</li>
              <li>- Clique em "Adicionar Livro"</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título e Autor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título do Livro *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Digite o título do livro"
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
                  min="1000"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="ex: Bíblia, Estudo, Teologia"
              />
            </div>

            {/* Upload de Arquivos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arquivo PDF *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                  <DocumentArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    name="pdfFile"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'pdf')}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.pdfFile ? formData.pdfFile.name : 'Clique para selecionar PDF'}
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capa do Livro *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                  <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    name="capaFile"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'capa')}
                    className="hidden"
                    id="capa-upload"
                  />
                  <label htmlFor="capa-upload" className="cursor-pointer">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.capaFile ? formData.capaFile.name : 'Clique para selecionar imagem'}
                    </span>
                  </label>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleOptimizeCover}
                    disabled={!formData.capaFile || uploading || optimizingCover}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {optimizingCover ? 'Otimizando capa...' : 'Otimizar capa'}
                  </button>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                    Adicionando...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar Livro
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AddBookModal;
