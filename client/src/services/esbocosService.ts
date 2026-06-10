// Serviço para gerenciar esboços de pregação (mock em memória)

export type TemaPrincipal =
  | 'FAMILIA'
  | 'FE'
  | 'SANTIDADE'
  | 'AVIVAMENTO'
  | 'CURAS'
  | 'JOVENS'
  | 'MISSOES'
  | 'OUTRO';

export type TipoCulto =
  | 'DOMINGO'
  | 'CELULA'
  | 'JOVENS'
  | 'ENSINO'
  | 'ORACAO'
  | 'SANTA_CEIA'
  | 'OUTRO';

export type StatusEsboco = 'PENDENTE' | 'APROVADO' | 'REPROVADO' | 'ARQUIVADO';

export type FonteEsboco = 'INTERNO' | 'EXTERNO_INTERNET';

export interface EstruturaEsboco {
  introducao: string;
  topico1?: string;
  topico2?: string;
  topico3?: string;
  topico4?: string;
  topico5?: string;
  topico6?: string;
  topico7?: string;
  topico8?: string;
  topico9?: string;
  conclusao?: string;
  apelo?: string;
}

export interface Esboco {
  id: number;
  titulo: string;
  temaPrincipal: TemaPrincipal;
  textoBiblicoBase: string;
  referenciasAdicionais?: string[];
  tipoCulto?: TipoCulto;
  duracaoEstimadaMinutos?: number;

  autorNome: string;
  autorIgreja?: string;

  estrutura: EstruturaEsboco;
  tags?: string[];

  fonte: FonteEsboco;
  status: StatusEsboco;

  criadoEm: string; // ISO date
  aprovadoEm?: string;
  aprovadoPor?: string;
}

export interface CreateEsbocoDTO {
  titulo: string;
  temaPrincipal: TemaPrincipal;
  textoBiblicoBase: string;
  referenciasAdicionais?: string[];
  tipoCulto?: TipoCulto;
  duracaoEstimadaMinutos?: number;

  autorNome: string;
  autorIgreja?: string;

  estrutura: EstruturaEsboco;
  tags?: string[];
}

export interface EsbocoFiltroBusca {
  termo?: string;
  temaPrincipal?: TemaPrincipal;
  tipoCulto?: TipoCulto;
  duracaoMin?: number;
  duracaoMax?: number;
  tags?: string[];
  pagina?: number;
  limite?: number;
}

export interface Paginacao<T> {
  itens: T[];
  pagina: number;
  limite: number;
  totalItens: number;
  totalPaginas: number;
}

export interface UpdateEsbocoStatusDTO {
  status: StatusEsboco;
  motivoReprovacao?: string;
}

// Mock simples em memória â€“ com persistência em localStorage para compartilhar entre páginas/abas
const STORAGE_KEY = 'esbocosDatabase';

const loadFromStorage = (): Esboco[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Esboco[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const saveToStorage = (data: Esboco[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // falha silenciosa para não quebrar a UX
  }
};

let esbocosDatabase: Esboco[] = loadFromStorage();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const esbocosService = {
  async criarEsboco(data: CreateEsbocoDTO): Promise<Esboco> {
    await delay(400);
    const novo: Esboco = {
      id: esbocosDatabase.length ? esbocosDatabase[esbocosDatabase.length - 1].id + 1 : 1,
      titulo: data.titulo,
      temaPrincipal: data.temaPrincipal,
      textoBiblicoBase: data.textoBiblicoBase,
      referenciasAdicionais: data.referenciasAdicionais,
      tipoCulto: data.tipoCulto,
      duracaoEstimadaMinutos: data.duracaoEstimadaMinutos,
      autorNome: data.autorNome,
      autorIgreja: data.autorIgreja,
      estrutura: data.estrutura,
      tags: data.tags,
      fonte: 'INTERNO',
      status: 'PENDENTE',
      criadoEm: new Date().toISOString(),
    };
    esbocosDatabase = [novo, ...esbocosDatabase];
    saveToStorage(esbocosDatabase);
    return novo;
  },

  async listarEsbocosAprovados(
    filtros: EsbocoFiltroBusca = {}
  ): Promise<Paginacao<Esboco>> {
    await delay(300);
    const {
      termo,
      temaPrincipal,
      tipoCulto,
      duracaoMin,
      duracaoMax,
      tags,
      pagina = 1,
      limite = 10,
    } = filtros;

    let filtrados = esbocosDatabase.filter((e) => e.status === 'APROVADO');

    if (temaPrincipal) {
      filtrados = filtrados.filter((e) => e.temaPrincipal === temaPrincipal);
    }

    if (tipoCulto) {
      filtrados = filtrados.filter((e) => e.tipoCulto === tipoCulto);
    }

    if (duracaoMin != null) {
      filtrados = filtrados.filter(
        (e) =>
          e.duracaoEstimadaMinutos == null ||
          e.duracaoEstimadaMinutos >= duracaoMin
      );
    }

    if (duracaoMax != null) {
      filtrados = filtrados.filter(
        (e) =>
          e.duracaoEstimadaMinutos == null ||
          e.duracaoEstimadaMinutos <= duracaoMax
      );
    }

    if (tags && tags.length > 0) {
      filtrados = filtrados.filter((e) =>
        tags.every((t) => e.tags?.includes(t))
      );
    }

    if (termo) {
      const lower = termo.toLowerCase();
      filtrados = filtrados.filter((e) => {
        return (
          e.titulo.toLowerCase().includes(lower) ||
          e.autorNome.toLowerCase().includes(lower) ||
          e.textoBiblicoBase.toLowerCase().includes(lower) ||
          e.estrutura.introducao.toLowerCase().includes(lower) ||
          e.tags?.some((t) => t.toLowerCase().includes(lower))
        );
      });
    }

    const totalItens = filtrados.length;
    const inicio = (pagina - 1) * limite;
    const itens = filtrados.slice(inicio, inicio + limite);

    return {
      itens,
      pagina,
      limite,
      totalItens,
      totalPaginas: Math.max(1, Math.ceil(totalItens / limite)),
    };
  },

  async listarTodos(): Promise<Esboco[]> {
    await delay(200);
    // mais recentes primeiro
    return [...esbocosDatabase].sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    );
  },

  async listarPendentes(): Promise<Esboco[]> {
    await delay(300);
    return esbocosDatabase.filter((e) => e.status === 'PENDENTE');
  },

  async obterPorId(id: number): Promise<Esboco | null> {
    await delay(250);
    return esbocosDatabase.find((e) => e.id === id) || null;
  },

  async atualizarStatus(
    id: number,
    data: UpdateEsbocoStatusDTO & { aprovadoPor?: string }
  ): Promise<Esboco | null> {
    await delay(300);
    const idx = esbocosDatabase.findIndex((e) => e.id === id);
    if (idx === -1) return null;

    const atual = esbocosDatabase[idx];
    const atualizado: Esboco = {
      ...atual,
      status: data.status,
      aprovadoPor: data.aprovadoPor ?? atual.aprovadoPor,
      aprovadoEm:
        data.status === 'APROVADO' ? new Date().toISOString() : atual.aprovadoEm,
    };

    esbocosDatabase[idx] = atualizado;
    saveToStorage(esbocosDatabase);
    return atualizado;
  },

  async removerEsboco(id: number): Promise<void> {
    await delay(200);
    esbocosDatabase = esbocosDatabase.filter((e) => e.id !== id);
    saveToStorage(esbocosDatabase);
  },
};


