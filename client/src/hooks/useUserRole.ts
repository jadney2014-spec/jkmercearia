// Hook para gerenciar roles e permissões do usuário
import { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserRole, UserProfile } from '../types/Role';

interface UseUserRoleReturn {
  role: UserRole;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isLider: boolean;
  isMembro: boolean;
  isSecretaria: boolean;
  isTesouraria: boolean;
  isMidia: boolean;
  updateRole: (newRole: UserRole, ministerioId?: string) => Promise<void>;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user, authReady } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady) {
      setLoading(true);
      return;
    }

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const profileRef = doc(db, 'user_profiles', user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile({
            id: profileSnap.id,
            email: data.email || user.email || '',
            name: data.name || user.displayName || '',
            role: data.role || 'membro',
            financeiro_access: !!data.financeiro_access,
            ministerio_id: data.ministerio_id,
            ministerio_nome: data.ministerio_nome,
            phone: data.phone,
            photoURL: data.photoURL || user.photoURL,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          });
        } else {
          // Criar perfil padrão se não existir
          const defaultProfile: UserProfile = {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            role: 'membro',
            financeiro_access: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          await setDoc(profileRef, {
            ...defaultProfile,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          setProfile(defaultProfile);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil do usuário:', error);
        // Perfil padrão em caso de erro
        setProfile({
          id: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          role: 'membro',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [authReady, user]);

  const updateRole = async (newRole: UserRole, ministerioId?: string) => {
    if (!user) return;

    try {
      const profileRef = doc(db, 'user_profiles', user.uid);
      const updateData: any = {
        role: newRole,
        updatedAt: new Date(),
      };

      if (ministerioId) {
        updateData.ministerio_id = ministerioId;
      }

      await setDoc(profileRef, updateData, { merge: true });
      
      setProfile(prev => prev ? {
        ...prev,
        role: newRole,
        ministerio_id: ministerioId,
      } : null);
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      throw error;
    }
  };

  const role = profile?.role || 'membro';

  return {
    role,
    profile,
    loading,
    isAdmin: role === 'admin',
    isLider: role === 'lider',
    isMembro: role === 'membro',
    isSecretaria: role === 'secretaria',
    isTesouraria: role === 'tesouraria',
    isMidia: role === 'midia',
    updateRole,
  };
};
