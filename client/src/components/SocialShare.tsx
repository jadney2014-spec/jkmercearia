import React, { useState } from 'react';
import {
  ShareIcon,
  PhotoIcon,
  LinkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Event } from '../types/Event';
import SafeImage from './SafeImage';
import { toast } from 'react-toastify';
import { parseDateOnly } from '../utils/dateOnly';

interface SocialShareProps {
  event: Event;
  onClose: () => void;
}

type SocialPlatform = 'instagram' | 'facebook' | 'whatsapp';
type SocialMode = 'feed' | 'stories' | 'message';

const SocialShare: React.FC<SocialShareProps> = ({ event, onClose }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [platformMode, setPlatformMode] = useState<Record<SocialPlatform, SocialMode>>({
    instagram: 'stories',
    facebook: 'feed',
    whatsapp: 'message'
  });
  const [customMessage, setCustomMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const platforms = [
    {
      id: 'instagram' as const,
      name: 'Instagram',
      color: 'bg-pink-500',
      description: 'Compartilhar no Instagram'
    },
    {
      id: 'facebook' as const,
      name: 'Facebook',
      color: 'bg-blue-600',
      description: 'Publicar no Facebook'
    },
    {
      id: 'whatsapp' as const,
      name: 'WhatsApp',
      color: 'bg-green-500',
      description: 'Enviar para grupos do WhatsApp'
    }
  ];

  const togglePlatform = (platformId: SocialPlatform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const generateShareText = () => {
    const date = parseDateOnly(event.date).toLocaleDateString('pt-BR');
    const defaultMessage = `Evento: ${event.title}\n\nData: ${date} às ${event.time}\nLocal: ${event.location}\n\n${event.description || ''}\n\n#IgrejaComunidadeResgate #Evento`;
    
    return customMessage || defaultMessage;
  };

  const getModeLabel = (platform: SocialPlatform, mode: SocialMode) => {
    if (platform === 'whatsapp') return 'Mensagem';
    if (mode === 'feed') return 'Feed';
    if (mode === 'stories') return 'Stories';
    return 'Mensagem';
  };

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  };

  const urlToFile = async (url: string, filename: string): Promise<File> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  };

  const tryOpenInstagramStories = async (): Promise<boolean> => {
    // Deep links only work reliably on mobile devices with the Instagram app installed.
    // We try a couple of known schemes and fall back to opening instagram.com.
    const candidates = ['instagram-stories://share', 'instagram://story-camera'];
    try {
      for (const url of candidates) {
        try {
          window.location.href = url;
          return true;
        } catch {
          // ignore and try next
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const tryNativeShare = async (text: string) => {
    if (!('share' in navigator)) {
      return false;
    }

    try {
      const shareData: ShareData = {
        title: event.title,
        text
      };

      if (event.image) {
        try {
          const fileName = `${String(event.title || 'evento').slice(0, 24).replace(/[^a-z0-9\-_ ]/gi, '').trim() || 'evento'}.png`;
          const file = event.image.startsWith('data:')
            ? await dataUrlToFile(event.image, fileName)
            : await urlToFile(event.image, fileName);

          if ('canShare' in navigator && typeof (navigator as any).canShare === 'function') {
            const canShareFiles = (navigator as any).canShare({ files: [file] });
            if (canShareFiles) {
              shareData.files = [file];
            }
          } else {
            shareData.files = [file];
          }
        } catch {
          // ignora falha de imagem e compartilha apenas o texto
        }
      }

      await navigator.share(shareData);
      return true;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    if (selectedPlatforms.length === 0) {
      toast.warn('Selecione pelo menos uma plataforma para compartilhar');
      return;
    }

    setIsSharing(true);
    const shareText = generateShareText();

    try {
      for (const platform of selectedPlatforms) {
        await shareToPlatform(platform, shareText);
      }
      
      // Simular delay para mostrar feedback
      setTimeout(() => {
        setIsSharing(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      setIsSharing(false);
    }
  };

  const shareToPlatform = async (platform: SocialPlatform, text: string) => {
    const mode = platformMode[platform];
    const header = platform === 'whatsapp'
      ? ''
      : `[Sugestão: ${getModeLabel(platform, mode)}]\n\n`;
    const baseText = header + text;

    // For WhatsApp web fallback, include the image URL so WhatsApp generates a link preview.
    // (wa.me cannot attach images; only native share can send files.)
    const finalText = platform === 'whatsapp' && event.image && !event.image.startsWith('data:')
      ? `${baseText}\n\n${event.image}`
      : baseText;

    const shared = await tryNativeShare(finalText);
    if (shared) return;

    switch (platform) {
      case 'instagram':
        if (mode === 'stories') {
          const opened = await tryOpenInstagramStories();
          if (!opened) {
            window.open('https://www.instagram.com/', '_blank');
          }
          try {
            await navigator.clipboard.writeText(finalText);
            toast.info('Texto copiado. Cole no Stories do Instagram.');
          } catch {
            toast.info('Copie o texto para colar no Stories do Instagram.');
          }
        } else {
          window.open('https://www.instagram.com/', '_blank');
        }
        break;
      
      case 'facebook':
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(finalText)}`;
        window.open(facebookUrl, '_blank');
        break;
      
      case 'whatsapp':
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(finalText)}`;
        window.open(whatsappUrl, '_blank');
        break;
      
      default:
        await navigator.clipboard.writeText(finalText);
    }
  };

  const copyToClipboard = async () => {
    const shareText = generateShareText();
    await navigator.clipboard.writeText(shareText);
    toast.success('Texto copiado para a área de transferência!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <ShareIcon className="h-5 w-5 mr-2" />
            Compartilhar Evento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preview do Evento */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{event.title}</h3>
            <div className="text-sm text-gray-600 dark:text-gray-200 space-y-1">
              <p>Data: {parseDateOnly(event.date).toLocaleDateString('pt-BR')} às {event.time}</p>
              <p>Local: {event.location}</p>
              {event.description && <p>{event.description}</p>}
            </div>
            {event.image && (
              <SafeImage
                src={event.image}
                alt={event.title}
                className="mt-3 w-full h-32 object-cover rounded"
                fallbackText="Imagem do Evento"
                loading="lazy"
              />
            )}
          </div>

          {/* Mensagem Personalizada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Mensagem Personalizada (opcional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Personalize a mensagem que será compartilhada..."
            />
          </div>

          {/* Plataformas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
              Escolha as plataformas:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <div key={platform.id} className="space-y-2">
                  <button
                    onClick={() => togglePlatform(platform.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedPlatforms.includes(platform.id)
                        ? `${platform.color} text-white border-transparent`
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <PhotoIcon className="h-5 w-5" />
                        <div className="font-medium">{platform.name}</div>
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {platform.description}
                      </div>
                    </div>
                  </button>
                  {selectedPlatforms.includes(platform.id) && platform.id !== 'whatsapp' && (
                    <select
                      value={platformMode[platform.id]}
                      onChange={(e) => setPlatformMode(prev => ({ ...prev, [platform.id]: e.target.value as SocialMode }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="feed">Feed</option>
                      <option value="stories">Stories</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview da Mensagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Preview da Mensagem:
            </label>
            <div className="bg-gray-100 dark:bg-gray-900/40 rounded-lg p-3 text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-100">
              {generateShareText()}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Copiar Texto
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing || selectedPlatforms.length === 0}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSharing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Compartilhando...
                  </>
                ) : (
                  <>
                    <ShareIcon className="h-4 w-4 mr-2" />
                    Compartilhar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialShare;
