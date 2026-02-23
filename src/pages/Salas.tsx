import { useState } from 'react';
import { mockSalas } from '@/data/mockData';
import { Sala } from '@/types/game';
import { Layers, Plus, Edit2, Trash2 } from 'lucide-react';

export default function Salas() {
  const [salas] = useState<Sala[]>(mockSalas);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Layers className="w-6 h-6" /> Salas
        </h1>
        <button className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:glow-primary transition-all">
          <Plus className="w-4 h-4" /> Nova Sala
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {salas.map(sala => (
          <div key={sala.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-foreground">{sala.nome}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${sala.status === 'ativa' ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
                {sala.status}
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Série: {sala.anoSerie}</p>
              <p>Período: {sala.periodo}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="w-3 h-3" /> Editar
              </button>
              <button className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive transition-colors">
                <Trash2 className="w-3 h-3" /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
