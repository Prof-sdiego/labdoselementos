import { useLancamentos, useLancamentoEquipes, useLancamentoAlunos, useTiposAtividade, useAlunos, useEquipes, useSalas } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { History, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Historico() {
  const { data: lancamentos = [] } = useLancamentos();
  const { data: lancEquipes = [] } = useLancamentoEquipes();
  const { data: lancAlunos = [] } = useLancamentoAlunos();
  const { data: atividades = [] } = useTiposAtividade();
  const { data: alunos = [] } = useAlunos();
  const { data: equipes = [] } = useEquipes();
  const { data: salas = [] } = useSalas();
  const qc = useQueryClient();

  const handleEstorno = async (id: string) => {
    await supabase.from('lancamentos_xp').update({ estornado: true }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['lancamentos'] });
    toast.success('Lançamento estornado');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
        <History className="w-6 h-6" /> Histórico de XP
      </h1>

      <div className="space-y-3">
        {lancamentos.map((lanc: any) => {
          const atividade = atividades.find((a: any) => a.id === lanc.atividade_id);
          const sala = salas.find((s: any) => s.id === lanc.sala_id);
          const eqIds = lancEquipes.filter((le: any) => le.lancamento_id === lanc.id).map((le: any) => le.equipe_id);
          const alIds = lancAlunos.filter((la: any) => la.lancamento_id === lanc.id).map((la: any) => la.aluno_id);
          const eqNomes = eqIds.map((id: string) => equipes.find((e: any) => e.id === id)?.nome).filter(Boolean);
          const alNomes = alIds.map((id: string) => alunos.find((a: any) => a.id === id)?.nome).filter(Boolean);

          return (
            <div key={lanc.id} className={`rounded-xl border bg-card p-4 ${lanc.estornado ? 'border-destructive/30 opacity-50' : 'border-border'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">{atividade?.nome || 'Atividade'}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(lanc.data).toLocaleDateString('pt-BR')} • {sala?.nome}
                  </p>
                  {eqNomes.length > 0 && <p className="text-xs text-muted-foreground">Equipes: {eqNomes.join(', ')}</p>}
                  {alNomes.length > 0 && <p className="text-xs text-muted-foreground">Alunos: {alNomes.join(', ')}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-display font-bold ${lanc.xp_concedido < 0 ? 'text-destructive' : 'text-primary'}`}>
                    {lanc.xp_concedido > 0 ? '+' : ''}{lanc.xp_concedido}
                  </span>
                  {!lanc.estornado && (
                    <button onClick={() => handleEstorno(lanc.id)} className="text-xs text-destructive/70 hover:text-destructive flex items-center gap-1 transition-colors">
                      <Undo2 className="w-3 h-3" /> Estornar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {lancamentos.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum lançamento registrado.</p>}
      </div>
    </div>
  );
}
