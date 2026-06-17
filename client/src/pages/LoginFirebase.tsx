import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase/AuthContext';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { appPath } from '../constants/app';

type AuthMode = 'login' | 'register';

const LoginFirebase: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      navigate(appPath('welcome'), { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getErrorMessage = (err: any) => {
    const code = err?.code;
    if (code === 'auth/user-not-found') return 'Usuário não encontrado. Verifique o e-mail.';
    if (code === 'auth/wrong-password') return 'Senha incorreta. Tente novamente.';
    if (code === 'auth/invalid-email') return 'E-mail inválido. Verifique o formato.';
    if (code === 'auth/user-disabled') return 'Esta conta foi desabilitada.';
    if (code === 'auth/too-many-requests') return 'Muitas tentativas. Aguarde alguns minutos.';
    if (code === 'auth/invalid-credential') return 'E-mail ou senha incorretos.';
    if (code === 'auth/email-already-in-use') return 'Este e-mail já está cadastrado.';
    if (code === 'auth/weak-password') return 'Senha muito fraca. Use pelo menos 6 caracteres.';
    if (code === 'auth/operation-not-allowed') return 'Login por e-mail não está habilitado no Firebase.';
    return err?.message || 'Erro ao processar solicitação';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email.trim(), formData.password);
      toast.success('Login realizado com sucesso!');
      navigate(appPath('welcome'), { replace: true });
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Informe seu nome.');
      return;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      await register(formData.email.trim(), formData.password, formData.name.trim());
      toast.success('Conta criada com sucesso! Bem-vindo ao sistema.');
      navigate(appPath('welcome'), { replace: true });
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setError('');

    const email = formData.email.trim();
    if (!email) {
      toast.error('Informe seu e-mail para receber o link de redefinição.');
      return;
    }

    try {
      await resetPassword(email);
      toast.success('Enviamos um e-mail com instruções para redefinir sua senha.');
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-10 text-center">
            <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-4 overflow-hidden">
              <img src="/img/ICONE-RESGATE.png" alt="JK Logo" className="h-full w-full object-contain p-1" />
            </div>
            <h2 className="text-2xl font-bold text-white">Sistema de Vendas</h2>
            <p className="mt-2 text-green-100 text-sm">JK Mercearia — Acesso por e-mail</p>
          </div>

          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Criar conta
            </button>
          </div>

          <div className="px-8 py-8">
            <form className="space-y-5" onSubmit={mode === 'login' ? handleLogin : handleRegister}>
              {mode === 'register' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    className={`block w-full pl-10 pr-12 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => { handleChange(e); setError(''); }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar senha
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Repita a senha"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <a
                    href="#"
                    onClick={handleForgotPassword}
                    className="text-sm font-medium text-green-600 hover:text-green-500"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Aguarde...
                  </span>
                ) : mode === 'login' ? (
                  'Entrar no sistema'
                ) : (
                  'Criar minha conta'
                )}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-8 py-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JK Mercearia — Sistema de Vendas
            </p>
          </div>
        </div>

        {mode === 'register' && (
          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            O primeiro usuário cadastrado recebe permissão de administrador automaticamente.
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginFirebase;
