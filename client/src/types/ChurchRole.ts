// Tipos para funções/cargos da igreja

export type ChurchRole = 
  | 'Pastor(a)'
  | 'Líder'
  | 'Líder de Célula'
  | 'Obreiro(a)'
  | 'Membro'
  | 'Diácono(a)'
  | 'Presbítero(a)'
  | 'Evangelista'
  | 'Missionário(a)'
  | 'Coordenador(a)'
  | 'Auxiliar'
  | 'Voluntário(a)';

export const CHURCH_ROLES: { value: ChurchRole; label: string }[] = [
  { value: 'Pastor(a)', label: 'Pastor(a)' },
  { value: 'Líder', label: 'Líder' },
  { value: 'Líder de Célula', label: 'Líder de Célula' },
  { value: 'Obreiro(a)', label: 'Obreiro(a)' },
  { value: 'Membro', label: 'Membro' },
  { value: 'Diácono(a)', label: 'Diácono(a)' },
  { value: 'Presbítero(a)', label: 'Presbítero(a)' },
  { value: 'Evangelista', label: 'Evangelista' },
  { value: 'Missionário(a)', label: 'Missionário(a)' },
  { value: 'Coordenador(a)', label: 'Coordenador(a)' },
  { value: 'Auxiliar', label: 'Auxiliar' },
  { value: 'Voluntário(a)', label: 'Voluntário(a)' },
];
