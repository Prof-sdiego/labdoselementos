import { useState } from 'react';
import { mockAlunos, mockEquipes, mockSalas } from '@/data/mockData';
import { CLASSES_INFO, getNivel } from '@/types/game';
import { GraduationCap, Star, Shield, Unlock } from 'lucide-react';

export default function RankingIndividual() {
  const [salaId, setSalaId] = useState('s1');
  const [equipeFilter, setEquipeFilter] = useState('');

  let alunos = mockAlunos.filter(a => a.salaId === salaId);
  if (equipeFilter) alunos = alunos.filter(a => a.equipeId === equipeFilter);
  alunos = [...alunos].sort((a, b) => b.xpIndividual - a.xpIndividual);

  const cientistaMes = alunos[0];
  const equipesFiltered = mockEquipes.filter(e => e.salaId === salaId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <GraduationCap className="w-6 h-6" /> Ranking Individual
        </h1>
        <div className="flex items-center gap-3">
          <select value={salaId} onChange={e => { setSalaId(e.target.value); setEquipeFilter(''); }} className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm border border-border font-mono">
            {mockSalas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <select value={equipeFilter} onChange={e => setEquipeFilter(e.target.value)} className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm border border-border font-mono">
            <option value="">Todas equipes</option>
            {equipesFiltered.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {alunos.map((aluno, idx) => {
          const equipe = mockEquipes.find(e => e.id === aluno.equipeId);
          const nivelEquipe = equipe ? getNivel(equipe.xpTotal) : null;
          const classeInfo = CLASSES_INFO[aluno.classe];
          const poderDesbloqueado = nivelEquipe && nivelEquipe.nivel >= classeInfo.desbloqueiaNivel;
          const isCientista = cientistaMes?.id === aluno.id;

          return (
            <div key={aluno.id} className={`rounded-xl border p-4 flex items-center gap-4 transition-colors ${isCientista ? 'border-level-6/50 bg-level-6/5' : 'border-border bg-card hover:border-primary/20'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${idx === 0 ? 'bg-level-6/20 text-level-6' : idx === 1 ? 'bg-level-7/20 text-level-7' : idx === 2 ? 'bg-level-2/20 text-level-2' : 'bg-secondary text-muted-foreground'}`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground truncate">{aluno.nome}</span>
                  {isCientista && <Star className="w-4 h-4 text-level-6 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>{equipe?.nome}</span>
                  <span>•</span>
                  <span>{aluno.classe}</span>
                  <span>•</span>
                  {poderDesbloqueado ? (
                    <span className="text-primary flex items-center gap-1"><Unlock className="w-3 h-3" /> Poder ativo</span>
                  ) : (
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Nv.{classeInfo.desbloqueiaNivel}</span>
                  )}
                </div>
              </div>
              <span className="font-display font-bold text-lg text-primary shrink-0">{aluno.xpIndividual} XP</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
