import React, { useState, useRef } from 'react';
import { 
  PhotoIcon, 
  XMarkIcon, 
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageData: string | null) => void;
  maxSize?: number; // em MB
  acceptedFormats?: string[];
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  maxSize = 5, // 5MB por padrão
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    // Validar tipo de arquivo
    if (!acceptedFormats.includes(file.type)) {
      setError(`Formato não suportado. Use: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`);
      return;
    }
    
    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return;
    }

    setUploading(true);
    
    try {
      const imageData = await processImage(file);
      setPreview(imageData);
      onImageChange(imageData);
    } catch (err) {
      setError('Erro ao processar imagem');
      console.error('Erro ao processar imagem:', err);
    } finally {
      setUploading(false);
    }
  };

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onImageChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        
        {preview ? (
          <div className="space-y-4">
            {/* Preview da Imagem */}
            <div className="relative group">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg shadow-md"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            
            {/* Botões de Ação */}
            <div className="flex gap-2">
              <button
                onClick={openFileDialog}
                disabled={uploading}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                Trocar Imagem
              </button>
              <button
                onClick={removeImage}
                disabled={uploading}
                className="px-4 py-2 border border-red-300 dark:border-red-600 rounded-md text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <div className="mt-4">
              <button
                onClick={openFileDialog}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                {uploading ? 'Carregando...' : 'Selecionar Imagem'}
              </button>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                ou arraste e solte aqui
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              PNG, JPG, WEBP até {maxSize}MB
            </p>
          </div>
        )}
      </div>

      {/* Status e Erros */}
      {uploading && (
        <div className="flex items-center text-blue-600 dark:text-blue-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm">Processando imagem...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {preview && !error && !uploading && (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          <span className="text-sm">Imagem carregada com sucesso!</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;




