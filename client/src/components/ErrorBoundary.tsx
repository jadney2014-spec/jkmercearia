import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isUndefinedError = error.message.includes('undefined') || error.message.includes('Element type is invalid');
    // Log do erro
    logger.error('ErrorBoundary capturou um erro:', error, errorInfo);
    
    // Se for erro de componente undefined, logar mais detalhes
    if (isUndefinedError) {
      console.error('âŒ ERRO DE COMPONENTE UNDEFINED DETECTADO:');
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
      console.error('Component Stack:', errorInfo.componentStack);
    }
    
    this.setState({
      error,
      errorInfo
    });

    // Callback opcional para tratamento externo (ex: enviar para serviço de monitoramento)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }


  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Se houver um fallback customizado, usar ele
      if (this.props.fallback) {
        // Validar que o fallback não é undefined
        if (this.props.fallback === undefined || this.props.fallback === null) {
          console.error('âŒ ErrorBoundary: fallback é undefined ou null');
          // Usar fallback padrão se o customizado for inválido
        } else {
          return this.props.fallback;
        }
      }

      // Fallback padrão
      return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Ops! Algo deu errado
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Encontramos um erro inesperado. Por favor, tente novamente.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                  Detalhes do erro (apenas em desenvolvimento):
                </p>
                <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Tentar Novamente
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Recarregar Página
              </button>
            </div>

            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    // Validar que children não é undefined
    if (this.props.children === undefined || this.props.children === null) {
      console.error('âŒ ErrorBoundary: children é undefined ou null');
      return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Erro: Componente inválido
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Um componente necessário não foi encontrado.
            </p>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary;



