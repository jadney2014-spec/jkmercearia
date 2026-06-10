import React, { useState } from 'react';
import { ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const LouveMessagesPage: React.FC = () => {
  const [message, setMessage] = useState('');

  return (
    <div className="pb-20 md:pb-6">
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mensagens</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Comunidade Cristã Resgate</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-44 h-44 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
          <ChatBubbleOvalLeftEllipsisIcon className="h-14 w-14 text-gray-400" />
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">Nenhuma mensagem encontrada</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Este módulo pode ser ativado futuramente para comunicação por ministério.
        </p>
      </div>

      <div className="fixed bottom-16 left-0 right-0 md:static md:bottom-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite aqui..."
            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl px-4 py-3 outline-none"
          />
          <button
            type="button"
            className="h-12 w-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center"
            onClick={() => setMessage('')}
            aria-label="Enviar"
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LouveMessagesPage;
