import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { Event } from '../types/Event';
import SafeImage from './SafeImage';
import { eventsAPI } from '../services/api';
import { toast } from 'react-toastify';
import storage from '../utils/storage';
import SkeletonLoader from './SkeletonLoader';
import { parseDateOnly } from '../utils/dateOnly';

interface EventsSectionProps {
  isAdmin?: boolean;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
  onShare?: (event: Event) => void;
}

const EventsSection: React.FC<EventsSectionProps> = ({ 
  isAdmin = false, 
  onEdit, 
  onDelete, 
  onShare 
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming'>('upcoming');

  const getRandomVerseForEvent = (event: Event) => {
    const verses = [
      {
        text: 'Meu coração ouviu tua voz dizer: "Venha e entre na minha presença",\ne meu coração respondeu: "Senhor, eu irei!".',
        ref: 'Salmos 27:8 - NVT',
      },
      {
        text: 'Alegrei-me quando me disseram: "Vamos à casa do Senhor".',
        ref: 'Salmos 122:1 - NVT',
      },
      {
        text: 'Pois onde dois ou três se reúnem em meu nome, ali eu estou no meio deles.',
        ref: 'Mateus 18:20 - NVT',
      },
      {
        text: 'Lancem sobre ele toda a sua ansiedade, porque ele cuida de vocês.',
        ref: '1 Pedro 5:7 - NVT',
      },
    ];

    const seed = Array.from(String(event.id || event.title || '')).reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return verses[seed % verses.length];
  };

  const formatEventDateTime = (event: Event) => {
    const date = parseDateOnly(event.date);
    const formatted = date.toLocaleDateString('pt-BR');
    return `${formatted} às ${event.time}`;
  };

  const tryOpenInstagramStories = async (): Promise<boolean> => {
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

  const generateInviteMessage = (event: Event) => {
    const verse = getRandomVerseForEvent(event);
    const link = `${window.location.origin}/eventos`;

    return [
      `Evento: ${event.title}`,
      '',
      `Data: ${formatEventDateTime(event)}`,
      `Local: ${event.location}`,
      '',
      `${verse.text}`,
      `${verse.ref}`,
      '',
      `Link: ${link}`,
      '',
      '#IgrejaComunidadeResgate #Evento',
    ].join('\n');
  };

  const tryNativeShare = async (event: Event, text: string) => {
    if (!('share' in navigator)) {
      return false;
    }

    try {
      await navigator.share({
        title: event.title,
        text,
      });
      return true;
    } catch {
      return false;
    }
  };

  const shareToPlatform = async (platform: 'instagram' | 'facebook' | 'whatsapp', event: Event) => {
    const baseText = generateInviteMessage(event);

    const text = platform === 'whatsapp' && event.image && !event.image.startsWith('data:')
      ? `${baseText}\n\n${event.image}`
      : baseText;

    const shared = await tryNativeShare(event, text);
    if (shared) return;

    if (platform === 'whatsapp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
      return;
    }

    if (platform === 'facebook') {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(text)}`;
      window.open(facebookUrl, '_blank');
      return;
    }

    const opened = await tryOpenInstagramStories();
    if (!opened) {
      window.open('https://www.instagram.com/', '_blank');
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.info('Texto copiado. Cole no Stories do Instagram para compartilhar.');
    } catch {
      toast.info('Copie o texto para colar no Stories do Instagram.');
    }
  };

  useEffect(() => {
    // Migrar imagens antigas primeiro
    eventsAPI.migrateEventsImages();
    loadEvents();
    
    // Listener para mudanças nos eventos (sincronização)
    const handleStorageChange = () => {
      console.log('Eventos atualizados, recarregando...');
      loadEvents();
    };
    
    // Listener para mudanças no armazenamento local
    const handleLocalStorageChange = (e: StorageEvent) => {
      if (e.key === 'cachedEvents') {
        console.log('Cache de eventos atualizado, recarregando...');
        loadEvents();
      }
    };
    
    window.addEventListener('eventsUpdated', handleStorageChange);
    window.addEventListener('storage', handleLocalStorageChange);
    
    return () => {
      window.removeEventListener('eventsUpdated', handleStorageChange);
      window.removeEventListener('storage', handleLocalStorageChange);
    };
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('Carregando eventos para página inicial...');
      
      // Tentar carregar eventos da API real primeiro
      try {
        const eventsData = await eventsAPI.getEvents();
        console.log('Dados recebidos da API:', eventsData);
        
        if (eventsData && eventsData.length > 0) {
          setEvents(eventsData);
          // Salvar no cache local
          storage.setJSON('cachedEvents', eventsData);
          console.log('Eventos carregados da API:', eventsData.length);
        } else {
          console.log('Nenhum evento encontrado na API, verificando cache local');
          loadFromCache();
        }
      } catch (apiError) {
        console.log('Erro na API, verificando cache local:', apiError);
        loadFromCache();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setLoading(false);
    }
  };

  const loadFromCache = () => {
    try {
      const cachedEvents = storage.getJSON<Event[]>('cachedEvents');
      if (cachedEvents && Array.isArray(cachedEvents) && cachedEvents.length > 0) {
        console.log('Eventos do cache:', cachedEvents);
        console.log('Primeiro evento:', cachedEvents[0]);
        if (cachedEvents[0] && cachedEvents[0].image) {
          console.log('Imagem do primeiro evento:', cachedEvents[0].image.substring(0, 50) + '...');
          console.log('É base64?', cachedEvents[0].image.startsWith('data:'));
        }
        setEvents(cachedEvents);
        console.log('Eventos carregados do cache:', cachedEvents.length);
      } else {
        // Se não há cache, criar um evento de teste para debug
        const testEvent = {
          id: 'test-1',
          title: 'Evento de Teste',
          description: 'Este é um evento de teste para verificar se o sistema está funcionando',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias no futuro
          time: '19:00',
          location: 'Igreja Comunidade Resgate',
          image: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Evento+de+Teste',
          social_media: {
            instagram: true,
            facebook: true,
            whatsapp: true
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setEvents([testEvent]);
        console.log('Nenhum evento no cache, criando evento de teste');
      }
    } catch (error) {
      console.error('Erro ao carregar do cache:', error);
      setEvents([]);
    }
  };


  const formatDate = (dateString: string) => {
    // Criar data local sem problemas de fuso horário
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month é 0-indexed
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const isUpcoming = (dateString: string) => {
    // Criar data local sem problemas de fuso horário
    const [year, month, day] = dateString.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day); // month é 0-indexed
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('ðŸ“… Comparando datas:', {
      eventDate: eventDate.toLocaleDateString('pt-BR'),
      today: today.toLocaleDateString('pt-BR'),
      isUpcoming: eventDate >= today
    });
    
    return eventDate >= today;
  };

  const isThisMonth = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate.getMonth() === today.getMonth() && 
           eventDate.getFullYear() === today.getFullYear();
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        // Se for admin, chamar a função de exclusão passada como prop
        if (isAdmin && onDelete) {
          onDelete(id);
        } else {
          // Para usuários normais, apenas remover da lista local
          setEvents(prev => prev.filter(event => event.id !== id));
          toast.success('Evento removido da visualização!');
        }
        console.log('✅ Evento excluído:', id);
      } catch (error) {
        console.error('❌ Erro ao excluir evento:', error);
        toast.error('Erro ao excluir evento');
      }
    }
  };

  const filteredEvents = events.filter(event => {
    return isUpcoming(event.date);
  });

  if (loading) {
    return (
      <div className="py-16 bg-white dark:bg-gray-800 bg-waves">
        <div className="container mx-auto px-6">
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-white dark:bg-gray-800 bg-waves">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-heading mb-2 dark:text-white fade-in-up">
            Próximos Eventos
          </h2>
          <p className="text-gray-600 dark:text-gray-300 fade-in-up stagger-1">
            Participe dos nossos eventos e fortaleça sua fé junto conosco
          </p>
          {/* Debug info */}
          <div className="mt-2 text-xs text-gray-400">
            {events.length} eventos carregados | {filteredEvents.length} próximos
          </div>
        </div>

        {/* Lista de Eventos */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Nenhum evento encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Não há eventos próximos no momento.
            </p>
            {isAdmin && (
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                Crie eventos na seção de administração para vê-los aqui.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 fade-in-scale"
              >
                {/* Imagem do Evento */}
                {event.image && (
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <SafeImage
                      src={event.image}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-lg"
                      fallbackText="Imagem do Evento"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Conteúdo */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {event.title}
                  </h3>
                  {isUpcoming(event.date) && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Próximo
                    </span>
                  )}
                </div>

                {event.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {event.description}
                  </p>
                )}

                {/* Informações do Evento */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    {formatTime(event.time)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {event.location}
                  </div>
                </div>

                {/* Redes Sociais */}
                {event.social_media && Object.values(event.social_media).some(Boolean) && (
                  <div className="mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Compartilhar:</span>
                      {event.social_media.instagram && (
                        <button
                          type="button"
                          onClick={() => shareToPlatform('instagram', event)}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 hover:opacity-90"
                        >
                          Instagram
                        </button>
                      )}
                      {event.social_media.facebook && (
                        <button
                          type="button"
                          onClick={() => shareToPlatform('facebook', event)}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:opacity-90"
                        >
                          Facebook
                        </button>
                      )}
                      {event.social_media.whatsapp && (
                        <button
                          type="button"
                          onClick={() => shareToPlatform('whatsapp', event)}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:opacity-90"
                        >
                          WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Ações para Admin */}
                {isAdmin && (
                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-600">
                    {onShare && (
                      <button
                        onClick={() => onShare(event)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                      >
                        <ShareIcon className="h-3 w-3 mr-1" />
                        Compartilhar
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(event)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 dark:bg-gray-600 dark:text-red-400 dark:border-red-500"
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        Excluir
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Quer saber mais sobre nossos eventos?
          </p>
          <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Entre em Contato
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventsSection;
