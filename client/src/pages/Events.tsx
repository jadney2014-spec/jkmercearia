import React, { useState, useEffect } from 'react';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../firebase/AuthContext';
import { eventsAPI } from '../services/api';
import EventForm from '../components/EventForm';
import EventList from '../components/EventList';
import SocialShare from '../components/SocialShare';
import AutoShareManager from '../components/AutoShareManager';
import { toast } from 'react-toastify';
import { Event, EventFormData } from '../types/Event';
import { useEventsAlerts } from '../contexts/EventsAlertsContext';

const Events: React.FC = () => {
  const { user } = useAuth();
  const { markAllSeen } = useEventsAlerts();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventFormData | undefined>();
  const [sharingEvent, setSharingEvent] = useState<Event | undefined>();
  const [autoSharingEvent, setAutoSharingEvent] = useState<Event | undefined>();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    // Migrar imagens antigas primeiro
    eventsAPI.migrateEventsImages();
    loadEvents();
    markAllSeen();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('Events.tsx - Carregando eventos...');
      
      if (!user) {
        console.log('Events.tsx - Usuário não autenticado');
        setEvents([]);
        return;
      }

      console.log('Events.tsx - Chamando eventsAPI.getEvents()');
      const eventsData = await eventsAPI.getEvents();
      console.log('Events.tsx - Dados recebidos da API:', eventsData);
      console.log('Events.tsx - Quantidade de eventos:', eventsData.length);
      
      if (eventsData.length > 0) {
        console.log('Events.tsx - Primeiro evento:', eventsData[0]);
        if (eventsData[0].image) {
          console.log('Events.tsx - Primeira imagem:', eventsData[0].image.substring(0, 50) + '...');
          console.log('Events.tsx - É base64?', eventsData[0].image.startsWith('data:'));
          console.log('Events.tsx - Tamanho da imagem:', eventsData[0].image.length);
        } else {
          console.log('Events.tsx - Primeiro evento sem imagem');
        }
      }
      
      setEvents(eventsData);
      console.log('Events.tsx - Eventos definidos no estado');
    } catch (error) {
      console.error('Events.tsx - Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
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
    console.log('Events.tsx - Tentando excluir evento com ID:', id);
    
    if (!id) {
      toast.error('ID do evento é inválido');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
      console.log('Events.tsx - Usuário confirmou exclusão');
      
      try {
        console.log('Events.tsx - Chamando eventsAPI.deleteEvent...');
        await eventsAPI.deleteEvent(id);
        console.log('Events.tsx - Evento excluído com sucesso via API');
        
        toast.success('Evento excluído com sucesso!');
        console.log('Events.tsx - Recarregando eventos...');
        loadEvents();
      } catch (error) {
        console.error('Events.tsx - Erro ao excluir evento:', error);
        
        // Tentar remover localmente mesmo se a API falhar
        try {
          setEvents(prev => prev.filter(event => event.id !== id));
          toast.success('Evento removido localmente!');
          console.log('Events.tsx - Evento removido localmente');
        } catch (localError) {
          console.error('Events.tsx - Erro ao remover localmente:', localError);
          toast.error('Erro ao excluir evento. Tente novamente.');
        }
      }
    } else {
      console.log('Events.tsx - Usuário cancelou exclusão');
    }
  };

  const handleSaveEvent = (eventData: EventFormData) => {
    setShowForm(false);
    setEditingEvent(undefined);
    toast.success(editingEvent ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
    loadEvents();
  };

  const handleShareEvent = (event: Event) => {
    setSharingEvent(event);
  };

  const handleAutoShareEvent = (event: Event) => {
    setAutoSharingEvent(event);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2" />
            Eventos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Gerencie os eventos da sua igreja</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          <button
            onClick={handleCreateEvent}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
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
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todos ({events.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'upcoming'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <EventList
            events={filteredEvents}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onShare={handleShareEvent}
            onAutoShare={handleAutoShareEvent}
          />
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

export default Events;
