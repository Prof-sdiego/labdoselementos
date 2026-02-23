import { useState } from 'react';
import { mockEquipes, mockAlunos, mockSalas } from '@/data/mockData';
import { getNivel } from '@/types/game';
import { LevelBadge, XPProgressBar } from '@/components/game/LevelBadge';
import { FlaskConical, Plus, Users } from 'lucide-react';

export default function Equipes() {
  const [salaId, setSalaId] = useState('s1');
  const equipes = mockEquipes.filter(e => e.salaId === salaId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <FlaskConical className="w-6 h-6" /> Equipes (Laboratórios)
        </h1>
        <div className="flex items-center gap-3">
          <select value={salaId} onChange={e => setSalaId(e.target.value)} className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm border border-border font-mono">
            {mockSalas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:glow-primary transition-all">
            <Plus className="w-4 h-4" /> Nova Equipe
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {equipes.map(equipe => {
          const membros = mockAlunos.filter(a => a.equipeId === equipe.id);
          return (
            <div key={equipe.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-foreground text-lg">{equipe.nome}</h3>
                  <LevelBadge xp={equipe.xpTotal} size="sm" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold text-primary">{equipe.xpTotal}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
              <XPProgressBar xp={equipe.xpTotal} />
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> {membros.length}/6 membros</p>
                <div className="space-y-1.5">
                  {membros.map(a => (
                    <div key={a.id} className="flex items-center justify-between text-sm bg-secondary/50 rounded-lg px-3 py-1.5">
                      <span className="text-foreground">{a.nome}</span>
                      <span className="text-xs text-muted-foreground">{a.classe} • {a.xpIndividual} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
