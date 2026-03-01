import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSalas, useEquipes, useAlunos, useTiposAtividade, useLancamentos, useLancamentoEquipes, useLancamentoAlunos, useShopPurchases, calcEquipeXP } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function LancarXP() {
  const { user } = useAuth();
  const { data: salas = [] } = useSalas();
  const { data: atividades = [] } = useTiposAtividade();
  const { data: allAlunos = [] } = useAlunos();
  const { data: allEquipes = [] } = useEquipes();
  const { data: lancamentos = [] } = useLancamentos();
  const { data: lancEquipes = [] } = useLancamentoEquipes();
  const { data: lancAlunos = [] } = useLancamentoAlunos();
  const { data: purchases = [] } = useShopPurchases();
  const qc = useQueryClient();

  const [salaId, setSalaId] = useState('');
  const [atividadeId, setAtividadeId] = useState('');
  const [selectedAlunos, setSelectedAlunos] = useState<string[]>([]);
  const [selectedEquipes, setSelectedEquipes] = useState<string[]>([]);
  const [launched, setLaunched] = useState(false);

  const atividade = atividades.find((a: any) => a.id === atividadeId);
  const equipesFiltered = allEquipes.filter((e: any) => e.sala_id === salaId);
  const alunosFiltered = allAlunos.filter((a: any) => a.sala_id === salaId);

  const toggleAluno = (id: string) => setSelectedAlunos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleEquipe = (id: string) => setSelectedEquipes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleLancar = async () => {
    if (!salaId || !atividadeId || !user || !atividade) return;

    // Track crystals to add per equipe
    const cristaisPerEquipe: Record<string, number> = {};

    const addCristais = (equipeId: string, xp: number) => {
      if (xp > 0) {
        // 10 cristais a cada 10 XP (1:1 ratio, in multiples of 10)
        const gained = Math.floor(xp / 10) * 10;
        if (gained > 0) {
          cristaisPerEquipe[equipeId] = (cristaisPerEquipe[equipeId] || 0) + gained;
        }
      }
    };

    if (atividade.tipo === 'por_aluno') {
      const { data: lanc, error } = await supabase.from('lancamentos_xp').insert({
        user_id: user.id, atividade_id: atividadeId, sala_id: salaId, xp_concedido: atividade.xp
      }).select().single();
      if (error) { toast.error(error.message); return; }

      await supabase.from('lancamento_alunos').insert(
        selectedAlunos.map(aId => ({ lancamento_id: lanc.id, aluno_id: aId }))
      );

      // Add crystals per equipe based on how many members received XP
      if (atividade.xp > 0) {
        for (const equipe of equipesFiltered) {
          const membros = alunosFiltered.filter((a: any) => a.equipe_id === equipe.id);
          const count = membros.filter((m: any) => selectedAlunos.includes(m.id)).length;
          if (count > 0) {
            addCristais(equipe.id, atividade.xp * count);
          }
        }
      }

      // Check bonus: all members of any team completed
      const equipeBonus: string[] = [];
      for (const equipe of equipesFiltered) {
        const membros = alunosFiltered.filter((a: any) => a.equipe_id === equipe.id);
        const todosFizeram = membros.length > 0 && membros.every((m: any) => selectedAlunos.includes(m.id));
        if (todosFizeram) {
          equipeBonus.push(equipe.nome);
          const { data: bonusLanc } = await supabase.from('lancamentos_xp').insert({
            user_id: user.id, atividade_id: atividadeId, sala_id: salaId, xp_concedido: 10
          }).select().single();
          if (bonusLanc) {
            await supabase.from('lancamento_equipes').insert({ lancamento_id: bonusLanc.id, equipe_id: equipe.id });
            addCristais(equipe.id, 10);
          }
        }
      }
      if (equipeBonus.length > 0) toast.success(`🎉 Bônus "Todos entregaram" (+10 XP) para: ${equipeBonus.join(', ')}`);
    } else {
      // Per-equipe
      for (const eqId of selectedEquipes) {
        const { data: lanc } = await supabase.from('lancamentos_xp').insert({
          user_id: user.id, atividade_id: atividadeId, sala_id: salaId, xp_concedido: atividade.xp
        }).select().single();
        if (lanc) {
          await supabase.from('lancamento_equipes').insert({ lancamento_id: lanc.id, equipe_id: eqId });
          addCristais(eqId, atividade.xp);
        }
      }
    }

    // Auto-grant crystals to teams
    for (const [equipeId, cristais] of Object.entries(cristaisPerEquipe)) {
      if (cristais > 0) {
        const equipe = equipesFiltered.find((e: any) => e.id === equipeId);
        const current = equipe?.cristais ?? 0;
        await supabase.from('equipes').update({ cristais: current + cristais }).eq('id', equipeId);
      }
    }
    const totalCristaisGanhos = Object.values(cristaisPerEquipe).reduce((s, v) => s + v, 0);
    if (totalCristaisGanhos > 0) {
      toast.success(`💎 ${totalCristaisGanhos} cristais distribuídos automaticamente!`);
    }

    setLaunched(true);
    toast.success(`⚡ XP lançado com sucesso!`);
    qc.invalidateQueries({ queryKey: ['lancamentos'] });
    qc.invalidateQueries({ queryKey: ['lancamento_equipes'] });
    qc.invalidateQueries({ queryKey: ['lancamento_alunos'] });
    qc.invalidateQueries({ queryKey: ['equipes'] });

    setTimeout(() => {
      setLaunched(false);
      setSelectedAlunos([]);
      setSelectedEquipes([]);
      setAtividadeId('');
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Zap className="w-6 h-6" /> Lançar XP
        </h1>
        <p className="text-sm text-muted-foreground">Registre atividades e distribua pontos de experiência</p>
      </div>

      {/* Step 1: Sala */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-display font-bold text-foreground">1. Selecione a Sala</h2>
        <div className="grid grid-cols-2 gap-3">
          {salas.filter((s: any) => s.status === 'ativa').map((sala: any) => (
            <button key={sala.id} onClick={() => { setSalaId(sala.id); setSelectedAlunos([]); setSelectedEquipes([]); }}
              className={`rounded-lg border p-3 text-left transition-all ${salaId === sala.id ? 'border-primary bg-primary/10 glow-primary' : 'border-border bg-secondary hover:border-primary/30'}`}>
              <p className="font-bold text-foreground">{sala.nome}</p>
              <p className="text-xs text-muted-foreground">{sala.periodo}</p>
            </button>
          ))}
        </div>
        {salas.length === 0 && <p className="text-sm text-muted-foreground">Cadastre uma sala primeiro.</p>}
      </div>

      {/* Step 2: Atividade */}
      {salaId && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">2. Selecione a Atividade</h2>
          <div className="space-y-2">
            {atividades.map((at: any) => (
              <button key={at.id} onClick={() => { setAtividadeId(at.id); setSelectedAlunos([]); setSelectedEquipes([]); }}
                className={`w-full rounded-lg border p-3 text-left transition-all flex items-center justify-between ${atividadeId === at.id ? 'border-primary bg-primary/10 glow-primary' : 'border-border bg-secondary hover:border-primary/30'}`}>
                <div>
                  <p className="font-bold text-foreground">{at.nome}</p>
                  <p className="text-xs text-muted-foreground">{at.descricao} • {at.tipo === 'por_aluno' ? 'Por Aluno' : 'Por Equipe'}</p>
                </div>
                <span className={`font-display font-bold text-lg ${at.xp < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {at.xp > 0 ? '+' : ''}{at.xp}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Selection */}
      {salaId && atividade && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">
            3. {atividade.tipo === 'por_aluno' ? 'Marque os Alunos' : 'Selecione as Equipes'}
          </h2>
          {atividade.tipo === 'por_aluno' ? (
            <div className="space-y-3">
              {equipesFiltered.map((equipe: any) => {
                const membros = alunosFiltered.filter((a: any) => a.equipe_id === equipe.id);
                const todosSelected = membros.length > 0 && membros.every((m: any) => selectedAlunos.includes(m.id));
                return (
                  <div key={equipe.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-foreground">{equipe.nome}</span>
                      <button onClick={() => {
                        if (todosSelected) setSelectedAlunos(prev => prev.filter(id => !membros.find((m: any) => m.id === id)));
                        else setSelectedAlunos(prev => [...new Set([...prev, ...membros.map((m: any) => m.id)])]);
                      }} className="text-xs text-primary hover:underline">
                        {todosSelected ? 'Desmarcar todos' : 'Marcar todos'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {membros.map((aluno: any) => (
                        <label key={aluno.id}
                          className={`flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors ${selectedAlunos.includes(aluno.id) ? 'bg-primary/15 text-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>
                          <input type="checkbox" checked={selectedAlunos.includes(aluno.id)} onChange={() => toggleAluno(aluno.id)} className="accent-primary" />
                          <span className="text-sm">{aluno.nome}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{aluno.classe}</span>
                        </label>
                      ))}
                    </div>
                    {todosSelected && membros.length > 0 && (
                      <div className="mt-2 text-xs text-level-6 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Bônus "Todos entregaram" (+10 XP) será aplicado!
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Alunos without equipe */}
              {alunosFiltered.filter((a: any) => !a.equipe_id).length > 0 && (
                <div className="rounded-lg border border-border p-3">
                  <span className="font-bold text-sm text-foreground mb-2 block">Sem equipe</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {alunosFiltered.filter((a: any) => !a.equipe_id).map((aluno: any) => (
                      <label key={aluno.id}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors ${selectedAlunos.includes(aluno.id) ? 'bg-primary/15 text-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>
                        <input type="checkbox" checked={selectedAlunos.includes(aluno.id)} onChange={() => toggleAluno(aluno.id)} className="accent-primary" />
                        <span className="text-sm">{aluno.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {equipesFiltered.map((equipe: any) => {
                const xpTotal = calcEquipeXP(equipe.id, lancamentos, lancEquipes, lancAlunos, allAlunos, purchases);
                return (
                  <button key={equipe.id} onClick={() => toggleEquipe(equipe.id)}
                    className={`rounded-lg border p-3 text-left transition-all ${selectedEquipes.includes(equipe.id) ? 'border-primary bg-primary/10 glow-primary' : 'border-border bg-secondary hover:border-primary/30'}`}>
                    <div className="flex items-center gap-2">
                      {selectedEquipes.includes(equipe.id) && <Check className="w-4 h-4 text-primary" />}
                      <span className="font-bold text-foreground">{equipe.nome}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{xpTotal} XP</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {salaId && atividade && (
        <button onClick={handleLancar} disabled={launched || (atividade.tipo === 'por_aluno' ? selectedAlunos.length === 0 : selectedEquipes.length === 0)}
          className={`w-full rounded-xl py-4 font-display font-bold text-lg transition-all ${launched
            ? 'bg-primary/30 text-primary animate-xp-gain glow-strong'
            : 'bg-primary text-primary-foreground hover:glow-strong disabled:opacity-40 disabled:cursor-not-allowed'}`}>
          {launched ? '✅ XP Lançado!' : '⚡ Lançar XP'}
        </button>
      )}
    </div>
  );
}
