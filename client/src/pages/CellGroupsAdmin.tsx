import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  UserGroupIcon,
  HomeIcon,
  SparklesIcon,
  HeartIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  StarIcon,
  EyeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import ImageUpload from '../components/ImageUpload';
import storage from '../utils/storage';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
}

interface CellGroup {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon: string;
  color: string;
  members: Member[];
  meetings: string;
  location: string;
  leader: string;
  leaderPhone?: string;
  leaderEmail?: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
}

const CellGroupsAdmin: React.FC = () => {
  const [groups, setGroups] = useState<CellGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CellGroup | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState({ name: '', email: '', phone: '' });
  const [memberFormErrors, setMemberFormErrors] = useState({ name: false, email: false, phone: false });
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

// Carregar grupos do armazenamento local
  useEffect(() => {
    // Limpar dados antigos que possam ter horários incorretos
    const clearOldData = () => {
      const savedGroups = storage.getJSON<CellGroup[]>('cellGroups');
      if (savedGroups && Array.isArray(savedGroups)) {
        // Verificar se algum grupo tem horário antigo
        const hasOldSchedule = savedGroups.some(
          (group: CellGroup) => group.meetings && !group.meetings.includes('Quarta-Feira 20:00hrs')
        );

        if (hasOldSchedule) {
          console.log('ðŸ”„ Detectados horários antigos, atualizando...');
          storage.remove('cellGroups');
          storage.remove('publicCellGroups');
          storage.remove('cellGroupsLastSync');
          return true; // Indica que dados foram limpos
        }
      }
      return false;
    };

    const dataCleared = clearOldData();
    
    const savedGroups = storage.getJSON<CellGroup[]>('cellGroups');
    if (savedGroups && Array.isArray(savedGroups)) {
      // Atualizar horários para garantir que sejam "Quarta-Feira 20:00hrs"
      const updatedGroups = savedGroups.map((group: CellGroup) => ({
        ...group,
        meetings: 'Quarta-Feira 20:00hrs',
        features: [], // Garantir que features esteja vazio
        updatedAt: new Date().toISOString()
      }));
      setGroups(updatedGroups);
    } else {
      // Grupos padrão
      const defaultGroups: CellGroup[] = [
        {
          id: 'family',
          title: 'Célula Resgate Veredas',
          subtitle: 'Crescendo Juntos',
          description: 'Um grupo para casais e famílias que buscam crescer juntos na fé e no relacionamento.',
          image: '/img/family-group.jpg',
          icon: 'HomeIcon',
          color: 'blue',
          members: [],
          meetings: 'Quarta-Feira 20:00hrs',
          location: '',
          leader: '',
          leaderPhone: '',
          leaderEmail: '',
          features: [],
          isPopular: true,
          isActive: true,
          maxMembers: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'youth',
          title: 'Célula Resgate Vendinha',
          subtitle: 'Geração de Impacto',
          description: 'Conecte-se com outros jovens, discuta temas relevantes e fortaleça sua fé.',
          image: '/img/youth-group.jpg',
          icon: 'SparklesIcon',
          color: 'blue',
          members: [],
          meetings: 'Quarta-Feira 20:00hrs',
          location: '',
          leader: '',
          leaderPhone: '',
          leaderEmail: '',
          features: [],
          isPopular: true,
          isActive: true,
          maxMembers: 20,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'women',
          title: 'Célula Resgate Quadra 45',
          subtitle: 'Mulheres de Fé',
          description: 'Um espaço seguro para mulheres compartilharem experiências, orarem e se apoiarem mutuamente.',
          image: '/img/women-group.jpg',
          icon: 'HeartIcon',
          color: 'green',
          members: [],
          meetings: 'Quarta-Feira 20:00hrs',
          location: '',
          leader: '',
          leaderPhone: '',
          leaderEmail: '',
          features: [],
          isPopular: false,
          isActive: true,
          maxMembers: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'men',
          title: 'Célula Resgate Quadra 34',
          subtitle: 'Homens de Propósito',
          description: 'Homens de fé se reúnem para discutir desafios, buscar sabedoria e fortalecer seu propósito.',
          image: '/img/men-group.jpg',
          icon: 'UserGroupIcon',
          color: 'green',
          members: [],
          meetings: 'Quarta-Feira 20:00hrs',
          location: '',
          leader: '',
          leaderPhone: '',
          leaderEmail: '',
          features: [],
          isPopular: false,
          isActive: true,
          maxMembers: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setGroups(defaultGroups);
    }
  }, []);

  // Salvar grupos no armazenamento local sempre que houver mudanças
  useEffect(() => {
    if (groups.length > 0) {
      storage.setJSON('cellGroups', groups);
      // Também salvar uma versão pública para o site
      storage.setJSON(
        'publicCellGroups',
        groups.map(group => ({
          id: group.id,
          title: group.title,
          subtitle: group.subtitle,
          description: group.description,
          image: group.image || '', // Incluir imagem na sincronização
          icon: group.icon,
          color: group.color,
          members: 0, // Sempre mostrar 0 para não exibir quantidade
          meetings: group.meetings,
          location: group.location,
          leader: group.leader,
          features: [], // Sempre array vazio para não exibir atividades
          isPopular: group.isPopular,
          isActive: group.isActive,
          maxMembers: group.maxMembers
        }))
      );
    }
  }, [groups]);

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      HomeIcon,
      SparklesIcon,
      HeartIcon,
      UserGroupIcon,
      ClockIcon,
      StarIcon,
      EyeIcon,
      MapPinIcon
    };
    return icons[iconName] || UserGroupIcon;
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-500',
        light: 'bg-blue-50 dark:bg-blue-900',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-700'
      },
      green: {
        bg: 'bg-green-500',
        light: 'bg-green-50 dark:bg-green-900',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-700'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const handleLeaderChange = (groupId: string, field: string, value: string) => {
    setGroups(prevGroups =>
      prevGroups.map(group =>
        group.id === groupId ? { ...group, [field]: value, updatedAt: new Date().toISOString() } : group
      )
    );
  };

  const openAddMemberModal = (group: CellGroup) => {
    setSelectedGroup(group);
    setEditingMember(null);
    setMemberForm({ name: '', email: '', phone: '' });
    setMemberFormErrors({ name: false, email: false, phone: false });
    setShowMemberModal(true);
  };

  const openEditMemberModal = (group: CellGroup, member: Member) => {
    setSelectedGroup(group);
    setEditingMember(member);
    setMemberForm({ name: member.name, email: member.email || '', phone: member.phone || '' });
    setMemberFormErrors({ name: false, email: false, phone: false });
    setShowMemberModal(true);
  };

  const closeMemberModal = () => {
    setShowMemberModal(false);
    setSelectedGroup(null);
    setEditingMember(null);
  };

  const handleMemberFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMemberForm(prev => ({ ...prev, [name]: value }));
    setMemberFormErrors(prev => ({ ...prev, [name]: false }));
  };

  const validateMemberForm = () => {
    let isValid = true;
    const newErrors = { name: false, email: false, phone: false };

    if (!memberForm.name.trim()) {
      newErrors.name = true;
      isValid = false;
    }
    if (memberForm.email && !/\S+@\S+\.\S+/.test(memberForm.email)) {
      newErrors.email = true;
      isValid = false;
    }
    if (memberForm.phone && !/^\d{10,11}$/.test(memberForm.phone.replace(/\D/g, ''))) {
      newErrors.phone = true;
      isValid = false;
    }

    setMemberFormErrors(newErrors);
    return isValid;
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !validateMemberForm()) return;

    const today = new Date().toISOString().split('T')[0];

    if (editingMember) {
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group.id === selectedGroup.id
            ? {
                ...group,
                members: group.members.map(member =>
                  member.id === editingMember.id
                    ? { ...member, ...memberForm }
                    : member
                ),
                updatedAt: new Date().toISOString()
              }
            : group
        )
      );
      toast.success('Membro atualizado com sucesso!');
    } else {
      const newMember: Member = {
        id: Date.now().toString(),
        name: memberForm.name,
        email: memberForm.email,
        phone: memberForm.phone,
        joinDate: today,
      };
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group.id === selectedGroup.id
            ? { 
                ...group, 
                members: [...group.members, newMember],
                updatedAt: new Date().toISOString()
              }
            : group
        )
      );
      toast.success('Membro adicionado com sucesso!');
    }
    closeMemberModal();
  };

  const handleDeleteMember = (groupId: string, memberId: string) => {
    if (window.confirm('Tem certeza que deseja remover este membro?')) {
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group.id === groupId
            ? { 
                ...group, 
                members: group.members.filter(member => member.id !== memberId),
                updatedAt: new Date().toISOString()
              }
            : group
        )
      );
      toast.success('Membro removido com sucesso!');
    }
  };

  const toggleGroupStatus = (groupId: string) => {
    setGroups(prevGroups =>
      prevGroups.map(group =>
        group.id === groupId 
          ? { ...group, isActive: !group.isActive, updatedAt: new Date().toISOString() }
          : group
      )
    );
    toast.success('Status do grupo atualizado!');
  };

  const filteredGroups = groups.filter(group => {
    if (filterActive === null) return true;
    return group.isActive === filterActive;
  });

  return (
    <div className="min-h-[100dvh] bg-gray-100 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Administração de Células Resgate
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie as células da igreja, líderes e membros
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterActive(null)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filterActive === null 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Todos ({groups.length})
          </button>
          <button
            onClick={() => setFilterActive(true)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filterActive === true 
                ? 'bg-green-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Ativos ({groups.filter(g => g.isActive).length})
          </button>
          <button
            onClick={() => setFilterActive(false)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filterActive === false 
                ? 'bg-red-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Inativos ({groups.filter(g => !g.isActive).length})
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
            className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {viewMode === 'cards' ? <EyeIcon className="h-5 w-5" /> : <UserGroupIcon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja resetar todos os dados dos grupos celulares? Isso irá restaurar os dados padrão.')) {
                storage.remove('cellGroups');
                storage.remove('publicCellGroups');
                storage.remove('cellGroupsLastSync');
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-red-600 text-white border border-red-600 rounded-lg font-medium hover:bg-red-700"
          >
            Resetar Dados
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      <div className={`grid gap-6 ${viewMode === 'cards' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1'}`}>
        {filteredGroups.map(group => {
          const colors = getColorClasses(group.color);
          const IconComponent = getIconComponent(group.icon);
          
          return (
            <div key={group.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${!group.isActive ? 'opacity-60' : ''}`}>
              {/* Group Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`${colors.bg} p-3 rounded-full mr-4`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{group.title}</h2>
                    <p className={`text-sm font-semibold ${colors.text}`}>{group.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {group.isPopular && (
                    <StarIcon className="h-5 w-5 text-yellow-500" aria-label="Grupo Popular" />
                  )}
                  <button
                    onClick={() => toggleGroupStatus(group.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      group.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {group.isActive ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{group.description}</p>

              {/* Upload de Imagem */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagem da Célula:
                </label>
                <ImageUpload
                  currentImage={group.image}
                  onImageChange={(imageData) => handleLeaderChange(group.id, 'image', imageData || '')}
                  maxSize={5}
                  className="w-full"
                />
              </div>

              {/* Leader Section */}
              <div className="mb-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Líder do Grupo:
                </label>
                <input
                  type="text"
                  value={group.leader}
                  onChange={(e) => handleLeaderChange(group.id, 'leader', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Nome do Líder"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    value={group.leaderPhone || ''}
                    onChange={(e) => handleLeaderChange(group.id, 'leaderPhone', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Telefone"
                  />
                  <input
                    type="email"
                    value={group.leaderEmail || ''}
                    onChange={(e) => handleLeaderChange(group.id, 'leaderEmail', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Email"
                  />
                </div>
              </div>

              {/* Group Info */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  {group.meetings}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  <input
                    type="text"
                    value={group.location}
                    onChange={(e) => handleLeaderChange(group.id, 'location', e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Local da célula"
                  />
                </div>
              </div>

              {/* Members List */}
              {group.members.length > 0 && (
                <div className="mt-4 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                  <ul className="space-y-2">
                    {group.members.map(member => (
                      <li key={member.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                        <div>
                          <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">{member.name}</span>
                          {member.email && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditMemberModal(group, member)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Editar Membro"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(group.id, member.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Remover Membro"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Member Add/Edit Modal */}
      {showMemberModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}
              </h3>
              <button onClick={closeMemberModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={memberForm.name}
                  onChange={handleMemberFormChange}
                  className={`mt-1 block w-full px-3 py-2 border ${memberFormErrors.name ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                  required
                />
                {memberFormErrors.name && <p className="text-red-500 text-xs mt-1">O nome é obrigatório.</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={memberForm.email}
                  onChange={handleMemberFormChange}
                  className={`mt-1 block w-full px-3 py-2 border ${memberFormErrors.email ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                />
                {memberFormErrors.email && <p className="text-red-500 text-xs mt-1">E-mail inválido.</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={memberForm.phone}
                  onChange={handleMemberFormChange}
                  className={`mt-1 block w-full px-3 py-2 border ${memberFormErrors.phone ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                />
                {memberFormErrors.phone && <p className="text-red-500 text-xs mt-1">Telefone inválido (apenas números, 10-11 dígitos).</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                {editingMember ? (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Atualizar Membro
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Adicionar Membro
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CellGroupsAdmin;
