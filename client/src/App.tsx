import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './firebase/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import SistemaVendasApp from './SistemaVendasApp';
import ErrorBoundary from './components/ErrorBoundary';
import PageErrorFallback from './components/PageErrorFallback';
import { firebaseConfigStatus } from './firebase/config';

function LegacyTesourariaRedirect() {
  const location = useLocation();
  const newPath = location.pathname.replace(/^\/tesouraria/, '/sistema-vendas');
  return <Navigate to={newPath + location.search} replace />;
}

function App() {
  if (!firebaseConfigStatus.ok) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Não foi possível iniciar o app
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A configuração do Firebase está incompleta. Recarregue a página ou tente novamente mais tarde.
          </p>

          {process.env.NODE_ENV === 'development' && firebaseConfigStatus.missing?.length > 0 && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
              <p className="text-xs text-red-700 dark:text-red-300 break-all">
                Faltando: {firebaseConfigStatus.missing.join(', ')}
              </p>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ErrorBoundary fallback={<PageErrorFallback />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/sistema-vendas" replace />} />
                  <Route path="/tesouraria/*" element={<LegacyTesourariaRedirect />} />
                  <Route path="/sistema-vendas/*" element={<SistemaVendasApp />} />
                </Routes>
              </ErrorBoundary>
            </Router>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
