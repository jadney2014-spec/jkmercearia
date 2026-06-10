import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  NetworkError,
  ErrorHandler,
} from '../errors';

describe('AppError', () => {
  it('deve criar erro com mensagem e código', () => {
    const error = new AppError('Test error', 'TEST_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.isOperational).toBe(true);
  });

  it('deve criar erro com statusCode', () => {
    const error = new AppError('Test error', 'TEST_ERROR', 400);
    expect(error.statusCode).toBe(400);
  });

  it('deve criar erro com context', () => {
    const context = { field: 'email', value: 'test@example.com' };
    const error = new AppError('Test error', 'TEST_ERROR', 400, true, context);
    expect(error.context).toEqual(context);
  });
});

describe('ValidationError', () => {
  it('deve criar erro de validação', () => {
    const error = new ValidationError('Campo inválido', 'email');
    expect(error.message).toBe('Campo inválido');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.context?.field).toBe('email');
  });
});

describe('AuthenticationError', () => {
  it('deve criar erro de autenticação', () => {
    const error = new AuthenticationError();
    expect(error.message).toBe('Não autenticado');
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.statusCode).toBe(401);
  });
});

describe('AuthorizationError', () => {
  it('deve criar erro de autorização', () => {
    const error = new AuthorizationError();
    expect(error.message).toBe('Não autorizado');
    expect(error.code).toBe('AUTHORIZATION_ERROR');
    expect(error.statusCode).toBe(403);
  });
});

describe('NotFoundError', () => {
  it('deve criar erro de não encontrado', () => {
    const error = new NotFoundError('Usuário');
    expect(error.message).toBe('Usuário não encontrado');
    expect(error.code).toBe('NOT_FOUND_ERROR');
    expect(error.statusCode).toBe(404);
  });
});

describe('NetworkError', () => {
  it('deve criar erro de rede', () => {
    const error = new NetworkError();
    expect(error.message).toBe('Erro de conexão com o servidor');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.isOperational).toBe(false);
  });
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('deve tratar AppError corretamente', () => {
      const error = new ValidationError('Campo inválido');
      const message = ErrorHandler.handle(error, false);
      expect(message).toBe('Campo inválido');
    });

    it('deve tratar Error padrão corretamente', () => {
      const error = new Error('Erro padrão');
      const message = ErrorHandler.handle(error, false);
      expect(message).toBe('Erro padrão');
    });

    it('deve tratar erro de API 401', () => {
      const error = {
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
      };
      const message = ErrorHandler.handle(error, false);
      expect(message).toBe('Sua sessão expirou. Por favor, faça login novamente.');
    });

    it('deve tratar erro de API 404', () => {
      const error = {
        response: {
          status: 404,
          data: { error: 'Not Found' },
        },
      };
      const message = ErrorHandler.handle(error, false);
      expect(message).toBe('Recurso não encontrado.');
    });

    it('deve tratar erro desconhecido', () => {
      const error = 'String error';
      const message = ErrorHandler.handle(error, false);
      expect(message).toBe('Ocorreu um erro inesperado. Tente novamente.');
    });
  });

  describe('isOperational', () => {
    it('deve retornar true para erro operacional', () => {
      const error = new ValidationError('Test');
      expect(ErrorHandler.isOperational(error)).toBe(true);
    });

    it('deve retornar false para erro não operacional', () => {
      const error = new NetworkError();
      expect(ErrorHandler.isOperational(error)).toBe(false);
    });

    it('deve retornar false para erro padrão', () => {
      const error = new Error('Test');
      expect(ErrorHandler.isOperational(error)).toBe(false);
    });
  });

  describe('getErrorCode', () => {
    it('deve retornar código de AppError', () => {
      const error = new ValidationError('Test');
      expect(ErrorHandler.getErrorCode(error)).toBe('VALIDATION_ERROR');
    });

    it('deve retornar STANDARD_ERROR para Error padrão', () => {
      const error = new Error('Test');
      expect(ErrorHandler.getErrorCode(error)).toBe('STANDARD_ERROR');
    });

    it('deve retornar UNKNOWN_ERROR para erro desconhecido', () => {
      expect(ErrorHandler.getErrorCode('string')).toBe('UNKNOWN_ERROR');
    });
  });
});



