import { useState } from 'react';
import { mockAlunos, mockEquipes, mockSalas } from '@/data/mockData';
import { CLASSES_INFO, getNivel } from '@/types/game';
import { Users, Plus, Shield, Unlock } from 'lucide-react';

export default function Alunos() {
  const [salaId, setSalaId] = useState('s1');
  const alunos = mockAlunos.filter(a => a.salaId === salaId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Users className="w-6 h-6" /> Alunos
        </h1>
        <div className="flex items-center gap-3">
          <select value={salaId} onChange={e => setSalaId(e.target.value)} className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm border border-border font-mono">
            {mockSalas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:glow-primary transition-all">
            <Plus className="w-4 h-4" /> Novo Aluno
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-display font-bold text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-display font-bold text-muted-foreground">Equipe</th>
                <th className="text-left px-4 py-3 font-display font-bold text-muted-foreground">Classe</th>
                <th className="text-center px-4 py-3 font-display font-bold text-muted-foreground">XP</th>
                <th className="text-center px-4 py-3 font-display font-bold text-muted-foreground">Poder</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map(aluno => {
                const equipe = mockEquipes.find(e => e.id === aluno.equipeId);
                const nivelEquipe = equipe ? getNivel(equipe.xpTotal) : null;
                const classeInfo = CLASSES_INFO[aluno.classe];
                const desbloqueado = nivelEquipe && nivelEquipe.nivel >= classeInfo.desbloqueiaNivel;
                return (
                  <tr key={aluno.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{aluno.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{equipe?.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{aluno.classe}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-primary">{aluno.xpIndividual}</td>
                    <td className="px-4 py-3 text-center">
                      {desbloqueado ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary"><Unlock className="w-3 h-3" /> Ativo</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Shield className="w-3 h-3" /> Nv.{classeInfo.desbloqueiaNivel}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
