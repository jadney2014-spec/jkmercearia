import { logger } from './logger';
import { toast } from 'react-toastify';
import { fixUtf8Mojibake } from './textEncoding';

/**
 * Classe base para erros customizados da aplicação
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    statusCode?: number,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Mantém o stack trace correto
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Erro de validação
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      true,
      field ? { field } : undefined
    );
    this.name = 'ValidationError';
  }
}

/**
 * Erro de autenticação
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autenticado') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
    this.name = 'AuthenticationError';
  }
}

/**
 * Erro de autorização
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
    this.name = 'AuthorizationError';
  }
}

/**
 * Erro de recurso não encontrado
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} não encontrado`, 'NOT_FOUND_ERROR', 404, true);
    this.name = 'NotFoundError';
  }
}

/**
 * Erro de API/Network
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Erro de conexão com o servidor') {
    super(message, 'NETWORK_ERROR', 0, false);
    this.name = 'NetworkError';
  }
}

/**
 * Tratador centralizado de erros
 */
export class ErrorHandler {
  /**
   * Trata um erro e retorna uma mensagem amigável
   */
  static handle(error: unknown, showToast: boolean = true): string {
    let errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';
    let errorCode = 'UNKNOWN_ERROR';

    // Se for uma instância de AppError
    if (error instanceof AppError) {
      errorMessage = error.message;
      errorCode = error.code;

      // Log do erro
      if (error.isOperational) {
        logger.warn(`Erro operacional [${error.code}]:`, error.message, error.context);
      } else {
        logger.error(`Erro crítico [${error.code}]:`, error, error.context);
      }
    }
    // Se for um Error padrão
    else if (error instanceof Error) {
      errorMessage = error.message;
      errorCode = 'STANDARD_ERROR';
      logger.error('Erro padrão:', error);
    }
    // Se for uma resposta de API (axios)
    else if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const status = apiError.response?.status;
      const data = apiError.response?.data;

      if (status === 401) {
        errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
        errorCode = 'SESSION_EXPIRED';
      } else if (status === 403) {
        errorMessage = 'Você não tem permissão para realizar esta ação.';
        errorCode = 'FORBIDDEN';
      } else if (status === 404) {
        errorMessage = 'Recurso não encontrado.';
        errorCode = 'NOT_FOUND';
      } else if (status === 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
        errorCode = 'SERVER_ERROR';
      } else {
        errorMessage = data?.error || data?.message || errorMessage;
        errorCode = `API_ERROR_${status || 'UNKNOWN'}`;
      }

      logger.error(`Erro de API [${errorCode}]:`, error);
    }
    // Erro desconhecido
    else {
      logger.error('Erro desconhecido:', error);
    }

    // Mostrar toast se solicitado
    if (showToast) {
      toast.error(fixUtf8Mojibake(errorMessage));
    }

    return fixUtf8Mojibake(errorMessage);
  }

  /**
   * Trata erro silenciosamente (sem toast)
   */
  static handleSilent(error: unknown): string {
    return this.handle(error, false);
  }

  /**
   * Verifica se o erro é operacional (pode ser tratado pelo usuário)
   */
  static isOperational(error: unknown): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Extrai código de erro
   */
  static getErrorCode(error: unknown): string {
    if (error instanceof AppError) {
      return error.code;
    }
    if (error instanceof Error) {
      return 'STANDARD_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }
}

/**
 * Wrapper para funções assíncronas com tratamento de erro automático
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const message = errorMessage || 'Erro ao executar operação';
      ErrorHandler.handle(error);
      throw error;
    }
  }) as T;
}



