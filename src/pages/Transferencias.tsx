import { mockEquipes, mockAlunos, mockSalas } from '@/data/mockData';
import { ArrowLeftRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Transferencias() {
  const [salaId, setSalaId] = useState('s1');
  const equipes = mockEquipes.filter(e => e.salaId === salaId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
        <ArrowLeftRight className="w-6 h-6" /> Transferências
      </h1>

      <div className="rounded-xl border border-level-6/30 bg-level-6/5 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-level-6 shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-bold text-foreground">Atenção: Cada equipe pode receber apenas 1 transferência por semestre.</p>
          <p className="mt-1">Após a transferência, o aluno mantém seu XP individual, mas passa a contribuir para a nova equipe.</p>
        </div>
      </div>

      <select value={salaId} onChange={e => setSalaId(e.target.value)} className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm border border-border font-mono w-full">
        {mockSalas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
      </select>

      <div className="space-y-3">
        {equipes.map(equipe => {
          const membros = mockAlunos.filter(a => a.equipeId === equipe.id);
          const transferenciasUsadas = equipe.transferenciasUsadas > 0;
          return (
            <div key={equipe.id} className={`rounded-xl border p-4 ${transferenciasUsadas ? 'border-destructive/30 bg-card' : 'border-border bg-card'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-foreground">{equipe.nome}</h3>
                <span className={`text-xs font-mono ${transferenciasUsadas ? 'text-destructive' : 'text-primary'}`}>
                  {transferenciasUsadas ? '✗ Transferência usada' : '✓ Transferência disponível'}
                </span>
              </div>
              <div className="space-y-1">
                {membros.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm bg-secondary/30 rounded-lg px-3 py-2">
                    <span className="text-foreground">{a.nome}</span>
                    <button
                      disabled={transferenciasUsadas}
                      onClick={() => toast.info('Funcionalidade disponível com o banco de dados conectado')}
                      className="text-xs text-primary hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Transferir →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
