import { useState } from 'react';
import { useSalas, useEquipes, useAlunos, useLancamentos, useLancamentoEquipes, useLancamentoAlunos, useShopPurchases, calcEquipeXP, calcAlunoXP } from '@/hooks/useSupabaseData';
import { LevelBadge, XPProgressBar } from '@/components/game/LevelBadge';
import { Trophy, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RankingEquipes() {
  const { data: salas = [] } = useSalas();
  const { data: allEquipes = [] } = useEquipes();
  const { data: allAlunos = [] } = useAlunos();
  const { data: lancamentos = [] } = useLancamentos();
  const { data: lancEquipes = [] } = useLancamentoEquipes();
  const { data: lancAlunos = [] } = useLancamentoAlunos();
  const { data: purchases = [] } = useShopPurchases();

  const [salaId, setSalaId] = useState('');
  const [detailEquipe, setDetailEquipe] = useState<string | null>(null);
  const activeSala = salaId || salas[0]?.id || '';

  const equipes = allEquipes
    .filter((e: any) => e.sala_id === activeSala)
    .map((e: any) => ({ ...e, xpTotal: calcEquipeXP(e.id, lancamentos, lancEquipes, lancAlunos, allAlunos, purchases) }))
    .sort((a: any, b: any) => b.xpTotal - a.xpTotal);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Trophy className="w-6 h-6" /> Ranking das Equipes
        </h1>
        <div className="flex items-center gap-3">
          <select value={activeSala} onChange={e => setSalaId(e.target.value)} className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm border border-border font-mono">
            {salas.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <Link to="/tv" className="flex items-center gap-2 rounded-lg bg-primary/15 text-primary px-3 py-2 text-sm font-bold hover:bg-primary/25 transition-colors">
            <Monitor className="w-4 h-4" /> Modo TV
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {equipes.map((equipe: any, idx: number) => {
          const membros = allAlunos.filter((a: any) => a.equipe_id === equipe.id)
            .map((a: any) => ({ ...a, xpIndividual: calcAlunoXP(a.id, lancamentos, lancAlunos) }))
            .sort((a: any, b: any) => b.xpIndividual - a.xpIndividual);
          const isOpen = detailEquipe === equipe.id;
          return (
            <div key={equipe.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button onClick={() => setDetailEquipe(isOpen ? null : equipe.id)} className="w-full p-4 text-left hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full font-display font-bold text-xl ${idx === 0 ? 'bg-level-6/20 text-level-6 animate-pulse-glow' : idx === 1 ? 'bg-level-7/20 text-level-7' : idx === 2 ? 'bg-level-2/20 text-level-2' : 'bg-secondary text-muted-foreground'}`}>
                    {idx + 1}º
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-foreground">{equipe.nome}</span>
                      <LevelBadge xp={equipe.xpTotal} size="sm" />
                    </div>
                    <XPProgressBar xp={equipe.xpTotal} />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-display font-bold text-primary">{equipe.xpTotal}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-border p-4 bg-secondary/20">
                  <h4 className="text-sm font-display font-bold text-muted-foreground mb-3">Membros</h4>
                  <div className="space-y-2">
                    {membros.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{a.nome}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{a.classe}</span>
                          <span className="font-mono font-bold text-primary">{a.xpIndividual} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
