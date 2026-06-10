// Utilitários para integração simples com o site Bíbliaon
// Base: https://www.bibliaon.com/

export const BIBLIAON_BASE_URL = 'https://www.bibliaon.com';

// Link geral da seção de Esboços de Pregação
export const getBibliaOnEsbocosIndexUrl = () =>
  `${BIBLIAON_BASE_URL}/esbocos_de_pregacao/`;

// Busca genérica no site (texto livre: tema, palavra, referência)
export const getBibliaOnSearchUrl = (query: string) => {
  const q = encodeURIComponent(query.trim());
  return `${BIBLIAON_BASE_URL}/?q=${q}`;
};

// Futuro: se você quiser mapear diretamente livros/capítulos, dá para criar
// helpers específicos aqui para ir além da busca genérica.


