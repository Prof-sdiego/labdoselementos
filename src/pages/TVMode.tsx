import { useSalas, useEquipes, useAlunos, useLancamentos, useLancamentoEquipes, useLancamentoAlunos, useShopPurchases, calcEquipeXP, calcAlunoXP } from '@/hooks/useSupabaseData';
import { LevelBadge, XPProgressBar } from '@/components/game/LevelBadge';
import { Star, Atom, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function TVMode() {
  const { data: salas = [] } = useSalas();
  const { data: allEquipes = [] } = useEquipes();
  const { data: allAlunos = [] } = useAlunos();
  const { data: lancamentos = [] } = useLancamentos();
  const { data: lancEquipes = [] } = useLancamentoEquipes();
  const { data: lancAlunos = [] } = useLancamentoAlunos();
  const { data: purchases = [] } = useShopPurchases();

  const [salaId, setSalaId] = useState('');
  const activeSala = salaId || salas[0]?.id || '';

  const equipes = allEquipes
    .filter((e: any) => e.sala_id === activeSala)
    .map((e: any) => ({ ...e, xpTotal: calcEquipeXP(e.id, lancamentos, lancEquipes, lancAlunos, allAlunos, purchases) }))
    .sort((a: any, b: any) => b.xpTotal - a.xpTotal);

  const alunosData = allAlunos
    .filter((a: any) => a.sala_id === activeSala)
    .map((a: any) => ({ ...a, xpIndividual: calcAlunoXP(a.id, lancamentos, lancAlunos) }));

  const cientistaMes = [...alunosData].sort((a, b) => b.xpIndividual - a.xpIndividual)[0];

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 glow-strong">
            <Atom className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-primary text-glow tracking-wider">LABORATÓRIO DOS ELEMENTOS</h1>
            <p className="text-muted-foreground font-mono text-sm">{salas.find((s: any) => s.id === activeSala)?.nome}</p>
          </div>
        </div>
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        <div className="lg:col-span-2 space-y-4">
          {equipes.map((equipe: any, idx: number) => (
            <div key={equipe.id} className={`rounded-2xl border p-6 flex items-center gap-6 ${idx === 0 ? 'border-level-6/40 bg-level-6/5 glow-primary' : 'border-border bg-card'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-display font-black text-2xl ${idx === 0 ? 'bg-level-6/20 text-level-6' : idx === 1 ? 'bg-level-7/20 text-level-7' : idx === 2 ? 'bg-level-2/20 text-level-2' : 'bg-secondary text-muted-foreground'}`}>
                {idx + 1}º
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl lg:text-2xl font-display font-bold text-foreground">{equipe.nome}</span>
                  <LevelBadge xp={equipe.xpTotal} size="md" />
                </div>
                <XPProgressBar xp={equipe.xpTotal} />
              </div>
              <div className="text-right">
                <p className="text-3xl lg:text-4xl font-display font-black text-primary text-glow">{equipe.xpTotal}</p>
                <p className="text-sm text-muted-foreground font-mono">XP</p>
              </div>
            </div>
          ))}
        </div>

        {cientistaMes && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-level-6/30 bg-card p-8 animate-pulse-glow">
            <Star className="w-16 h-16 text-level-6 mb-4 animate-float" />
            <p className="text-xs font-mono uppercase tracking-widest text-level-6 mb-2">🏆 Cientista do Mês</p>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground text-center">{cientistaMes.nome}</h2>
            <p className="text-4xl font-display font-black text-primary text-glow mt-3">{cientistaMes.xpIndividual} XP</p>
            <p className="text-muted-foreground text-sm mt-2">{cientistaMes.classe} • {allEquipes.find((e: any) => e.id === cientistaMes.equipe_id)?.nome}</p>
          </div>
        )}
      </div>
    </div>
  );
}
