import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon, DocumentTextIcon, CalendarIcon, BookOpenIcon, VideoCameraIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const SafeAnimatePresence = AnimatePresence as unknown as React.FC<React.PropsWithChildren<any>>;

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'page' | 'event' | 'book' | 'esboco' | 'video';
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SearchModalProps {
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Mock data - em produção, isso viria de uma API ou busca no conteúdo
  const searchableContent: SearchResult[] = [
    { id: '1', title: 'Sobre Nós', description: 'Conheça nossa história, missão e valores', type: 'page', url: '/sobre', icon: DocumentTextIcon },
    { id: '2', title: 'Conecte-se', description: 'Encontre uma célula e faça parte da nossa família', type: 'page', url: '/conecte', icon: MapPinIcon },
    { id: '3', title: 'Assista', description: 'Vídeos de cultos e mensagens', type: 'video', url: '/assista', icon: VideoCameraIcon },
    { id: '4', title: 'Contribua', description: 'Apoie nossa missão e ministérios', type: 'page', url: '/contribua', icon: DocumentTextIcon },
    { id: '5', title: 'Localização', description: 'Encontre nossa igreja', type: 'page', url: '/localizacoes', icon: MapPinIcon },
    { id: '6', title: 'Esboços', description: 'Esboços de pregação e estudos', type: 'esboco', url: '/esbocos', icon: BookOpenIcon },
    { id: '7', title: 'Biblioteca Digital', description: 'Livros e recursos espirituais', type: 'book', url: '/biblioteca', icon: BookOpenIcon },
    { id: '8', title: 'Eventos', description: 'Próximos eventos e atividades', type: 'event', url: '/eventos', icon: CalendarIcon },
  ];

  useEffect(() => {
    // Focus input when modal opens
    inputRef.current?.focus();

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Simulate search delay for better UX
    const timer = setTimeout(() => {
      const term = searchTerm.toLowerCase();
      const filtered = searchableContent.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );
      setResults(filtered);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleResultClick = (url: string) => {
    navigate(url);
    onClose();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      page: 'Página',
      event: 'Evento',
      book: 'Livro',
      esboco: 'Esboço',
      video: 'Vídeo'
    };
    return labels[type] || 'Conteúdo';
  };

    return (
      <SafeAnimatePresence initial={false}>
        {onClose && ( // Assuming SearchModal is only rendered when it should be open
          <motion.div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black bg-opacity-50"
            />
  
            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 p-4">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar páginas, eventos, livros, esboços..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={onClose}
                    className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Fechar"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
  
                {/* Results */}
                <div className="max-h-96 overflow-y-auto p-4">
                  {isSearching ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Buscando...
                    </div>
                  ) : searchTerm.trim() === '' ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Digite para buscar</p>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>Nenhum resultado encontrado para "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {results.map((result) => {
                        const Icon = result.icon;
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result.url)}
                            className="w-full text-left p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-start space-x-4"
                          >
                            <div className="flex-shrink-0 mt-1">
                              <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {result.title}
                                </h3>
                                <span className="ml-2 px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded">
                                  {getTypeLabel(result.type)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {result.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
  
                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Pressione <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> para fechar
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </SafeAnimatePresence>
    );};

export default SearchModal;

