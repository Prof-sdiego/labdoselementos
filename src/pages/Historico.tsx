import { mockLancamentos, mockTiposAtividade, mockAlunos, mockEquipes, mockSalas } from '@/data/mockData';
import { History, Undo2 } from 'lucide-react';

export default function Historico() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
        <History className="w-6 h-6" /> Histórico de XP
      </h1>

      <div className="space-y-3">
        {mockLancamentos.map(lanc => {
          const atividade = mockTiposAtividade.find(a => a.id === lanc.atividadeId);
          const sala = mockSalas.find(s => s.id === lanc.salaId);
          const equipes = lanc.equipeIds.map(id => mockEquipes.find(e => e.id === id)?.nome).filter(Boolean);
          const alunos = lanc.alunoIds.map(id => mockAlunos.find(a => a.id === id)?.nome).filter(Boolean);

          return (
            <div key={lanc.id} className={`rounded-xl border bg-card p-4 ${lanc.estornado ? 'border-destructive/30 opacity-50' : 'border-border'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">{atividade?.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(lanc.data).toLocaleDateString('pt-BR')} • {sala?.nome}
                  </p>
                  {equipes.length > 0 && <p className="text-xs text-muted-foreground">Equipes: {equipes.join(', ')}</p>}
                  {alunos.length > 0 && <p className="text-xs text-muted-foreground">Alunos: {alunos.join(', ')}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-display font-bold text-primary">+{lanc.xpConcedido}</span>
                  {!lanc.estornado && (
                    <button className="text-xs text-destructive/70 hover:text-destructive flex items-center gap-1 transition-colors">
                      <Undo2 className="w-3 h-3" /> Estornar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
