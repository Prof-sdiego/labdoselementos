import { useSalas, useEquipes, useAlunos, useLancamentos, useLancamentoEquipes, useLancamentoAlunos, useShopPurchases, calcEquipeXP, calcAlunoXP } from '@/hooks/useSupabaseData';
import { useSalaContext } from '@/hooks/useSalaContext';
import { getNivel } from '@/types/game';
import { LevelBadge, XPProgressBar } from '@/components/game/LevelBadge';
import { Trophy, Star, Target, Zap, FlaskConical, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: salas = [] } = useSalas();
  const { activeSalaId } = useSalaContext();
  const { data: allEquipes = [] } = useEquipes(activeSalaId || undefined);
  const { data: allAlunos = [] } = useAlunos(activeSalaId || undefined);
  const { data: lancamentos = [] } = useLancamentos();
  const { data: lancEquipes = [] } = useLancamentoEquipes();
  const { data: lancAlunos = [] } = useLancamentoAlunos();
  const { data: purchases = [] } = useShopPurchases();

  const equipesFiltered = allEquipes
    .map((e: any) => ({ ...e, xpTotal: calcEquipeXP(e.id, lancamentos, lancEquipes, lancAlunos, allAlunos, purchases) }))
    .sort((a: any, b: any) => b.xpTotal - a.xpTotal);

  const alunosFiltered = allAlunos
    .map((a: any) => ({ ...a, xpIndividual: calcAlunoXP(a.id, lancamentos, lancAlunos) }));

  const cientistaMes = [...alunosFiltered].sort((a, b) => b.xpIndividual - a.xpIndividual)[0];
  const equipesNivel4 = equipesFiltered.filter((e: any) => getNivel(e.xpTotal).nivel >= 4).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary text-glow">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Laboratório dos Elementos — Visão geral</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FlaskConical} label="Equipes" value={equipesFiltered.length} color="text-primary" />
        <StatCard icon={Users} label="Alunos" value={alunosFiltered.length} color="text-level-3" />
        <StatCard icon={Target} label="Meta Nv.4" value={`${equipesNivel4}/${equipesFiltered.length}`} color="text-level-6" />
        <StatCard icon={Zap} label="XP Total" value={equipesFiltered.reduce((s: number, e: any) => s + e.xpTotal, 0)} color="text-level-5" />
      </div>

      {cientistaMes && (
        <div className="rounded-xl border border-level-6/30 bg-card p-5 animate-pulse-glow">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-level-6/20 border-2 border-level-6">
              <Star className="w-8 h-8 text-level-6" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-level-6">🏆 Cientista do Mês</p>
              <h2 className="text-xl font-display font-bold text-foreground">{cientistaMes.nome}</h2>
              <p className="text-sm text-muted-foreground">
                {cientistaMes.xpIndividual} XP individual • {cientistaMes.classe} •{' '}
                {allEquipes.find((e: any) => e.id === cientistaMes.equipe_id)?.nome}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold text-foreground">Ranking das Equipes</h2>
          <Link to="/ranking-equipes" className="text-sm text-primary hover:underline">Ver completo →</Link>
        </div>
        <div className="space-y-3">
          {equipesFiltered.map((equipe: any, idx: number) => (
            <div key={equipe.id} className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-display font-bold text-lg ${idx === 0 ? 'bg-level-6/20 text-level-6' : idx === 1 ? 'bg-level-7/20 text-level-7' : idx === 2 ? 'bg-level-2/20 text-level-2' : 'bg-secondary text-muted-foreground'}`}>
                  {idx + 1}º
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground truncate">{equipe.nome}</span>
                    <LevelBadge xp={equipe.xpTotal} size="sm" />
                  </div>
                  <XPProgressBar xp={equipe.xpTotal} />
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-display font-bold text-primary">{equipe.xpTotal}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                  <p className="text-xs font-bold text-level-6">💎 {equipe.cristais ?? 0}</p>
                </div>
              </div>
            </div>
          ))}
          {equipesFiltered.length === 0 && <p className="text-center text-muted-foreground py-8">Cadastre salas e equipes para ver o ranking.</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-display font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
