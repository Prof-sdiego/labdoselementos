import { Sala, Aluno, Equipe, TipoAtividade, LancamentoXP, Fase, Artefato } from '@/types/game';

export const mockSalas: Sala[] = [
  { id: 's1', nome: '7º Ano A', anoSerie: '7º Ano', periodo: 'manhã', status: 'ativa' },
  { id: 's2', nome: '7º Ano B', anoSerie: '7º Ano', periodo: 'tarde', status: 'ativa' },
];

export const mockAlunos: Aluno[] = [
  { id: 'a1', nome: 'Ana Silva', salaId: 's1', equipeId: 'e1', classe: 'Pesquisador', xpIndividual: 45, poderUsadoNestaFase: false },
  { id: 'a2', nome: 'Bruno Costa', salaId: 's1', equipeId: 'e1', classe: 'Comunicador', xpIndividual: 38, poderUsadoNestaFase: true },
  { id: 'a3', nome: 'Carla Santos', salaId: 's1', equipeId: 'e1', classe: 'Engenheiro', xpIndividual: 52, poderUsadoNestaFase: false },
  { id: 'a4', nome: 'Diego Lima', salaId: 's1', equipeId: 'e1', classe: 'Pesquisador', xpIndividual: 30, poderUsadoNestaFase: false },
  { id: 'a5', nome: 'Elena Rocha', salaId: 's1', equipeId: 'e2', classe: 'Comunicador', xpIndividual: 65, poderUsadoNestaFase: false },
  { id: 'a6', nome: 'Felipe Nunes', salaId: 's1', equipeId: 'e2', classe: 'Engenheiro', xpIndividual: 42, poderUsadoNestaFase: false },
  { id: 'a7', nome: 'Gabriela Martins', salaId: 's1', equipeId: 'e2', classe: 'Pesquisador', xpIndividual: 58, poderUsadoNestaFase: true },
  { id: 'a8', nome: 'Hugo Ferreira', salaId: 's1', equipeId: 'e2', classe: 'Comunicador', xpIndividual: 35, poderUsadoNestaFase: false },
  { id: 'a9', nome: 'Isabela Oliveira', salaId: 's1', equipeId: 'e3', classe: 'Engenheiro', xpIndividual: 78, poderUsadoNestaFase: false },
  { id: 'a10', nome: 'João Almeida', salaId: 's1', equipeId: 'e3', classe: 'Pesquisador', xpIndividual: 48, poderUsadoNestaFase: false },
  { id: 'a11', nome: 'Karen Souza', salaId: 's1', equipeId: 'e3', classe: 'Comunicador', xpIndividual: 55, poderUsadoNestaFase: false },
  { id: 'a12', nome: 'Lucas Pereira', salaId: 's1', equipeId: 'e3', classe: 'Engenheiro', xpIndividual: 40, poderUsadoNestaFase: false },
  { id: 'a13', nome: 'Marina Dias', salaId: 's1', equipeId: 'e4', classe: 'Pesquisador', xpIndividual: 33, poderUsadoNestaFase: false },
  { id: 'a14', nome: 'Nicolas Ribeiro', salaId: 's1', equipeId: 'e4', classe: 'Comunicador', xpIndividual: 27, poderUsadoNestaFase: false },
  { id: 'a15', nome: 'Olivia Cardoso', salaId: 's1', equipeId: 'e4', classe: 'Engenheiro', xpIndividual: 44, poderUsadoNestaFase: false },
  { id: 'a16', nome: 'Pedro Gomes', salaId: 's1', equipeId: 'e4', classe: 'Pesquisador', xpIndividual: 22, poderUsadoNestaFase: false },
];

export const mockEquipes: Equipe[] = [
  { id: 'e1', nome: 'Lab Nebulosa', salaId: 's1', membros: ['a1', 'a2', 'a3', 'a4'], xpTotal: 320, faseAtual: 'f1', transferenciasUsadas: 0 },
  { id: 'e2', nome: 'Lab Supernova', salaId: 's1', membros: ['a5', 'a6', 'a7', 'a8'], xpTotal: 465, faseAtual: 'f1', transferenciasUsadas: 0 },
  { id: 'e3', nome: 'Lab Quantum', salaId: 's1', membros: ['a9', 'a10', 'a11', 'a12'], xpTotal: 680, faseAtual: 'f1', transferenciasUsadas: 0 },
  { id: 'e4', nome: 'Lab Fusão', salaId: 's1', membros: ['a13', 'a14', 'a15', 'a16'], xpTotal: 150, faseAtual: 'f1', transferenciasUsadas: 1 },
];

export const mockTiposAtividade: TipoAtividade[] = [
  { id: 't1', nome: 'Completar Experiência', xp: 3, tipo: 'por_aluno', descricao: '+3 por membro que fez' },
  { id: 't2', nome: 'Todos entregaram no prazo', xp: 10, tipo: 'por_equipe', descricao: '+10 bônus para equipe', isBonus: true },
  { id: 't3', nome: 'Missão Especial', xp: 5, tipo: 'por_aluno', descricao: '+5 por membro que fez' },
  { id: 't4', nome: 'Chefão — média ≥ 7', xp: 15, tipo: 'por_equipe', descricao: '+15 por equipe' },
  { id: 't5', nome: 'Chefão — alguém tirou 10', xp: 10, tipo: 'por_equipe', descricao: '+10 bônus', isBonus: true },
  { id: 't6', nome: 'Missão Bônus', xp: 5, tipo: 'por_aluno', descricao: '+5 por membro que fez' },
  { id: 't7', nome: 'Missão Relâmpago', xp: 8, tipo: 'por_equipe', descricao: '+8 para equipe vencedora' },
  { id: 't8', nome: 'Participação destaque', xp: 3, tipo: 'por_aluno', descricao: '+3 XP individual apenas' },
  { id: 't9', nome: 'Membro mandado à direção', xp: -10, tipo: 'por_equipe', descricao: '-10 penalidade para equipe' },
];

export const mockLancamentos: LancamentoXP[] = [
  { id: 'l1', data: '2025-02-20T10:00:00', atividadeId: 't1', salaId: 's1', equipeIds: ['e1'], alunoIds: ['a1', 'a2', 'a3'], xpConcedido: 9, estornado: false },
  { id: 'l2', data: '2025-02-19T14:00:00', atividadeId: 't4', salaId: 's1', equipeIds: ['e3'], alunoIds: [], xpConcedido: 15, estornado: false },
  { id: 'l3', data: '2025-02-18T09:30:00', atividadeId: 't7', salaId: 's1', equipeIds: ['e2'], alunoIds: [], xpConcedido: 8, estornado: false },
];

export const mockFases: Fase[] = [
  { id: 'f1', nome: 'Capítulo 1 — Matéria e Energia', dataInicio: '2025-02-01', ativa: true },
];

export const mockArtefatos: Artefato[] = [
  { id: 'art1', nome: 'Pergaminho da Sabedoria', raridade: 'Ouro', descricao: '+2 XP bônus na próxima atividade' },
  { id: 'art2', nome: 'Cristal do Tempo', raridade: 'Diamante', descricao: 'Estende prazo de 1 entrega em 2 dias' },
  { id: 'art3', nome: 'Elixir do Conhecimento', raridade: 'Encantado', descricao: 'Dobra o XP de 1 atividade' },
  { id: 'art4', nome: 'Escudo Protetor', raridade: 'Simples', descricao: 'Anula 1 penalidade de -10 XP' },
  { id: 'art5', nome: 'Amuleto Platinado', raridade: 'Platina', descricao: '+5 XP para toda a equipe' },
];
