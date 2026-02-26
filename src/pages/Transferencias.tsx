import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSalaContext } from '@/hooks/useSalaContext';
import { useEquipes, useAlunos, useTransferencias } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Transferencias() {
  const { user } = useAuth();
  const { activeSalaId } = useSalaContext();
  const { data: equipes = [] } = useEquipes(activeSalaId || undefined);
  const { data: allAlunos = [] } = useAlunos(activeSalaId || undefined);
  const { data: transferencias = [] } = useTransferencias();
  const qc = useQueryClient();

  const [transferindo, setTransferindo] = useState<{ alunoId: string; equipeOrigemId: string } | null>(null);
  const [equipeDestinoId, setEquipeDestinoId] = useState('');

  const handleTransferir = async () => {
    if (!transferindo || !equipeDestinoId || !user) return;
    // Update aluno's equipe (XP stays with old team - aluno enters new team with 0 individual XP contribution)
    await supabase.from('alunos').update({ equipe_id: equipeDestinoId }).eq('id', transferindo.alunoId);
    // Record transfer
    await supabase.from('transferencias').insert({
      user_id: user.id,
      aluno_id: transferindo.alunoId,
      equipe_origem_id: transferindo.equipeOrigemId,
      equipe_destino_id: equipeDestinoId
    });
    toast.success('Transferência realizada! O XP do aluno permanece na equipe anterior.');
    setTransferindo(null); setEquipeDestinoId('');
    qc.invalidateQueries({ queryKey: ['alunos'] });
    qc.invalidateQueries({ queryKey: ['transferencias'] });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
        <ArrowLeftRight className="w-6 h-6" /> Transferências
      </h1>

      <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
        ⚠️ Ao transferir um aluno, o XP individual dele permanece na equipe de origem. Ele entra na nova equipe zerado.
      </p>

      {transferindo && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <p className="text-sm text-foreground">Transferir <strong>{allAlunos.find((a: any) => a.id === transferindo.alunoId)?.nome}</strong> para:</p>
          <select value={equipeDestinoId} onChange={e => setEquipeDestinoId(e.target.value)} className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border">
            <option value="">Selecione a equipe destino</option>
            {equipes.filter((e: any) => e.id !== transferindo.equipeOrigemId).map((e: any) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleTransferir} disabled={!equipeDestinoId} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-30">Confirmar</button>
            <button onClick={() => setTransferindo(null)} className="rounded-lg bg-secondary text-foreground px-4 py-2 text-sm">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {equipes.map((equipe: any) => {
          const membros = allAlunos.filter((a: any) => a.equipe_id === equipe.id);
          return (
            <div key={equipe.id} className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-display font-bold text-foreground mb-3">{equipe.nome}</h3>
              <div className="space-y-1">
                {membros.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-sm bg-secondary/30 rounded-lg px-3 py-2">
                    <span className="text-foreground">{a.nome}</span>
                    <button onClick={() => setTransferindo({ alunoId: a.id, equipeOrigemId: equipe.id })}
                      className="text-xs text-primary hover:underline">Transferir →</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {transferencias.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-foreground mb-3">Histórico de Transferências</h2>
          <div className="space-y-2">
            {transferencias.map((t: any) => {
              const aluno = allAlunos.find((a: any) => a.id === t.aluno_id);
              const origem = equipes.find((e: any) => e.id === t.equipe_origem_id);
              const destino = equipes.find((e: any) => e.id === t.equipe_destino_id);
              return (
                <div key={t.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                  <span className="text-foreground">{aluno?.nome}</span>
                  <span className="text-muted-foreground"> de {origem?.nome} → {destino?.nome}</span>
                  <span className="text-xs text-muted-foreground ml-2">{new Date(t.data).toLocaleDateString('pt-BR')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
