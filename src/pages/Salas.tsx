import { useState } from 'react';
import { useSalas } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layers, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Salas() {
  const { user } = useAuth();
  const { data: salas = [], isLoading } = useSalas();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [anoSerie, setAnoSerie] = useState('');
  const [periodo, setPeriodo] = useState('manhã');

  const handleAdd = async () => {
    if (!nome || !user) return;
    const { error } = await supabase.from('salas').insert({
      user_id: user.id, nome, ano_serie: anoSerie, periodo
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Sala criada!');
    setShowForm(false); setNome(''); setAnoSerie('');
    qc.invalidateQueries({ queryKey: ['salas'] });
  };

  const handleDelete = async (id: string) => {
    // Clean up all FK references before deleting sala
    const { data: equipes } = await supabase.from('equipes').select('id').eq('sala_id', id);
    const equipeIds = (equipes || []).map(e => e.id);
    if (equipeIds.length > 0) {
      await supabase.from('shop_purchases').delete().in('equipe_id', equipeIds);
      await supabase.from('ocorrencias').delete().in('equipe_id', equipeIds);
      await supabase.from('artefatos_atribuidos').delete().in('equipe_id', equipeIds);
      await supabase.from('transferencias').delete().in('equipe_origem_id', equipeIds);
      await supabase.from('transferencias').delete().in('equipe_destino_id', equipeIds);
      await supabase.from('lancamento_equipes').delete().in('equipe_id', equipeIds);
      // Clean alunos FK refs
      const { data: alunos } = await supabase.from('alunos').select('id').eq('sala_id', id);
      const alunoIds = (alunos || []).map(a => a.id);
      if (alunoIds.length > 0) {
        await supabase.from('lancamento_alunos').delete().in('aluno_id', alunoIds);
        await supabase.from('artefatos_atribuidos').delete().in('aluno_id', alunoIds);
        await supabase.from('transferencias').delete().in('aluno_id', alunoIds);
      }
      await supabase.from('alunos').delete().eq('sala_id', id);
      await supabase.from('equipes').delete().eq('sala_id', id);
    } else {
      // No equipes but might have alunos
      const { data: alunos } = await supabase.from('alunos').select('id').eq('sala_id', id);
      const alunoIds = (alunos || []).map(a => a.id);
      if (alunoIds.length > 0) {
        await supabase.from('lancamento_alunos').delete().in('aluno_id', alunoIds);
        await supabase.from('artefatos_atribuidos').delete().in('aluno_id', alunoIds);
      }
      await supabase.from('alunos').delete().eq('sala_id', id);
    }
    // Clean lancamentos_xp for this sala
    const { data: lancs } = await supabase.from('lancamentos_xp').select('id').eq('sala_id', id);
    const lancIds = (lancs || []).map(l => l.id);
    if (lancIds.length > 0) {
      await supabase.from('lancamento_alunos').delete().in('lancamento_id', lancIds);
      await supabase.from('lancamento_equipes').delete().in('lancamento_id', lancIds);
      await supabase.from('lancamentos_xp').delete().eq('sala_id', id);
    }
    const { error } = await supabase.from('salas').delete().eq('id', id);
    if (error) { toast.error('Erro: ' + error.message); return; }
    qc.invalidateQueries({ queryKey: ['salas'] });
    toast.success('Sala excluída');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Layers className="w-6 h-6" /> Salas
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:glow-primary transition-all">
          <Plus className="w-4 h-4" /> Nova Sala
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <input placeholder="Nome da sala (ex: 7º Ano A)" value={nome} onChange={e => setNome(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          <input placeholder="Ano/Série" value={anoSerie} onChange={e => setAnoSerie(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
            <option value="manhã">Manhã</option>
            <option value="tarde">Tarde</option>
          </select>
          <button onClick={handleAdd} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">Salvar</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {salas.map((sala: any) => (
          <div key={sala.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-foreground">{sala.nome}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${sala.status === 'ativa' ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
                {sala.status}
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Série: {sala.ano_serie}</p>
              <p>Período: {sala.periodo}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => handleDelete(sala.id)} className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive transition-colors">
                <Trash2 className="w-3 h-3" /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
      {salas.length === 0 && !isLoading && <p className="text-center text-muted-foreground py-8">Nenhuma sala cadastrada.</p>}
    </div>
  );
}
