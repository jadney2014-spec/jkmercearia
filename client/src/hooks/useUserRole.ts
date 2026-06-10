import { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, setDoc, limit, query } from 'firebase/firestore';
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
  isVendedor: boolean;
  isMidia: boolean;
  updateRole: (newRole: UserRole) => Promise<void>;
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
            role: data.role || 'vendedor',
            phone: data.phone,
            photoURL: data.photoURL || user.photoURL,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          });
        } else {
          const profilesQuery = query(collection(db, 'user_profiles'), limit(1));
          const existingProfiles = await getDocs(profilesQuery);
          const isFirstUser = existingProfiles.empty;

          const defaultProfile: UserProfile = {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || user.email?.split('@')[0] || 'Usuário',
            role: isFirstUser ? 'admin' : 'vendedor',
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
        setProfile({
          id: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          role: 'vendedor',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [authReady, user]);

  const updateRole = async (newRole: UserRole) => {
    if (!user) return;

    const profileRef = doc(db, 'user_profiles', user.uid);
    await setDoc(profileRef, { role: newRole, updatedAt: new Date() }, { merge: true });

    setProfile((prev) => (prev ? { ...prev, role: newRole } : null));
  };

  const role = profile?.role || 'vendedor';

  return {
    role,
    profile,
    loading,
    isAdmin: role === 'admin',
    isLider: role === 'lider',
    isMembro: role === 'membro',
    isSecretaria: role === 'secretaria',
    isTesouraria: role === 'tesouraria' || role === 'vendedor',
    isVendedor: role === 'vendedor' || role === 'tesouraria',
    isMidia: role === 'midia',
    updateRole,
  };
};
