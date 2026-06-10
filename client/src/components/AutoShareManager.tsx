import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { eventsAPI } from '../services/api';
import { Event } from '../types/Event';
import { toast } from 'react-toastify';
import storage from '../utils/storage';
import { parseDateOnly } from '../utils/dateOnly';

interface AutoShareSettings {
  enabled: boolean;
  platforms: {
    instagram: boolean;
    facebook: boolean;
    whatsapp: boolean;
  };
  scheduleTime: string; // Horário para compartilhar automaticamente
  messageTemplate: string;
}

interface AutoShareManagerProps {
  event: Event;
  onClose: () => void;
}

const AutoShareManager: React.FC<AutoShareManagerProps> = ({ event, onClose }) => {
  const [settings, setSettings] = useState<AutoShareSettings>({
    enabled: false,
    platforms: {
      instagram: false,
      facebook: false,
      whatsapp: false
    },
    scheduleTime: '',
    messageTemplate: `Evento: ${event.title}\n\nData: {date} às {time}\nLocal: {location}\n\n{description}\n\n#IgrejaComunidadeResgate #Evento`
  });

  const [isScheduled, setIsScheduled] = useState(false);
  const [timeUntilShare, setTimeUntilShare] = useState<string>('');

  useEffect(() => {
    // Carregar configurações salvas do armazenamento local
    const savedSettings = storage.getJSON<AutoShareSettings>(`autoShare_${event.id}`);
    if (savedSettings) {
      setSettings(savedSettings);
    }

    // Calcular tempo até o compartilhamento
    if (settings.enabled && settings.scheduleTime) {
      const now = new Date();
      const eventDate = parseDateOnly(event.date);
      const [hours, minutes] = settings.scheduleTime.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (eventDate > now) {
        setIsScheduled(true);
        updateTimeUntilShare(eventDate);
      }
    }
  }, [event.id, settings.enabled, settings.scheduleTime]);

  const updateTimeUntilShare = (targetDate: Date) => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        clearInterval(interval);
        setIsScheduled(false);
        // Executar compartilhamento automático
        executeAutoShare();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeUntilShare(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeUntilShare(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilShare(`${minutes}m`);
      }
    }, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  };

  const executeAutoShare = async () => {
    try {
      const message = generateMessage();
      
      // Compartilhar nas plataformas selecionadas
      if (settings.platforms.instagram) {
        await shareToInstagram(message);
      }
      if (settings.platforms.facebook) {
        await shareToFacebook(message);
      }
      if (settings.platforms.whatsapp) {
        await shareToWhatsApp(message);
      }

      console.log('Compartilhamento automático executado');
    } catch (error) {
      console.error('Erro no compartilhamento automático:', error);
    }
  };

  const generateMessage = () => {
    const date = parseDateOnly(event.date).toLocaleDateString('pt-BR');
    return settings.messageTemplate
      .replace('{date}', date)
      .replace('{time}', event.time)
      .replace('{location}', event.location)
      .replace('{description}', event.description || '');
  };

  const shareToInstagram = async (message: string) => {
    const candidates = ['instagram-stories://share', 'instagram://story-camera'];
    let opened = false;
    for (const url of candidates) {
      try {
        window.location.href = url;
        opened = true;
        break;
      } catch {
        // ignore
      }
    }

    if (!opened) {
      const instagramUrl = `https://www.instagram.com/`;
      window.open(instagramUrl, '_blank');
    }

    try {
      await navigator.clipboard.writeText(message);
      toast.info('Texto copiado. Cole no Stories do Instagram.');
    } catch {
      toast.info('Copie o texto para colar no Stories do Instagram.');
    }
  };

  const shareToFacebook = async (message: string) => {
    // Compartilhar no Facebook
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(message)}`;
    window.open(facebookUrl, '_blank');
  };

  const shareToWhatsApp = async (message: string) => {
    // Compartilhar no WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSaveSettings = () => {
    storage.setJSON(`autoShare_${event.id}`, settings);
    onClose();
  };

  const handlePlatformToggle = (platform: keyof typeof settings.platforms) => {
    setSettings(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: !prev.platforms[platform]
      }
    }));
  };

  const handleTestShare = () => {
    const message = generateMessage();
    toast.info(
      <div className="whitespace-pre-line text-sm">
        {`Preview da mensagem:\n\n${message}`}
      </div>,
      { autoClose: 5000 }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Compartilhamento Automático
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status do Agendamento */}
          {isScheduled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    Compartilhamento Agendado
                  </h3>
                  <p className="text-sm text-blue-600">
                    Será compartilhado em: {timeUntilShare}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Configurações */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Ativar Compartilhamento Automático
              </label>
              <button
                onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.enabled && (
              <>
                {/* Horário do Compartilhamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário para Compartilhar
                  </label>
                  <input
                    type="time"
                    value={settings.scheduleTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, scheduleTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O evento será compartilhado automaticamente neste horário
                  </p>
                </div>

                {/* Plataformas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plataformas
                  </label>
                  <div className="space-y-2">
                    {Object.entries(settings.platforms).map(([platform, enabled]) => (
                      <label key={platform} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => handlePlatformToggle(platform as keyof typeof settings.platforms)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {platform === 'instagram' ? 'Instagram' : 
                           platform === 'facebook' ? 'Facebook' : 'WhatsApp'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Template da Mensagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template da Mensagem
                  </label>
                  <textarea
                    value={settings.messageTemplate}
                    onChange={(e) => setSettings(prev => ({ ...prev, messageTemplate: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Use {date}, {time}, {location}, {description} como variáveis"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variáveis disponíveis: {'{date}'}, {'{time}'}, {'{location}'}, {'{description}'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview da Mensagem
            </label>
            <div className="bg-gray-100 rounded-lg p-3 text-sm whitespace-pre-wrap">
              {generateMessage()}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={handleTestShare}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              Testar Compartilhamento
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSettings}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoShareManager;
