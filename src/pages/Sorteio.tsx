import { useState, useCallback } from 'react';
import { useSalaContext } from '@/hooks/useSalaContext';
import { useEquipes, useAlunos, useLancamentos, useLancamentoAlunos, useTiposAtividade, calcAlunoXP } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shuffle, Zap, UserX, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function Sorteio() {
  const { user } = useAuth();
  const { activeSalaId } = useSalaContext();
  const { data: allEquipes = [] } = useEquipes(activeSalaId || undefined);
  const { data: allAlunos = [] } = useAlunos(activeSalaId || undefined);
  const { data: lancamentos = [] } = useLancamentos();
  const { data: lancAlunos = [] } = useLancamentoAlunos();
  const { data: atividades = [] } = useTiposAtividade();
  const qc = useQueryClient();

  const equipes = allEquipes.filter((e: any) => e.sala_id === activeSalaId);

  // State
  const [sorteado, setSorteado] = useState<any>(null);
  const [sorteadoEquipe, setSorteadoEquipe] = useState<any>(null);
  const [animating, setAnimating] = useState(false);
  const [lastTeamIndex, setLastTeamIndex] = useState(-1);
  const [usedTeamIds, setUsedTeamIds] = useState<string[]>([]);
  const [faltouMode, setFaltouMode] = useState(false);
  const [usedAlunoIds, setUsedAlunoIds] = useState<string[]>([]);
  const [historico, setHistorico] = useState<{ aluno: string; equipe: string; acao: string }[]>([]);

  const getNextTeamIndex = useCallback(() => {
    if (equipes.length === 0) return -1;
    // Filter teams that still have students
    const availableTeams = equipes.filter((e: any) => {
      const membros = allAlunos.filter((a: any) => a.equipe_id === e.id && !usedAlunoIds.includes(a.id));
      return membros.length > 0;
    });
    if (availableTeams.length === 0) return -1;

    // Remove teams already used in this round
    let candidates = availableTeams.filter((e: any) => !usedTeamIds.includes(e.id));
    if (candidates.length === 0) {
      // All teams used, reset round
      setUsedTeamIds([]);
      candidates = availableTeams;
    }

    // Pick random from candidates
    const idx = Math.floor(Math.random() * candidates.length);
    return equipes.findIndex((e: any) => e.id === candidates[idx].id);
  }, [equipes, allAlunos, usedTeamIds, usedAlunoIds]);

  const sortear = useCallback((forceTeamId?: string) => {
    if (equipes.length === 0) { toast.error('Nenhuma equipe na sala'); return; }
    setAnimating(true);
    setFaltouMode(false);

    setTimeout(() => {
      let teamId = forceTeamId;
      let teamIdx: number;

      if (!teamId) {
        teamIdx = getNextTeamIndex();
        if (teamIdx === -1) { toast.info('Todos os alunos já foram sorteados!'); setAnimating(false); return; }
        teamId = equipes[teamIdx].id;
      }

      const team = equipes.find((e: any) => e.id === teamId);
      const membros = allAlunos.filter((a: any) => a.equipe_id === teamId && !usedAlunoIds.includes(a.id));

      if (membros.length === 0) {
        toast.info(`Equipe ${team?.nome} sem alunos disponíveis`);
        setAnimating(false);
        return;
      }

      const aluno = membros[Math.floor(Math.random() * membros.length)];
      setSorteado(aluno);
      setSorteadoEquipe(team);
      setUsedTeamIds(prev => [...prev, teamId!]);
      setAnimating(false);
    }, 800);
  }, [equipes, allAlunos, usedAlunoIds, getNextTeamIndex]);

  const handleXP = async () => {
    if (!sorteado || !user || !activeSalaId) return;
    // Find a "Participação destaque" activity or use first por_aluno activity
    let atv = atividades.find((a: any) => a.nome === 'Participação destaque');
    if (!atv) atv = atividades.find((a: any) => a.tipo === 'por_aluno' && a.xp > 0);
    if (!atv) { toast.error('Crie uma atividade "por_aluno" primeiro'); return; }

    const { data: lanc, error } = await supabase.from('lancamentos_xp').insert({
      user_id: user.id, sala_id: activeSalaId, atividade_id: atv.id, xp_concedido: 3, data: new Date().toISOString()
    }).select().single();
    if (error) { toast.error(error.message); return; }

    await supabase.from('lancamento_alunos').insert({ lancamento_id: lanc.id, aluno_id: sorteado.id });
    qc.invalidateQueries({ queryKey: ['lancamentos'] });
    qc.invalidateQueries({ queryKey: ['lancamento_alunos'] });

    setHistorico(prev => [{ aluno: sorteado.nome, equipe: sorteadoEquipe?.nome || '', acao: '+3 XP' }, ...prev]);
    setUsedAlunoIds(prev => [...prev, sorteado.id]);
    toast.success(`+3 XP para ${sorteado.nome}!`);
    setSorteado(null);
    setSorteadoEquipe(null);
  };

  const handleFaltou = () => {
    if (!sorteado || !sorteadoEquipe) return;
    setHistorico(prev => [{ aluno: sorteado.nome, equipe: sorteadoEquipe?.nome || '', acao: 'Faltou' }, ...prev]);
    setUsedAlunoIds(prev => [...prev, sorteado.id]);
    const teamId = sorteadoEquipe.id;
    // Remove this team from usedTeamIds so it gets re-picked
    setUsedTeamIds(prev => prev.filter(id => id !== teamId));
    setSorteado(null);
    setSorteadoEquipe(null);
    // Re-sort from same team
    sortear(teamId);
  };

  const resetSorteio = () => {
    setSorteado(null);
    setSorteadoEquipe(null);
    setUsedTeamIds([]);
    setUsedAlunoIds([]);
    setHistorico([]);
    setLastTeamIndex(-1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Shuffle className="w-6 h-6" /> Sorteio de Alunos
        </h1>
        <button onClick={resetSorteio} className="flex items-center gap-2 rounded-lg bg-secondary text-foreground px-4 py-2 text-sm font-bold hover:bg-secondary/80 transition-all">
          <RotateCcw className="w-4 h-4" /> Reiniciar
        </button>
      </div>

      {/* Main draw area */}
      <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center justify-center min-h-[300px] space-y-6">
        {animating ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground font-display animate-pulse">Sorteando...</p>
          </div>
        ) : sorteado ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
              <span className="text-3xl font-display font-bold text-primary">
                {sorteado.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground">{sorteado.nome}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Equipe: <span className="text-primary font-bold">{sorteadoEquipe?.nome}</span>
              </p>
              <p className="text-xs text-muted-foreground">Classe: {sorteado.classe}</p>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={handleXP}
                className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-bold hover:glow-primary transition-all">
                <Zap className="w-4 h-4" /> +3 XP
              </button>
              <button onClick={handleFaltou}
                className="flex items-center gap-2 rounded-lg bg-destructive text-destructive-foreground px-6 py-3 text-sm font-bold hover:opacity-90 transition-all">
                <UserX className="w-4 h-4" /> Faltou
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => sortear()}
            className="flex items-center gap-3 rounded-xl bg-primary text-primary-foreground px-8 py-4 text-lg font-display font-bold hover:glow-primary transition-all">
            <Shuffle className="w-6 h-6" /> Sortear Aluno
          </button>
        )}
      </div>

      {/* Progress */}
      {equipes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {equipes.map((eq: any) => {
            const total = allAlunos.filter((a: any) => a.equipe_id === eq.id).length;
            const used = allAlunos.filter((a: any) => a.equipe_id === eq.id && usedAlunoIds.includes(a.id)).length;
            return (
              <div key={eq.id} className={cn(
                "rounded-lg border border-border bg-card p-3 text-center",
                usedTeamIds.includes(eq.id) && "opacity-50"
              )}>
                <p className="font-display font-bold text-foreground text-sm truncate">{eq.nome}</p>
                <p className="text-xs text-muted-foreground">{used}/{total} sorteados</p>
              </div>
            );
          })}
        </div>
      )}

      {/* History */}
      {historico.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-bold text-foreground mb-3">Histórico desta sessão</h3>
          <div className="space-y-2">
            {historico.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-secondary/50 rounded-lg px-3 py-2">
                <span className="text-foreground">{h.aluno} <span className="text-muted-foreground">({h.equipe})</span></span>
                <span className={cn("font-bold text-xs", h.acao === 'Faltou' ? 'text-destructive' : 'text-primary')}>{h.acao}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
