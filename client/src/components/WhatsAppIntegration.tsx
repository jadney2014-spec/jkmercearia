import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import storage from '../utils/storage';

// Importação segura do framer-motion com fallback
let motion: any;
let AnimatePresence: React.ComponentType<any>;
try {
  const framerMotion = require('framer-motion');
  if (framerMotion && framerMotion.motion) {
    motion = framerMotion.motion;
  } else {
    motion = { div: ({ children, ...props }: any) => <div {...props}>{children}</div> };
  }
  if (framerMotion && framerMotion.AnimatePresence) {
    AnimatePresence = framerMotion.AnimatePresence;
  } else {
    AnimatePresence = ({ children }: any) => <>{children}</>;
  }
} catch (error) {
  // Fallback se framer-motion não estiver disponível
  motion = { div: ({ children, ...props }: any) => <div {...props}>{children}</div> };
  AnimatePresence = ({ children }: any) => <>{children}</>;
}

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'pastor' | 'tesoureiro' | 'membro' | 'custom';
  isActive: boolean;
  createdAt: Date;
  lastMessage?: Date;
}

interface WhatsAppMessage {
  id: string;
  contactId: string;
  message: string;
  type: 'text' | 'template' | 'media';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  template?: string;
  mediaUrl?: string;
}

interface WhatsAppIntegrationProps {
  financialData?: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    memberCount: number;
  };
}

