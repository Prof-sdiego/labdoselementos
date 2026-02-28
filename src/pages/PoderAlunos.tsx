import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAlunos, useEquipes, useLancamentos, useLancamentoEquipes, useLancamentoAlunos, calcEquipeXP } from '@/hooks/useSupabaseData';
import { useSalaContext } from '@/hooks/useSalaContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getNivel, CLASSES_INFO, ClasseType } from '@/types/game';

export default function PoderAlunos() {
  const { user } = useAuth();
  const { activeSalaId } = useSalaContext();
  const { data: alunos = [] } = useAlunos(activeSalaId || undefined);
  const { data: equipes = [] } = useEquipes(activeSalaId || undefined);
  const { data: lancamentos = [] } = useLancamentos();
  const { data: lancamentoEquipes = [] } = useLancamentoEquipes();
  const { data: lancamentoAlunos = [] } = useLancamentoAlunos();
  const qc = useQueryClient();
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Calculate XP per team
  const equipeXPMap: Record<string, number> = {};
  equipes.forEach((e: any) => {
    equipeXPMap[e.id] = calcEquipeXP(e.id, lancamentos, lancamentoEquipes, lancamentoAlunos, alunos);
  });

  const togglePoder = async (alunoId: string, current: boolean) => {
    setSaving(prev => ({ ...prev, [alunoId]: true }));
    const { error } = await supabase.from('alunos').update({ poder_usado_nesta_fase: !current }).eq('id', alunoId);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ['alunos'] });
    setSaving(prev => ({ ...prev, [alunoId]: false }));
  };

  const marcarTodos = async (valor: boolean) => {
    // Only mark alunos whose power is actually unlocked
    const ids = alunos.filter((a: any) => {
      const info = CLASSES_INFO[a.classe as ClasseType];
      if (!info) return false;
      const xp = equipeXPMap[a.equipe_id] || 0;
      const nivel = getNivel(xp);
      return nivel.nivel >= info.desbloqueiaNivel;
    }).map((a: any) => a.id);
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

      <p className="text-sm text-muted-foreground">Marque os alunos que já usaram o poder nesta fase. Poderes só aparecem liberados se a equipe atingiu o nível necessário.</p>

      {Object.entries(grouped).map(([key, students]) => {
        const equipe = equipes.find((e: any) => e.id === key);
        const xp = equipeXPMap[key] || 0;
        const nivel = getNivel(xp);
        return (
          <div key={key} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-secondary/50 px-4 py-2 border-b border-border flex items-center justify-between">
              <h3 className="font-display font-bold text-foreground text-sm">{equipe?.nome || 'Sem equipe'}</h3>
              <span className="text-xs text-muted-foreground">Nv.{nivel.nivel} • {xp} XP</span>
            </div>
            <div className="divide-y divide-border/50">
              {students.map((aluno: any) => {
                const classeInfo = CLASSES_INFO[aluno.classe as ClasseType];
                const unlocked = classeInfo && nivel.nivel >= classeInfo.desbloqueiaNivel;
                return (
                  <div key={aluno.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
                    {unlocked ? (
                      <button
                        onClick={() => togglePoder(aluno.id, !!aluno.poder_usado_nesta_fase)}
                        disabled={!!saving[aluno.id]}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                          aluno.poder_usado_nesta_fase
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {aluno.poder_usado_nesta_fase && <Check className="w-3 h-3" />}
                      </button>
                    ) : (
                      <div className="w-5 h-5 rounded border-2 border-muted flex items-center justify-center shrink-0">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{aluno.nome}</span>
                      <span className="text-xs text-muted-foreground ml-2">{aluno.classe}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      !unlocked
                        ? 'bg-muted text-muted-foreground'
                        : aluno.poder_usado_nesta_fase
                          ? 'bg-destructive/15 text-destructive'
                          : 'bg-primary/15 text-primary'
                    }`}>
                      {!unlocked ? `Nv.${classeInfo?.desbloqueiaNivel}` : aluno.poder_usado_nesta_fase ? 'Usado' : 'Disponível'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {alunos.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum aluno nesta sala.</p>}
    </div>
  );
}
