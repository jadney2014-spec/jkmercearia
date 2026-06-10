import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './config';
import storage from '../utils/storage';
import { registerNativePush } from '../utils/nativePush';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    console.log('ðŸ”„ Firebase Auth useEffect executado');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('ðŸ‘¤ Estado do usuário mudou:', user ? user.email : 'null');
      setUser(user);
      setLoading(false);
      setAuthReady(true);

      // Push nativo (APK): registra token FCM e salva no Firestore
      // Isso habilita notificações em massa via tópico (Cloud Functions)
      if (user) {
        registerNativePush().catch(() => {});
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('ðŸ” Iniciando login Firebase para:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('âœ… Login Firebase realizado com sucesso');
    } catch (error: any) {
      console.error('âŒ Erro no login Firebase:', error);
      
      // Preservar o erro original do Firebase para tratamento específico
      const firebaseError = error;
      
      // Criar erro com código do Firebase para tratamento específico
      const customError: any = new Error(firebaseError.message || 'Erro ao fazer login');
      customError.code = firebaseError.code;
      
      throw customError;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      console.log('ðŸ“ Iniciando registro Firebase para:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Atualizar perfil com nome
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      
      console.log('âœ… Registro Firebase realizado com sucesso');
    } catch (error: any) {
      console.error('âŒ Erro no registro Firebase:', error);
      throw new Error(error.message || 'Erro ao criar conta');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      const firebaseError = error;
      const customError: any = new Error(firebaseError.message || 'Erro ao enviar email de redefinição');
      customError.code = firebaseError.code;
      throw customError;
    }
  };

  const logout = async () => {
    try {
      console.log('ðŸšª Fazendo logout Firebase');
      await signOut(auth);
      console.log('âœ… Logout Firebase realizado com sucesso');
      
      // Limpar dados locais
      storage.remove('token');
      sessionStorage.clear();
      
      // Redirecionar para página de logout
      window.location.href = '/logout';
    } catch (error: any) {
      console.error('âŒ Erro no logout Firebase:', error);
      throw new Error('Erro ao fazer logout');
    }
  };

  const value = {
    user,
    loading,
    authReady,
    login,
    register,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
