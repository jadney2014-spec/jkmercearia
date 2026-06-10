import storage from '../storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isAvailable', () => {
    it('deve retornar true quando localStorage está disponível', () => {
      expect(storage.isAvailable()).toBe(true);
    });
  });

  describe('getString', () => {
    it('deve retornar valor quando existe', () => {
      localStorage.setItem('test-key', 'test-value');
      expect(storage.getString('test-key')).toBe('test-value');
    });

    it('deve retornar defaultValue quando não existe', () => {
      expect(storage.getString('non-existent', 'default')).toBe('default');
    });

    it('deve retornar null quando não existe e não há defaultValue', () => {
      expect(storage.getString('non-existent')).toBeNull();
    });
  });

  describe('setString', () => {
    it('deve salvar string corretamente', () => {
      storage.setString('test-key', 'test-value');
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    it('deve remover quando valor é null', () => {
      localStorage.setItem('test-key', 'test-value');
      storage.setString('test-key', null);
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('deve remover quando valor é undefined', () => {
      localStorage.setItem('test-key', 'test-value');
      storage.setString('test-key', undefined);
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('getJSON', () => {
    it('deve retornar objeto quando existe', () => {
      const data = { name: 'Test', value: 123 };
      localStorage.setItem('test-key', JSON.stringify(data));
      expect(storage.getJSON('test-key')).toEqual(data);
    });

    it('deve retornar defaultValue quando não existe', () => {
      const defaultValue = { default: true };
      expect(storage.getJSON('non-existent', defaultValue)).toEqual(defaultValue);
    });

    it('deve retornar null quando não existe e não há defaultValue', () => {
      expect(storage.getJSON('non-existent')).toBeNull();
    });

    it('deve remover e retornar defaultValue quando JSON é inválido', () => {
      localStorage.setItem('test-key', 'invalid-json');
      const defaultValue = { default: true };
      expect(storage.getJSON('test-key', defaultValue)).toEqual(defaultValue);
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('setJSON', () => {
    it('deve salvar objeto corretamente', () => {
      const data = { name: 'Test', value: 123 };
      storage.setJSON('test-key', data);
      expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual(data);
    });

    it('deve remover quando valor é null', () => {
      localStorage.setItem('test-key', 'test-value');
      storage.setJSON('test-key', null);
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('não deve fazer nada quando valor é undefined', () => {
      localStorage.setItem('test-key', 'test-value');
      storage.setJSON('test-key', undefined);
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });
  });

  describe('remove', () => {
    it('deve remover chave corretamente', () => {
      localStorage.setItem('test-key', 'test-value');
      storage.remove('test-key');
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('clear', () => {
    it('deve limpar todo o localStorage', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      storage.clear();
      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
    });
  });
});



