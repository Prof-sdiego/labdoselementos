import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTiposAtividade } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { ScrollText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Atividades() {
  const { user } = useAuth();
  const { data: atividades = [], isLoading } = useTiposAtividade();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [xp, setXp] = useState(5);
  const [tipo, setTipo] = useState('por_aluno');
  const [descricao, setDescricao] = useState('');
  const [isBonus, setIsBonus] = useState(false);

  const handleAdd = async () => {
    if (!nome || !user) return;
    const { error } = await supabase.from('tipos_atividade').insert({
      user_id: user.id, nome, xp, tipo, descricao, is_bonus: isBonus
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Atividade criada!');
    setShowForm(false); setNome(''); setXp(5); setDescricao('');
    qc.invalidateQueries({ queryKey: ['tipos_atividade'] });
  };

  const handleDelete = async (id: string) => {
    await supabase.from('tipos_atividade').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['tipos_atividade'] });
    toast.success('Atividade removida');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <ScrollText className="w-6 h-6" /> Tipos de Atividade
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:glow-primary transition-all">
          <Plus className="w-4 h-4" /> Nova Atividade
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <input placeholder="Nome da atividade" value={nome} onChange={e => setNome(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          <input placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">XP</label>
              <input type="number" value={xp} onChange={e => setXp(+e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border">
                <option value="por_aluno">Por Aluno</option>
                <option value="por_equipe">Por Equipe</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={isBonus} onChange={e => setIsBonus(e.target.checked)} className="accent-primary" />
            Atividade bônus
          </label>
          <button onClick={handleAdd} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">Salvar</button>
        </div>
      )}

      <div className="space-y-3">
        {atividades.map((at: any) => (
          <div key={at.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">{at.nome}</h3>
                {at.is_bonus && <span className="text-xs px-2 py-0.5 rounded-full bg-level-6/15 text-level-6 font-mono">Bônus</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{at.descricao}</p>
              <p className="text-xs text-muted-foreground mt-1">{at.tipo === 'por_aluno' ? 'Por Aluno' : 'Por Equipe'}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-display font-bold ${at.xp < 0 ? 'text-destructive' : 'text-primary'}`}>
                {at.xp > 0 ? '+' : ''}{at.xp}
              </span>
              <button onClick={() => handleDelete(at.id)} className="text-destructive/70 hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {atividades.length === 0 && !isLoading && <p className="text-center text-muted-foreground py-8">Nenhuma atividade cadastrada. Crie sua conta para gerar as atividades padrão.</p>}
      </div>
    </div>
  );
}
