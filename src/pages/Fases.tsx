import { mockFases } from '@/data/mockData';
import { Layers, Plus, Play, Square } from 'lucide-react';

export default function Fases() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Layers className="w-6 h-6" /> Fases
        </h1>
        <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:glow-primary transition-all">
          <Plus className="w-4 h-4" /> Nova Fase
        </button>
      </div>

      <p className="text-sm text-muted-foreground">Ao iniciar uma nova fase, o controle de "poder já usado" de todos os alunos é resetado.</p>

      <div className="space-y-3">
        {mockFases.map(fase => (
          <div key={fase.id} className={`rounded-xl border p-5 ${fase.ativa ? 'border-primary/40 bg-primary/5 glow-primary' : 'border-border bg-card'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-foreground">{fase.nome}</h3>
                  {fase.ativa && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono flex items-center gap-1">
                      <Play className="w-3 h-3" /> Ativa
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Início: {new Date(fase.dataInicio).toLocaleDateString('pt-BR')}
                  {fase.dataFim && ` • Fim: ${new Date(fase.dataFim).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              {fase.ativa && (
                <button className="flex items-center gap-1 text-sm text-destructive/70 hover:text-destructive transition-colors">
                  <Square className="w-4 h-4" /> Encerrar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
