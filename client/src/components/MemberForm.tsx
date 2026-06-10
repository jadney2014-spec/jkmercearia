import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { membersAPI } from '../services/api';

interface Member {
  id: number | string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  cpf?: string;
  cell_group?: string;
  photo_url?: string;
  birth_date?: string;
  member_since?: string;
  status: string;
  notes?: string;
}

interface MemberFormProps {
  member?: Member | null;
  onSave: (data: any) => void;
  onClose: () => void;
  isSaving?: boolean;
}

const MemberForm: React.FC<MemberFormProps> = ({ member, onSave, onClose, isSaving = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    cpf: '',
    cell_group: '',
    photo_url: '',
    birth_date: '',
    member_since: '',
    status: 'active',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const currentMemberIdRef = useRef<string | number | null>(null);

  // Helper para formatar data para input type="date" (YYYY-MM-DD)
  // Usa métodos UTC para evitar problemas de fuso horário
  const formatDateForInput = (dateValue: string | undefined | null): string => {
    if (!dateValue) return '';
    
    // Se já está no formato YYYY-MM-DD, retornar como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Tentar extrair YYYY-MM-DD de strings em outros formatos
    const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      return dateMatch[0]; // Retornar YYYY-MM-DD
    }
    
    // Tentar converter de outros formatos usando UTC para evitar problemas de timezone
    try {
      // Se a string tem formato de data, fazer parse manual para evitar problemas de timezone
      const parts = dateValue.split(/[-\/]/);
      if (parts.length === 3) {
        let year, month, day;
        
        // Detectar formato (DD/MM/YYYY ou YYYY-MM-DD)
        if (parts[0].length === 4) {
          // YYYY-MM-DD ou YYYY/MM/DD
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
        } else {
          // DD/MM/YYYY ou DD-MM-YYYY
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
        }
        
        // Validar valores
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
      
      // Fallback: usar Date com UTC
      const date = new Date(dateValue + 'T00:00:00Z'); // Adicionar hora UTC para evitar problemas
      if (isNaN(date.getTime())) return '';
      
      // Usar métodos UTC para evitar problemas de fuso horário
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    // Só atualizar quando o membro realmente mudar (comparar por ID)
    if (member) {
      const memberId = member.id;
      
      // Se é o mesmo membro que já está sendo editado, não resetar os dados
      if (currentMemberIdRef.current === memberId) {
        return; // Preservar dados que o usuário pode estar editando
      }
      
      // Novo membro ou membro diferente - carregar dados
      currentMemberIdRef.current = memberId;
      setFormData({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        address: member.address || '',
        cpf: member.cpf || '',
        cell_group: member.cell_group || '',
        photo_url: member.photo_url || '',
        birth_date: formatDateForInput(member.birth_date),
        member_since: formatDateForInput(member.member_since),
        status: member.status || 'active',
        notes: member.notes || ''
      });
      setPhotoPreview(member.photo_url || '');
    } else {
      // Resetar apenas se realmente não há membro
      if (currentMemberIdRef.current !== null) {
        currentMemberIdRef.current = null;
        // Resetar formulário apenas se estiver vazio (usuário pode estar preenchendo)
        setFormData(prev => {
          // Se o usuário já começou a preencher, não resetar
          if (prev.name || prev.email || prev.phone || prev.birth_date) {
            return prev;
          }
          // Resetar apenas se estiver completamente vazio
          return {
            name: '',
            email: '',
            phone: '',
            address: '',
            cpf: '',
            cell_group: '',
            photo_url: '',
            birth_date: '',
            member_since: '',
            status: 'active',
            notes: ''
          };
        });
        setPhotoPreview('');
      }
    }
  }, [member?.id]); // Depender apenas do ID para evitar re-renders desnecessários

  const handleSelectPhoto = async (file: File | null) => {
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Falha ao converter imagem'));
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
      });
      setFormData((prev: any) => ({ ...prev, photo_url: dataUrl }));
      setPhotoPreview(dataUrl);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Para campos de data, garantir que o valor seja preservado
    let processedValue = value;
    if (name === 'birth_date' || name === 'member_since') {
      // Se o campo de data estiver vazio ou no formato correto, usar como está
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        // Tentar converter se não estiver no formato correto
        processedValue = formatDateForInput(value) || value;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.phone && !/^[\d\s()\-+]+$/.test(formData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    if (formData.cpf) {
      const digits = formData.cpf.replace(/\D/g, '');
      if (digits.length !== 11) {
        newErrors.cpf = 'CPF inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que onSave existe e é uma função
    if (!onSave || typeof onSave !== 'function') {
      console.error('âŒ onSave não é uma função válida:', onSave);
      return;
    }
    
    if (validateForm()) {
      try {
        onSave(formData);
      } catch (error) {
        console.error('âŒ Erro ao chamar onSave:', error);
      }
    }
  };

  // Auto-scroll para campo ativo quando teclado aparece (mobile)
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (window.innerWidth <= 640) {
      // Pequeno delay para garantir que o teclado apareceu
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4 sm:space-y-5">
        {/* Nome */}
        <div>
          <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={`input mt-1 ${errors.name ? 'border-red-500' : ''}`}
            value={formData.name}
            onChange={handleChange}
            onFocus={handleInputFocus}
            placeholder="Nome completo"
            autoComplete="name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cpf" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
              CPF
            </label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              className={`input mt-1 ${errors.cpf ? 'border-red-500' : ''}`}
              value={(formData as any).cpf}
              onChange={handleChange}
              onFocus={handleInputFocus}
              placeholder="Somente números"
              inputMode="numeric"
            />
            {errors.cpf && (
              <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>
            )}
          </div>

          <div>
            <label htmlFor="cell_group" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
              Célula
            </label>
            <select
              id="cell_group"
              name="cell_group"
              className="input mt-1"
              value={(formData as any).cell_group}
              onChange={handleChange}
              onFocus={handleInputFocus}
            >
              <option value="">Selecione</option>
              <option value="Célula quadra 45">Célula quadra 45</option>
              <option value="Veredas">Veredas</option>
              <option value="Igreja">Igreja</option>
              <option value="Vendinha">Vendinha</option>
              <option value="Não possuo célula">Não possuo célula</option>
            </select>
          </div>
        </div>

        {/* Email e Telefone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`input mt-1 ${errors.email ? 'border-red-500' : ''}`}
              value={formData.email}
              onChange={handleChange}
              onFocus={handleInputFocus}
              placeholder="email@exemplo.com"
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className={`input mt-1 ${errors.phone ? 'border-red-500' : ''}`}
              value={formData.phone}
              onChange={handleChange}
              onFocus={handleInputFocus}
              placeholder="(11) 99999-9999"
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Endereço */}
        <div>
          <label htmlFor="address" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
            Endereço
          </label>
          <input
            type="text"
            id="address"
            name="address"
            className="input mt-1"
            value={formData.address}
            onChange={handleChange}
            onFocus={handleInputFocus}
            placeholder="Endereço completo"
            autoComplete="street-address"
          />
        </div>

        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
            Foto
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="member_photo_file"
              onChange={(e) => handleSelectPhoto(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="member_photo_file"
              className={`btn btn-secondary min-h-[44px] ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploadingPhoto ? 'Enviando...' : 'Selecionar foto'}
            </label>

            {(photoPreview || (formData as any).photo_url) && (
              <a
                href={photoPreview || (formData as any).photo_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary-600 hover:underline"
              >
                Ver
              </a>
            )}
          </div>

          {(photoPreview || (formData as any).photo_url) && (
            <div className="mt-3">
              <img
                src={photoPreview || (formData as any).photo_url}
                alt="Foto do membro"
                className="w-20 h-20 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
              />
            </div>
          )}
        </div>

        {/* Data de Nascimento e Membro Desde */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="birth_date" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de Nascimento
            </label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              className="input mt-1"
              value={formData.birth_date}
              onChange={handleChange}
              onFocus={handleInputFocus}
            />
          </div>

          <div>
            <label htmlFor="member_since" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
              Membro Desde
            </label>
            <input
              type="date"
              id="member_since"
              name="member_since"
              className="input mt-1"
              value={formData.member_since}
              onChange={handleChange}
              onFocus={handleInputFocus}
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="input mt-1"
            value={formData.status}
            onChange={handleChange}
            onFocus={handleInputFocus}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        {/* Observações */}
        <div>
          <label htmlFor="notes" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
            Observações
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="input mt-1 min-h-[100px] resize-y"
            value={formData.notes}
            onChange={handleChange}
            onFocus={handleInputFocus}
            placeholder="Observações adicionais..."
          />
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse mt-6 -mx-6 -mb-6 rounded-b-lg gap-3 sm:gap-0">
        {Button ? (
          <>
            <Button
              type="submit"
              className="sm:ml-3 sm:w-auto w-full min-h-[44px]"
              loading={isSaving}
            >
              {member ? 'Atualizar' : 'Criar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="mt-3 sm:mt-0 sm:w-auto w-full min-h-[44px]"
            >
              Cancelar
            </Button>
          </>
        ) : (
          <div className="text-red-600">Erro: Componente Button não encontrado</div>
        )}
      </div>
    </form>
  );
};

export default MemberForm;
