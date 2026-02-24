import { useOcorrencias, useEquipes } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Ocorrencias() {
  const { data: ocorrencias = [], isLoading } = useOcorrencias();
  const { data: equipes = [] } = useEquipes();
  const qc = useQueryClient();

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('ocorrencias').update({ status }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['ocorrencias'] });
    toast.success('Status atualizado');
  };

  const statusIcon = (s: string) => {
    if (s === 'resolvida') return <CheckCircle className="w-4 h-4 text-primary" />;
    if (s === 'em_andamento') return <Clock className="w-4 h-4 text-level-6" />;
    return <AlertTriangle className="w-4 h-4 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
        <AlertTriangle className="w-6 h-6" /> Ocorrências
      </h1>
      <p className="text-sm text-muted-foreground">Ocorrências registradas pelos líderes de equipe</p>

      <div className="space-y-3">
        {ocorrencias.map((oc: any) => {
          const equipe = equipes.find((e: any) => e.id === oc.equipe_id);
          return (
            <div key={oc.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {statusIcon(oc.status)}
                  <div>
                    <p className="font-bold text-foreground">{oc.descricao}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {equipe?.nome} • {new Date(oc.created_at).toLocaleDateString('pt-BR')} • Registrado por: {oc.registrado_por}
                    </p>
                  </div>
                </div>
                <select value={oc.status} onChange={e => updateStatus(oc.id, e.target.value)}
                  className="bg-secondary text-secondary-foreground rounded-lg px-2 py-1 text-xs border border-border">
                  <option value="aberta">Aberta</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="resolvida">Resolvida</option>
                </select>
              </div>
            </div>
          );
        })}
        {ocorrencias.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-8">Nenhuma ocorrência registrada ainda.</p>
        )}
      </div>
    </div>
  );
}
