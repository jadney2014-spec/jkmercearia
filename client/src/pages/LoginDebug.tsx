import React, { useState } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { toast } from 'react-toastify';

const LoginDebug: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { login } = useAuth();

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const testFunctions = async () => {
    addDebugInfo('ðŸ§ª Testando Netlify Functions...');
    
    try {
      // Teste Health
      addDebugInfo('Testando health check...');
      const healthResponse = await fetch('/.netlify/functions/health');
      const healthData = await healthResponse.json();
      addDebugInfo(`Health: ${healthResponse.status} - ${JSON.stringify(healthData)}`);
      
      // Teste Login Debug
      addDebugInfo('Testando login debug...');
      const loginResponse = await fetch('/.netlify/functions/auth-login-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'password123'
        })
      });
      
      const loginData = await loginResponse.text();
      addDebugInfo(`Login Debug: ${loginResponse.status} - ${loginData}`);
      
      // Teste Login Simple
      addDebugInfo('Testando login simple...');
      const loginSimpleResponse = await fetch('/.netlify/functions/auth-login-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'password123'
        })
      });
      
      const loginSimpleData = await loginSimpleResponse.text();
      addDebugInfo(`Login Simple: ${loginSimpleResponse.status} - ${loginSimpleData}`);
      
      // Teste Login Original
      addDebugInfo('Testando login original...');
      const loginOriginalResponse = await fetch('/.netlify/functions/auth-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'password123'
        })
      });
      
      const loginOriginalData = await loginOriginalResponse.text();
      addDebugInfo(`Login Original: ${loginOriginalResponse.status} - ${loginOriginalData}`);
      
    } catch (error: any) {
      addDebugInfo(`âŒ Erro: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    addDebugInfo('ðŸš€ Iniciando login...');

    try {
      addDebugInfo(`Tentando login com: ${formData.email}`);
      await login(formData.email, formData.password);
      addDebugInfo('âœ… Login realizado com sucesso!');
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      addDebugInfo(`âŒ Erro no login: ${error.message}`);
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Login Debug - Tesouraria
          </h2>
        </div>

        <button
          onClick={testFunctions}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 mb-4"
        >
          ðŸ§ª Testar Functions
        </button>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="password123"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Fazendo login...' : 'Entrar'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h3>
          <div className="bg-gray-100 p-3 rounded-md max-h-40 overflow-y-auto text-xs">
            {debugInfo.map((info, index) => (
              <div key={index} className="mb-1">{info}</div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};

export default LoginDebug;
