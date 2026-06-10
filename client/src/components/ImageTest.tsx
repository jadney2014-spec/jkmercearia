import React, { useState } from 'react';

const ImageTest: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const convertToBase64 = () => {
    if (!imageFile) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBase64Image(reader.result);
        console.log('Base64 gerado:', reader.result.substring(0, 100) + '...');
        console.log('Tamanho total:', reader.result.length);
      }
      setLoading(false);
    };
    
    reader.onerror = () => {
      console.error('Erro ao converter para base64');
      setLoading(false);
    };
    
    reader.readAsDataURL(imageFile);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Teste de Conversão de Imagem
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecionar Imagem
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {imageFile && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Arquivo: {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
            </p>
            <button
              onClick={convertToBase64}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Convertendo...' : 'Converter para Base64'}
            </button>
          </div>
        )}

        {base64Image && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Imagem Original
              </h3>
              <img
                src={base64Image}
                alt="Teste"
                className="max-w-xs h-auto border border-gray-300 dark:border-gray-600 rounded"
                onLoad={() => console.log('Imagem carregada com sucesso')}
                onError={() => console.log('Erro ao carregar imagem')}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Informações do Base64
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                <p>Tamanho: {base64Image.length} caracteres</p>
                <p>Prefixo: {base64Image.substring(0, 30)}...</p>
                <p>É válido: {base64Image.startsWith('data:') ? 'Sim' : 'Não'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Teste com SafeImage
              </h3>
              <div className="border border-gray-300 dark:border-gray-600 rounded p-4">
                {/* Aqui você pode testar com o SafeImage se quiser */}
                <img
                  src={base64Image}
                  alt="Teste SafeImage"
                  className="max-w-xs h-auto"
                  onLoad={() => console.log('SafeImage carregou com sucesso')}
                  onError={() => console.log('SafeImage falhou')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageTest;





