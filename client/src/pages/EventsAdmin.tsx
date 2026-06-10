import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Event, EventFormData } from '../types/Event';
import { eventsAPI } from '../services/api';
import EventForm from '../components/EventForm';
import SocialShare from '../components/SocialShare';
import AutoShareManager from '../components/AutoShareManager';
import { toast } from 'react-toastify';
import storage from '../utils/storage';

const EventsAdmin: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventFormData | undefined>();
  const [sharingEvent, setSharingEvent] = useState<Event | undefined>();
  const [autoSharingEvent, setAutoSharingEvent] = useState<Event | undefined>();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [viewMode, setViewMode] = useState<'admin' | 'preview'>('admin');

  useEffect(() => {
    // Migrar imagens antigas primeiro
    eventsAPI.migrateEventsImages();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('ðŸ”„ Carregando eventos...');
      
      // Tentar carregar eventos da API real primeiro
      try {
        const eventsData = await eventsAPI.getEvents();
        console.log('ðŸ“Š Dados recebidos da API:', eventsData);
        
        if (eventsData && eventsData.length > 0) {
          setEvents(eventsData);
          console.log('âœ… Eventos carregados da API:', eventsData.length);
        } else {
          console.log('âš ï¸ Nenhum evento encontrado na API, usando dados mock');
          loadMockEvents();
        }
      } catch (apiError) {
        console.log('âš ï¸ Erro na API, usando dados mock:', apiError);
        loadMockEvents();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('âŒ Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar eventos');
      setLoading(false);
    }
  };

  const loadMockEvents = () => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Culto de Celebração',
        description: 'Venha celebrar conosco a presença de Deus em nossas vidas',
        date: '2024-01-15',
        time: '19:00',
        location: 'Igreja Comunidade Resgate',
        image: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Culto+de+Celebração',
        social_media: {
          instagram: true,
          facebook: true,
          whatsapp: true
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        title: 'Conferência de Jovens',
        description: 'Um encontro especial para jovens com palestras e atividades',
        date: '2024-01-20',
        time: '14:00',
        location: 'Auditório Principal',
        image: 'https://via.placeholder.com/400x300/059669/FFFFFF?text=Conferência+de+Jovens',
        social_media: {
          instagram: true,
          facebook: false,
          whatsapp: true
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        title: 'Reunião de Oração',
        description: 'Momento especial de oração e comunhão',
        date: '2024-01-25',
        time: '20:00',
        location: 'Sala de Oração',
        image: 'https://via.placeholder.com/400x300/DC2626/FFFFFF?text=Reunião+de+Oração',
        social_media: {
          instagram: false,
          facebook: true,
          whatsapp: true
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];
    setEvents(mockEvents);
    console.log('âœ… Eventos mock carregados:', mockEvents.length);
  };

  const handleCreateEvent = () => {
    setEditingEvent(undefined);
    setShowForm(true);
  };

  const handleEditEvent = (event: Event) => {
    const eventFormData: EventFormData = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      image: event.image,
      social_media: event.social_media
    };
    setEditingEvent(eventFormData);
    setShowForm(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
      try {
        // Tentar excluir via API
        try {
          await eventsAPI.deleteEvent(id);
          console.log('âœ… Evento excluído via API:', id);
        } catch (apiError) {
          console.log('âš ï¸ Erro na API, removendo localmente:', apiError);
        }
        
        // Remover da lista local
        setEvents(prev => prev.filter(event => event.id !== id));
        toast.success('Evento excluído com sucesso!');
        // Disparar evento de sincronização
        window.dispatchEvent(new CustomEvent('eventsUpdated'));
      } catch (error) {
        console.error('âŒ Erro ao excluir evento:', error);
        toast.error('Erro ao excluir evento');
      }
    }
  };

  const handleSaveEvent = async (eventData: EventFormData) => {
    try {
      setShowForm(false);
      setEditingEvent(undefined);
      
      if (editingEvent) {
        // Atualizar evento existente
        try {
          const updatedEvent = await eventsAPI.updateEvent(editingEvent.id!, eventData);
          console.log('âœ… Evento atualizado via API:', updatedEvent);
          setEvents(prev => prev.map(event => 
            event.id === editingEvent.id 
              ? { ...event, ...eventData, updated_at: new Date().toISOString() }
              : event
          ));
          toast.success('Evento atualizado com sucesso!');
          // Disparar evento de sincronização
          window.dispatchEvent(new CustomEvent('eventsUpdated'));
        } catch (apiError) {
          console.log('âš ï¸ Erro na API, atualizando localmente:', apiError);
          setEvents(prev => prev.map(event => 
            event.id === editingEvent.id 
              ? { ...event, ...eventData, updated_at: new Date().toISOString() }
              : event
          ));
          toast.success('Evento atualizado localmente!');
          // Disparar evento de sincronização
          window.dispatchEvent(new CustomEvent('eventsUpdated'));
        }
      } else {
        // Criar novo evento
        try {
          const newEventFromAPI = await eventsAPI.createEvent(eventData);
          console.log('âœ… Evento criado via API:', newEventFromAPI);
          setEvents(prev => {
            const updatedEvents = [...prev, newEventFromAPI];
            // Salvar no cache local
            storage.setJSON('cachedEvents', updatedEvents);
            return updatedEvents;
          });
          toast.success('Evento criado com sucesso!');
          // Disparar evento de sincronização
          window.dispatchEvent(new CustomEvent('eventsUpdated'));
          console.log('Evento de sincronização disparado para página inicial');
        } catch (apiError) {
          console.log('âš ï¸ Erro na API, criando localmente:', apiError);
          const newEvent: Event = {
            ...eventData,
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setEvents(prev => {
            const updatedEvents = [...prev, newEvent];
            // Salvar no cache local
            storage.setJSON('cachedEvents', updatedEvents);
            return updatedEvents;
          });
          toast.success('Evento criado localmente!');
          // Disparar evento de sincronização
          window.dispatchEvent(new CustomEvent('eventsUpdated'));
        }
      }
    } catch (error) {
      console.error('âŒ Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento');
    }
  };

  const handleShareEvent = (event: Event) => {
    setSharingEvent(event);
  };

  const handleAutoShareEvent = (event: Event) => {
    setAutoSharingEvent(event);
  };

  const formatDate = (dateString: string) => {
    // Criar data local sem problemas de fuso horário
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month é 0-indexed
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
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
    return eventDate >= today;
  };

  const filteredEvents = events.filter(event => {
    // Criar data local sem problemas de fuso horário
    const [year, month, day] = event.date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day); // month é 0-indexed
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'upcoming':
        return eventDate >= today;
      case 'past':
        return eventDate < today;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2" />
            Administração de Eventos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Gerencie os eventos que aparecem na página inicial</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'admin' ? 'preview' : 'admin')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            {viewMode === 'admin' ? 'Visualizar' : 'Administrar'}
          </button>
          <button
            onClick={handleCreateEvent}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Evento
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({events.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'upcoming'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Próximos ({events.filter(e => {
              const [year, month, day] = e.date.split('-').map(Number);
              const eventDate = new Date(year, month - 1, day);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return eventDate >= today;
            }).length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'past'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Passados ({events.filter(e => {
              const [year, month, day] = e.date.split('-').map(Number);
              const eventDate = new Date(year, month - 1, day);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return eventDate < today;
            }).length})
          </button>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum evento encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? 'Comece criando um novo evento.' 
                  : 'Não há eventos para o filtro selecionado.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden ${
                    isUpcoming(event.date) ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'
                  }`}
                >
                  {/* Imagem do Evento */}
                  {event.image && (
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  {/* Conteúdo */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {event.title}
                      </h3>
                      {isUpcoming(event.date) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Próximo
                        </span>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatTime(event.time)}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {event.location}
                      </div>
                    </div>

                    {/* Redes Sociais */}
                    {event.social_media && Object.values(event.social_media).some(Boolean) && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2">
                          <ShareIcon className="h-4 w-4 text-gray-400" />
                          <div className="flex space-x-2">
                            {event.social_media.instagram && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-pink-100 text-pink-800">
                                Instagram
                              </span>
                            )}
                            {event.social_media.facebook && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Facebook
                              </span>
                            )}
                            {event.social_media.whatsapp && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                WhatsApp
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    {viewMode === 'admin' && (
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <button
                          onClick={() => handleShareEvent(event)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <ShareIcon className="h-3 w-3 mr-1" />
                          Compartilhar
                        </button>
                        <button
                          onClick={() => handleAutoShareEvent(event)}
                          className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50"
                        >
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Auto Share
                        </button>
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <EventForm
          event={editingEvent}
          onClose={() => {
            setShowForm(false);
            setEditingEvent(undefined);
          }}
          onSave={handleSaveEvent}
        />
      )}

      {/* Modal de Compartilhamento */}
      {sharingEvent && (
        <SocialShare
          event={sharingEvent}
          onClose={() => setSharingEvent(undefined)}
        />
      )}

      {/* Modal de Compartilhamento Automático */}
      {autoSharingEvent && (
        <AutoShareManager
          event={autoSharingEvent}
          onClose={() => setAutoSharingEvent(undefined)}
        />
      )}
    </div>
  );
};

export default EventsAdmin;
