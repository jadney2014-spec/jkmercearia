// API client-side para aniversários
// Nota: A maior parte da lógica está no hook useBirthdays
// Este arquivo pode ser usado para chamadas HTTP adicionais se necessário

export const birthdayAPI = {
  /**
   * Testa manualmente a verificação de aniversários
   * Chama a função HTTP testBirthdayCheck do Firebase Functions
   */
  testBirthdayCheck: async (): Promise<any> => {
    try {
      // URL da função Firebase (ajustar conforme necessário)
      const functionsUrl = process.env.REACT_APP_FUNCTIONS_URL || '';
      
      if (!functionsUrl) {
        throw new Error('REACT_APP_FUNCTIONS_URL não configurado');
      }

      const response = await fetch(`${functionsUrl}/testBirthdayCheck`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao testar verificação: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao testar verificação de aniversários:', error);
      throw error;
    }
  }
};

