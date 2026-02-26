import { useSalas } from '@/hooks/useSupabaseData';
import { useSalaContext } from '@/hooks/useSalaContext';
import { Atom, Layers } from 'lucide-react';

export default function SalaSelector() {
  const { data: salas = [], isLoading } = useSalas();
  const { setActiveSalaId } = useSalaContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (salas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Atom className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-xl font-display font-bold text-foreground">Nenhuma turma cadastrada</h1>
          <p className="text-sm text-muted-foreground">Cadastre uma sala primeiro em Salas.</p>
          <button onClick={() => setActiveSalaId('__skip__')} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">
            Continuar mesmo assim
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4 space-y-6">
        <div className="text-center">
          <Atom className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-display font-bold text-foreground">Selecione a Turma</h1>
          <p className="text-sm text-muted-foreground mt-1">Escolha qual turma deseja visualizar</p>
        </div>
        <div className="space-y-3">
          {salas.map((sala: any) => (
            <button key={sala.id} onClick={() => setActiveSalaId(sala.id)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left hover:border-primary/50 transition-colors flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">{sala.nome}</h3>
                <p className="text-xs text-muted-foreground">{sala.ano_serie} • {sala.periodo}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
