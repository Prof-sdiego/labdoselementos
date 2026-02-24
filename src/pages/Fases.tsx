import { useAuth } from '@/hooks/useAuth';
import { useFases } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { Layers, Plus, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export default function Fases() {
  const { user } = useAuth();
  const { data: fases = [], isLoading } = useFases();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');

  const handleAdd = async () => {
    if (!nome || !user) return;
    // Close current active phase
    const faseAtiva = fases.find((f: any) => f.ativa);
    if (faseAtiva) {
      await supabase.from('fases').update({ ativa: false, data_fim: new Date().toISOString() }).eq('id', faseAtiva.id);
    }
    // Create new phase
    await supabase.from('fases').insert({ user_id: user.id, nome, ativa: true });
    // Reset poder_usado_nesta_fase for all alunos
    await supabase.from('alunos').update({ poder_usado_nesta_fase: false }).eq('user_id', user.id);
    toast.success('Nova fase iniciada! Poderes resetados.');
    setShowForm(false); setNome('');
    qc.invalidateQueries({ queryKey: ['fases'] });
    qc.invalidateQueries({ queryKey: ['alunos'] });
  };

  const handleEncerrar = async (id: string) => {
    await supabase.from('fases').update({ ativa: false, data_fim: new Date().toISOString() }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['fases'] });
    toast.success('Fase encerrada');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Layers className="w-6 h-6" /> Fases
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:glow-primary transition-all">
          <Plus className="w-4 h-4" /> Nova Fase
        </button>
      </div>

      <p className="text-sm text-muted-foreground">Ao iniciar uma nova fase, o controle de "poder já usado" de todos os alunos é resetado.</p>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <input placeholder="Nome da fase (ex: Fase 1 - Matéria)" value={nome} onChange={e => setNome(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          <button onClick={handleAdd} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">Iniciar Fase</button>
        </div>
      )}

      <div className="space-y-3">
        {fases.map((fase: any) => (
          <div key={fase.id} className={`rounded-xl border p-5 ${fase.ativa ? 'border-primary/40 bg-primary/5 glow-primary' : 'border-border bg-card'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-foreground">{fase.nome}</h3>
                  {fase.ativa && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono flex items-center gap-1">
                      <Play className="w-3 h-3" /> Ativa
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Início: {new Date(fase.data_inicio).toLocaleDateString('pt-BR')}
                  {fase.data_fim && ` • Fim: ${new Date(fase.data_fim).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              {fase.ativa && (
                <button onClick={() => handleEncerrar(fase.id)} className="flex items-center gap-1 text-sm text-destructive/70 hover:text-destructive transition-colors">
                  <Square className="w-4 h-4" /> Encerrar
                </button>
              )}
            </div>
          </div>
        ))}
        {fases.length === 0 && !isLoading && <p className="text-center text-muted-foreground py-8">Nenhuma fase criada.</p>}
      </div>
    </div>
  );
}