const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ financialData }) => {
  const MotionDiv = motion?.div || (({ children, ...props }: any) => <div {...props}>{children}</div>);
  const MotionButton = motion?.button || (({ children, ...props }: any) => <button {...props}>{children}</button>);
  const hasAnimatePresence = AnimatePresence && typeof AnimatePresence !== 'undefined' && typeof AnimatePresence === 'function';
  const SafeAnimatePresence = (AnimatePresence as unknown) as React.FC<React.PropsWithChildren<any>>;
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [newContact, setNewContact] = useState<Partial<WhatsAppContact>>({
    name: '',
    phone: '',
    role: 'membro',
    isActive: true
  });
  const [newMessage, setNewMessage] = useState<Partial<WhatsAppMessage>>({
    message: '',
    type: 'text',
    scheduledAt: undefined
  });

  // Templates de mensagens
  const messageTemplates = {
    financial: {
      name: 'Relatório Financeiro',
      template: `📊 *Relatório Financeiro - ${new Date().toLocaleDateString('pt-BR')}*

💰 *Receitas Totais:* R$ {{totalIncome}}
💸 *Despesas Totais:* R$ {{totalExpenses}}
💵 *Saldo Atual:* R$ {{balance}}

📈 *Resumo:*
- Crescimento mensal: {{growth}}%
- Meta atingida: {{goalProgress}}%

🙏 Obrigado pela confiança na gestão da nossa igreja!`
    },
    welcome: {
      name: 'Boas-vindas',
      template: `🎉 *Bem-vindo à Comunidade Cristã Resgate!*

É uma alegria tê-lo conosco! 🙏

📅 *Próximos eventos:*
- Culto de domingo: 9h e 19h
- Reunião de oração: Quarta-feira 19h30
- Escola Bíblica: Domingo 8h

📱 *Contato:*
- WhatsApp: (11) 1234-5678
- Email: cresgate012@gmail.com

Que Deus abençoe sua vida! ✨`
    },
    reminder: {
      name: 'Lembrete de Evento',
      template: `⏰ *Lembrete de Evento*

📅 *{{eventName}}*
🕐 *Horário:* {{eventTime}}
📍 *Local:* {{eventLocation}}

Não esqueça de participar! Sua presença é muito importante para nós. 🙏

*Comunidade Cristã Resgate*`
    },
    prayer: {
      name: 'Pedido de Oração',
      template: `🙏 *Pedido de Oração*

Olá {{name}}! 

Recebemos seu pedido de oração e nossa equipe já está intercedendo por você.

*"Porque onde estiverem dois ou três reunidos em meu nome, ali estou no meio deles."* - Mateus 18:20

Que Deus abençoe e fortaleça você! ✨

*Comunidade Cristã Resgate*`
    }
  };

  // Carregar dados do armazenamento local
  useEffect(() => {
    const savedContacts = storage.getJSON<any[]>('whatsapp-contacts');
    const savedMessages = storage.getJSON<any[]>('whatsapp-messages');
    
    if (savedContacts && Array.isArray(savedContacts)) {
      const parsedContacts = savedContacts.map((contact: any) => ({
        ...contact,
        createdAt: new Date(contact.createdAt),
        lastMessage: contact.lastMessage ? new Date(contact.lastMessage) : undefined
      }));
      setContacts(parsedContacts);
    } else {
      // Contatos de exemplo
      const exampleContacts: WhatsAppContact[] = [
        {
          id: '1',
          name: 'Apóstolo Isac',
          phone: '+5511999999999',
          role: 'pastor',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Apóstola Elaine',
          phone: '+5511888888888',
          role: 'pastor',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '3',
          name: 'Pastor Jadney',
          phone: '+5511777777777',
          role: 'pastor',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '4',
          name: 'Pastora Kele',
          phone: '+5511666666666',
          role: 'pastor',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '5',
          name: 'Pastor Leomar',
          phone: '+5511555555555',
          role: 'pastor',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '6',
          name: 'Pastora Fran',
          phone: '+5511444444444',
          role: 'pastor',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '7',
          name: 'Pastor Elcio',
          phone: '+5511333333333',
          role: 'pastor',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '8',
          name: 'Pastora Eneize',
          phone: '+5511222222222',
          role: 'pastor',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '9',
          name: 'Pastor Thiago',
          phone: '+5511111111111',
          role: 'pastor',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '10',
          name: 'Pastora Rany',
          phone: '+5511000000000',
          role: 'pastor',
          isActive: true,
          createdAt: new Date()
        }
      ];
      setContacts(exampleContacts);
    }

    if (savedMessages && Array.isArray(savedMessages)) {
      const parsedMessages = savedMessages.map((message: any) => ({
        ...message,
        scheduledAt: message.scheduledAt ? new Date(message.scheduledAt) : undefined,
        sentAt: message.sentAt ? new Date(message.sentAt) : undefined
      }));
      setMessages(parsedMessages);
    }
  }, []);

  // Salvar dados no armazenamento local
  useEffect(() => {
    storage.setJSON('whatsapp-contacts', contacts);
  }, [contacts]);

  useEffect(() => {
    storage.setJSON('whatsapp-messages', messages);
  }, [messages]);

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) return;

    const contact: WhatsAppContact = {
      id: Date.now().toString(),
      name: newContact.name,
      phone: newContact.phone,
      role: newContact.role || 'membro',
      isActive: true,
      createdAt: new Date()
    };

    setContacts([...contacts, contact]);
    setNewContact({
      name: '',
      phone: '',
      role: 'membro',
      isActive: true
    });
    setShowContactForm(false);
  };

  const handleSendMessage = () => {
    if (!newMessage.message || !selectedContact) return;

    const message: WhatsAppMessage = {
      id: Date.now().toString(),
      contactId: selectedContact.id,
      message: newMessage.message,
      type: newMessage.type || 'text',
      status: 'pending',
      scheduledAt: newMessage.scheduledAt,
      template: newMessage.template
    };

    setMessages([...messages, message]);
    setNewMessage({
      message: '',
      type: 'text',
      scheduledAt: undefined
    });
    setShowMessageForm(false);

    // Simular envio
    setTimeout(() => {
      setMessages(prev => 
        prev.map(m => 
          m.id === message.id 
            ? { ...m, status: 'sent', sentAt: new Date() }
            : m
        )
      );
    }, 2000);
  };

  const toggleContactStatus = (contactId: string) => {
    setContacts(prev => 
      prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, isActive: !contact.isActive }
          : contact
      )
    );
  };

  const deleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Cog6ToothIcon;
      case 'pastor': return UserGroupIcon;
      case 'tesoureiro': return EnvelopeIcon;
      case 'membro': return UserGroupIcon;
      default: return UserGroupIcon;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-500 bg-red-100 dark:bg-red-900';
      case 'pastor': return 'text-blue-500 bg-blue-100 dark:bg-blue-900';
      case 'tesoureiro': return 'text-green-500 bg-green-100 dark:bg-green-900';
      case 'membro': return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return CheckCircleIcon;
      case 'delivered': return CheckCircleIcon;
      case 'read': return CheckCircleIcon;
      case 'failed': return XCircleIcon;
      case 'pending': return ClockIcon;
      default: return ExclamationTriangleIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-500';
      case 'delivered': return 'text-green-500';
      case 'read': return 'text-green-600';
      case 'failed': return 'text-red-500';
      case 'pending': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Integração WhatsApp
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie contatos e envie mensagens via WhatsApp
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            isConnected 
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          <button
            onClick={() => setShowContactForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Novo Contato</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Contatos</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{contacts.length}</p>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-center space-x-2">
            <PlayIcon className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ativos</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {contacts.filter(c => c.isActive).length}
          </p>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-center space-x-2">
            <EnvelopeIcon className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mensagens</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{messages.length}</p>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enviadas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {messages.filter(m => m.status === 'sent' || m.status === 'delivered' || m.status === 'read').length}
          </p>
        </MotionDiv>
      </div>

      {/* Contacts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Contatos
          </h3>
          
          <div className="space-y-3">
            {hasAnimatePresence ? (
              <SafeAnimatePresence initial={false}>
                {contacts.map((contact, index) => {
                  const RoleIcon = getRoleIcon(contact.role);
                  const colorClass = getRoleColor(contact.role);
                  
                  if (!RoleIcon || typeof RoleIcon !== 'function') {
                  }
                  if (!MotionDiv || typeof MotionDiv !== 'function') {
                  }
                  
                  return (
                    <MotionDiv
                    key={contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 ${
                      contact.isActive ? 'border-green-500' : 'border-gray-300'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <RoleIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {contact.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {contact.phone}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>
                              {contact.role}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedContact(contact);
                              setShowMessageForm(true);
                            }}
                            className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                            title="Enviar mensagem"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => toggleContactStatus(contact.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              contact.isActive 
                                ? 'text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900' 
                                : 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900'
                            }`}
                            title={contact.isActive ? 'Desativar' : 'Ativar'}
                          >
                            {contact.isActive ? (
                              <PauseIcon className="h-4 w-4" />
                            ) : (
                              <PlayIcon className="h-4 w-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => deleteContact(contact.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </MotionDiv>
                );
              })}
            </SafeAnimatePresence>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => {
                  const RoleIcon = getRoleIcon(contact.role);
                  const colorClass = getRoleColor(contact.role);
                  return (
                    <div
                      key={contact.id}
                      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 ${
                        contact.isActive ? 'border-green-500' : 'border-gray-300'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              {RoleIcon && <RoleIcon className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {contact.name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {contact.phone}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>
                                {contact.role}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mensagens Recentes
          </h3>
          
          <div className="space-y-3">
            {hasAnimatePresence ? (
              <SafeAnimatePresence initial={false}>
                {messages.slice(-5).reverse().map((message, index) => {
                  const contact = contacts.find(c => c.id === message.contactId);
                  const StatusIcon = getStatusIcon(message.status);
                  const statusColor = getStatusColor(message.status);
                  
                  if (!StatusIcon || typeof StatusIcon !== 'function') {
                  }
                  
                  return (
                    <MotionDiv
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {contact?.name || 'Contato não encontrado'}
                          </h4>
                          <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {message.message.length > 100 
                            ? `${message.message.substring(0, 100)}...` 
                            : message.message
                          }
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{message.type}</span>
                          {message.sentAt && (
                            <span>â€¢ {message.sentAt.toLocaleString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </MotionDiv>
                );
              })}
            </SafeAnimatePresence>
            ) : (
              <div className="space-y-3">
                {messages.slice(-5).reverse().map((message) => {
                  const contact = contacts.find(c => c.id === message.contactId);
                  const StatusIcon = getStatusIcon(message.status);
                  const statusColor = getStatusColor(message.status);
                  return (
                    <div
                      key={message.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {contact?.name || 'Contato não encontrado'}
                            </h4>
                            {StatusIcon && <StatusIcon className={`h-4 w-4 ${statusColor}`} />}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {message.message.length > 100 
                              ? `${message.message.substring(0, 100)}...` 
                              : message.message
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Templates de Mensagens
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(messageTemplates).map(([key, template]) => (
            <MotionButton
              key={key}
              onClick={() => {
                setNewMessage({ 
                  ...newMessage, 
                  message: template.template,
                  template: key 
                });
                setShowMessageForm(true);
              }}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {template.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {template.template.substring(0, 100)}...
              </p>
            </MotionButton>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      {hasAnimatePresence ? (
        <SafeAnimatePresence initial={false}>
          {showContactForm ? (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowContactForm(false)}
            >
              <MotionDiv
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Adicionar Contato
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Nome do contato"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefone (com código do país)
                  </label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="+5511999999999"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Função
                  </label>
                  <select
                    value={newContact.role}
                    onChange={(e) => setNewContact({ ...newContact, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="admin">Administrador</option>
                    <option value="pastor">Pastor</option>
                    <option value="tesoureiro">Tesoureiro</option>
                    <option value="membro">Membro</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowContactForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddContact}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
              </MotionDiv>
            </MotionDiv>
          ) : null}
        </SafeAnimatePresence>
      ) : (
        showContactForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowContactForm(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Adicionar Contato
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Nome do contato"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefone (com código do país)
                  </label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="+5511999999999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Função
                  </label>
                  <select
                    value={newContact.role}
                    onChange={(e) => setNewContact({ ...newContact, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="admin">Administrador</option>
                    <option value="pastor">Pastor</option>
                    <option value="tesoureiro">Tesoureiro</option>
                    <option value="membro">Membro</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowContactForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddContact}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Send Message Modal */}
      {hasAnimatePresence ? (
        <SafeAnimatePresence initial={false}>
          {showMessageForm && selectedContact ? (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowMessageForm(false)}
            >
              <MotionDiv
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl"
                onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
              >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Enviar Mensagem para {selectedContact.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={newMessage.message}
                    onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={8}
                    placeholder="Digite sua mensagem..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo
                    </label>
                    <select
                      value={newMessage.type}
                      onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="text">Texto</option>
                      <option value="template">Template</option>
                      <option value="media">Mídia</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Agendar Envio
                    </label>
                    <input
                      type="datetime-local"
                      value={newMessage.scheduledAt?.toISOString().slice(0, 16)}
                      onChange={(e) => setNewMessage({ 
                        ...newMessage, 
                        scheduledAt: e.target.value ? new Date(e.target.value) : undefined 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowMessageForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Enviar Mensagem
                </button>
              </div>
              </MotionDiv>
            </MotionDiv>
          ) : null}
        </SafeAnimatePresence>
      ) : (
        showMessageForm && selectedContact && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMessageForm(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Enviar Mensagem para {selectedContact.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={newMessage.message}
                    onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Digite sua mensagem..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowMessageForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Enviar Mensagem
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default WhatsAppIntegration;
