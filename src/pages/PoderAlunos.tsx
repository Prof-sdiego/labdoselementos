import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAlunos, useEquipes } from '@/hooks/useSupabaseData';
import { useSalaContext } from '@/hooks/useSalaContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function PoderAlunos() {
  const { user } = useAuth();
  const { activeSalaId } = useSalaContext();
  const { data: alunos = [] } = useAlunos(activeSalaId || undefined);
  const { data: equipes = [] } = useEquipes(activeSalaId || undefined);
  const qc = useQueryClient();
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const togglePoder = async (alunoId: string, current: boolean) => {
    setSaving(prev => ({ ...prev, [alunoId]: true }));
    const { error } = await supabase.from('alunos').update({ poder_usado_nesta_fase: !current }).eq('id', alunoId);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ['alunos'] });
    setSaving(prev => ({ ...prev, [alunoId]: false }));
  };

  const marcarTodos = async (valor: boolean) => {
    const ids = alunos.map((a: any) => a.id);
    if (ids.length === 0) return;
    const { error } = await supabase.from('alunos').update({ poder_usado_nesta_fase: valor }).in('id', ids);
    if (error) toast.error(error.message);
    else { toast.success(valor ? 'Todos marcados como usados' : 'Todos desmarcados'); qc.invalidateQueries({ queryKey: ['alunos'] }); }
  };

  // Group by equipe
  const grouped: Record<string, any[]> = {};
  alunos.forEach((a: any) => {
    const key = a.equipe_id || '_sem_equipe';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Shield className="w-6 h-6" /> Controle de Poderes
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => marcarTodos(true)} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-bold">
            Marcar Todos
          </button>
          <button onClick={() => marcarTodos(false)} className="rounded-lg bg-secondary text-foreground px-3 py-2 text-xs font-bold border border-border">
            Desmarcar Todos
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Marque os alunos que já usaram o poder nesta fase. As alterações são salvas automaticamente.</p>

      {Object.entries(grouped).map(([key, students]) => {
        const equipe = equipes.find((e: any) => e.id === key);
        return (
          <div key={key} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-secondary/50 px-4 py-2 border-b border-border">
              <h3 className="font-display font-bold text-foreground text-sm">{equipe?.nome || 'Sem equipe'}</h3>
            </div>
            <div className="divide-y divide-border/50">
              {students.map((aluno: any) => (
                <label key={aluno.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors cursor-pointer">
                  <button
                    onClick={() => togglePoder(aluno.id, !!aluno.poder_usado_nesta_fase)}
                    disabled={!!saving[aluno.id]}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                      aluno.poder_usado_nesta_fase
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {aluno.poder_usado_nesta_fase && <Check className="w-3 h-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{aluno.nome}</span>
                    <span className="text-xs text-muted-foreground ml-2">{aluno.classe}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                    aluno.poder_usado_nesta_fase
                      ? 'bg-destructive/15 text-destructive'
                      : 'bg-primary/15 text-primary'
                  }`}>
                    {aluno.poder_usado_nesta_fase ? 'Usado' : 'Disponível'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {alunos.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum aluno nesta sala.</p>}
    </div>
  );
}
