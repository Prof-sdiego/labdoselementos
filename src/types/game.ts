export interface Sala {
  id: string;
  nome: string;
  anoSerie: string;
  periodo: 'manhã' | 'tarde';
  status: 'ativa' | 'inativa';
}

export type ClasseType = 'Pesquisador' | 'Comunicador' | 'Engenheiro';

export interface Aluno {
  id: string;
  nome: string;
  salaId: string;
  equipeId: string;
  classe: ClasseType;
  xpIndividual: number;
  poderUsadoNestaFase: boolean;
}

export interface Equipe {
  id: string;
  nome: string;
  salaId: string;
  membros: string[]; // aluno ids
  xpTotal: number;
  faseAtual: string;
  transferenciasUsadas: number;
}

export interface Nivel {
  nivel: number;
  xpNecessario: number;
  nome: string;
  bonus: string;
}

export interface TipoAtividade {
  id: string;
  nome: string;
  xp: number;
  tipo: 'por_aluno' | 'por_equipe';
  descricao: string;
  isBonus?: boolean;
}

export interface LancamentoXP {
  id: string;
  data: string;
  atividadeId: string;
  salaId: string;
  equipeIds: string[];
  alunoIds: string[];
  xpConcedido: number;
  estornado: boolean;
}

export interface Fase {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim?: string;
  ativa: boolean;
}

export type Raridade = 'Simples' | 'Ouro' | 'Diamante' | 'Platina' | 'Encantado';

export interface Artefato {
  id: string;
  nome: string;
  raridade: Raridade;
  descricao: string;
}

export interface ArtefatoAtribuido {
  id: string;
  artefatoId: string;
  equipeId?: string;
  alunoId?: string;
  data: string;
}

export const NIVEIS: Nivel[] = [
  { nivel: 1, xpNecessario: 0, nome: 'Estagiários', bonus: 'Ponto de partida' },
  { nivel: 2, xpNecessario: 80, nome: 'Técnicos', bonus: 'Equipe escolhe nome do Laboratório' },
  { nivel: 3, xpNecessario: 180, nome: 'Analistas', bonus: 'Comunicadores liberam poder + Missão Bônus exclusiva' },
  { nivel: 4, xpNecessario: 300, nome: 'Cientistas', bonus: 'Engenheiros liberam poder + 1 dica coletiva no Chefão' },
  { nivel: 5, xpNecessario: 450, nome: 'Mestres', bonus: 'Pesquisadores liberam poder + Desafio Direto' },
  { nivel: 6, xpNecessario: 650, nome: 'Doutores', bonus: '+0,5 na próxima prova para toda equipe' },
  { nivel: 7, xpNecessario: 900, nome: 'Gênios', bonus: '+1,0 na prova final + Missão Secreta Bônus' },
];

export const CLASSES_INFO: Record<ClasseType, { poder: string; desbloqueiaNivel: number }> = {
  Pesquisador: { poder: 'Refazer 1 questão do Chefão após correção (vale metade)', desbloqueiaNivel: 5 },
  Comunicador: { poder: 'Pedir 1 dica ao professor durante uma Missão', desbloqueiaNivel: 3 },
  Engenheiro: { poder: 'Entregar 1 Experiência com 1 dia de atraso sem perder XP', desbloqueiaNivel: 4 },
};

export function getNivel(xp: number): Nivel {
  for (let i = NIVEIS.length - 1; i >= 0; i--) {
    if (xp >= NIVEIS[i].xpNecessario) return NIVEIS[i];
  }
  return NIVEIS[0];
}

export function getProgressoNivel(xp: number): { atual: Nivel; proximo: Nivel | null; progresso: number } {
  const atual = getNivel(xp);
  const idx = NIVEIS.findIndex(n => n.nivel === atual.nivel);
  const proximo = idx < NIVEIS.length - 1 ? NIVEIS[idx + 1] : null;
  if (!proximo) return { atual, proximo: null, progresso: 100 };
  const xpNoNivel = xp - atual.xpNecessario;
  const xpParaProximo = proximo.xpNecessario - atual.xpNecessario;
  return { atual, proximo, progresso: Math.min(100, (xpNoNivel / xpParaProximo) * 100) };
}
