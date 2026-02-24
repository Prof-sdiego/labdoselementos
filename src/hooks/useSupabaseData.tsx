import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useSalas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['salas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('salas').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useEquipes(salaId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['equipes', user?.id, salaId],
    queryFn: async () => {
      let q = supabase.from('equipes').select('*').order('nome');
      if (salaId) q = q.eq('sala_id', salaId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAlunos(salaId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['alunos', user?.id, salaId],
    queryFn: async () => {
      let q = supabase.from('alunos').select('*').order('nome');
      if (salaId) q = q.eq('sala_id', salaId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useTiposAtividade() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tipos_atividade', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tipos_atividade').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useLancamentos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lancamentos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('lancamentos_xp').select('*').order('data', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useLancamentoEquipes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lancamento_equipes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('lancamento_equipes').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useLancamentoAlunos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lancamento_alunos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('lancamento_alunos').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useFases() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['fases', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('fases').select('*').order('data_inicio', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useShopItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['shop_items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('shop_items').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useShopPurchases() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['shop_purchases', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('shop_purchases').select('*').order('data', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useOcorrencias() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ocorrencias', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('ocorrencias').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useTransferencias() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transferencias', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('transferencias').select('*').order('data', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// XP calculation helpers
export function calcEquipeXP(
  equipeId: string,
  lancamentos: any[],
  lancamentoEquipes: any[],
  lancamentoAlunos: any[],
  alunos: any[],
  purchases: any[]
) {
  // XP from equipe-level lancamentos
  const equipeXPFromLancamentos = lancamentoEquipes
    .filter(le => le.equipe_id === equipeId)
    .reduce((sum, le) => {
      const lanc = lancamentos.find(l => l.id === le.lancamento_id && !l.estornado);
      return sum + (lanc?.xp_concedido || 0);
    }, 0);

  // XP from aluno-level lancamentos (for alunos in this equipe)
  const membros = alunos.filter(a => a.equipe_id === equipeId);
  const alunoXP = lancamentoAlunos
    .filter(la => membros.some(m => m.id === la.aluno_id))
    .reduce((sum, la) => {
      const lanc = lancamentos.find(l => l.id === la.lancamento_id && !l.estornado);
      return sum + (lanc?.xp_concedido || 0);
    }, 0);

  // Deduct purchases
  const purchaseXP = purchases
    .filter(p => p.equipe_id === equipeId)
    .reduce((sum, p) => sum + (p.xp_gasto || 0), 0);

  return Math.max(0, equipeXPFromLancamentos + alunoXP - purchaseXP);
}

export function calcAlunoXP(
  alunoId: string,
  lancamentos: any[],
  lancamentoAlunos: any[]
) {
  return lancamentoAlunos
    .filter(la => la.aluno_id === alunoId)
    .reduce((sum, la) => {
      const lanc = lancamentos.find(l => l.id === la.lancamento_id && !l.estornado);
      return sum + (lanc?.xp_concedido || 0);
    }, 0);
}
