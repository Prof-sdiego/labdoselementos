import { mockTiposAtividade } from '@/data/mockData';
import { ScrollText, Plus } from 'lucide-react';

export default function Atividades() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <ScrollText className="w-6 h-6" /> Tipos de Atividade
        </h1>
        <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:glow-primary transition-all">
          <Plus className="w-4 h-4" /> Nova Atividade
        </button>
      </div>

      <div className="space-y-3">
        {mockTiposAtividade.map(at => (
          <div key={at.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">{at.nome}</h3>
                {at.isBonus && <span className="text-xs px-2 py-0.5 rounded-full bg-level-6/15 text-level-6 font-mono">Bônus</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{at.descricao}</p>
              <p className="text-xs text-muted-foreground mt-1">{at.tipo === 'por_aluno' ? 'Por Aluno' : 'Por Equipe'}</p>
            </div>
            <span className={`text-2xl font-display font-bold ${at.xp < 0 ? 'text-destructive' : 'text-primary'}`}>
              {at.xp > 0 ? '+' : ''}{at.xp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
