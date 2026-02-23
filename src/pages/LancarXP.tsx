import { useState } from 'react';
import { mockSalas, mockEquipes, mockAlunos, mockTiposAtividade } from '@/data/mockData';
import { Zap, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function LancarXP() {
  const [salaId, setSalaId] = useState('');
  const [atividadeId, setAtividadeId] = useState('');
  const [selectedAlunos, setSelectedAlunos] = useState<string[]>([]);
  const [selectedEquipes, setSelectedEquipes] = useState<string[]>([]);
  const [launched, setLaunched] = useState(false);

  const atividade = mockTiposAtividade.find(a => a.id === atividadeId);
  const equipesFiltered = mockEquipes.filter(e => e.salaId === salaId);
  const alunosFiltered = mockAlunos.filter(a => a.salaId === salaId);

  const toggleAluno = (id: string) => {
    setSelectedAlunos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleEquipe = (id: string) => {
    setSelectedEquipes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleLancar = () => {
    if (!salaId || !atividadeId) return;
    if (atividade?.tipo === 'por_aluno' && selectedAlunos.length === 0) return;
    if (atividade?.tipo === 'por_equipe' && selectedEquipes.length === 0) return;

    let xpTotal = 0;
    if (atividade?.tipo === 'por_aluno') {
      xpTotal = selectedAlunos.length * atividade.xp;
      // Check bonus: all members of any team completed
      const equipeBonus: string[] = [];
      equipesFiltered.forEach(equipe => {
        const membros = alunosFiltered.filter(a => a.equipeId === equipe.id);
        const todosFizeram = membros.every(m => selectedAlunos.includes(m.id));
        if (todosFizeram && membros.length > 0) {
          equipeBonus.push(equipe.nome);
          xpTotal += 10;
        }
      });
      if (equipeBonus.length > 0) {
        toast.success(`🎉 Bônus "Todos entregaram" (+10 XP) para: ${equipeBonus.join(', ')}`);
      }
    } else {
      xpTotal = selectedEquipes.length * (atividade?.xp || 0);
    }

    setLaunched(true);
    toast.success(`⚡ ${Math.abs(xpTotal)} XP ${(atividade?.xp || 0) < 0 ? 'removidos' : 'lançados'} com sucesso!`);

    setTimeout(() => {
      setLaunched(false);
      setSelectedAlunos([]);
      setSelectedEquipes([]);
      setAtividadeId('');
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Zap className="w-6 h-6" /> Lançar XP
        </h1>
        <p className="text-sm text-muted-foreground">Registre atividades e distribua pontos de experiência</p>
      </div>

      {/* Step 1: Sala */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-display font-bold text-foreground">1. Selecione a Sala</h2>
        <div className="grid grid-cols-2 gap-3">
          {mockSalas.filter(s => s.status === 'ativa').map(sala => (
            <button
              key={sala.id}
              onClick={() => { setSalaId(sala.id); setSelectedAlunos([]); setSelectedEquipes([]); }}
              className={`rounded-lg border p-3 text-left transition-all ${salaId === sala.id ? 'border-primary bg-primary/10 glow-primary' : 'border-border bg-secondary hover:border-primary/30'}`}
            >
              <p className="font-bold text-foreground">{sala.nome}</p>
              <p className="text-xs text-muted-foreground">{sala.periodo}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Atividade */}
      {salaId && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">2. Selecione a Atividade</h2>
          <div className="space-y-2">
            {mockTiposAtividade.map(at => (
              <button
                key={at.id}
                onClick={() => { setAtividadeId(at.id); setSelectedAlunos([]); setSelectedEquipes([]); }}
                className={`w-full rounded-lg border p-3 text-left transition-all flex items-center justify-between ${atividadeId === at.id ? 'border-primary bg-primary/10 glow-primary' : 'border-border bg-secondary hover:border-primary/30'}`}
              >
                <div>
                  <p className="font-bold text-foreground">{at.nome}</p>
                  <p className="text-xs text-muted-foreground">{at.descricao} • {at.tipo === 'por_aluno' ? 'Por Aluno' : 'Por Equipe'}</p>
                </div>
                <span className={`font-display font-bold text-lg ${at.xp < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {at.xp > 0 ? '+' : ''}{at.xp}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Selection */}
      {salaId && atividade && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display font-bold text-foreground">
            3. {atividade.tipo === 'por_aluno' ? 'Marque os Alunos' : 'Selecione as Equipes'}
          </h2>

          {atividade.tipo === 'por_aluno' ? (
            <div className="space-y-3">
              {equipesFiltered.map(equipe => {
                const membros = alunosFiltered.filter(a => a.equipeId === equipe.id);
                const todosSelected = membros.every(m => selectedAlunos.includes(m.id));
                return (
                  <div key={equipe.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-foreground">{equipe.nome}</span>
                      <button
                        onClick={() => {
                          if (todosSelected) {
                            setSelectedAlunos(prev => prev.filter(id => !membros.find(m => m.id === id)));
                          } else {
                            setSelectedAlunos(prev => [...new Set([...prev, ...membros.map(m => m.id)])]);
                          }
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {todosSelected ? 'Desmarcar todos' : 'Marcar todos'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {membros.map(aluno => (
                        <label
                          key={aluno.id}
                          className={`flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors ${selectedAlunos.includes(aluno.id) ? 'bg-primary/15 text-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAlunos.includes(aluno.id)}
                            onChange={() => toggleAluno(aluno.id)}
                            className="accent-primary"
                          />
                          <span className="text-sm">{aluno.nome}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{aluno.classe}</span>
                        </label>
                      ))}
                    </div>
                    {todosSelected && membros.length > 0 && (
                      <div className="mt-2 text-xs text-level-6 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Bônus "Todos entregaram" (+10 XP) será aplicado!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {equipesFiltered.map(equipe => (
                <button
                  key={equipe.id}
                  onClick={() => toggleEquipe(equipe.id)}
                  className={`rounded-lg border p-3 text-left transition-all ${selectedEquipes.includes(equipe.id) ? 'border-primary bg-primary/10 glow-primary' : 'border-border bg-secondary hover:border-primary/30'}`}
                >
                  <div className="flex items-center gap-2">
                    {selectedEquipes.includes(equipe.id) && <Check className="w-4 h-4 text-primary" />}
                    <span className="font-bold text-foreground">{equipe.nome}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{equipe.xpTotal} XP</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Launch Button */}
      {salaId && atividade && (
        <button
          onClick={handleLancar}
          disabled={launched || (atividade.tipo === 'por_aluno' ? selectedAlunos.length === 0 : selectedEquipes.length === 0)}
          className={`w-full rounded-xl py-4 font-display font-bold text-lg transition-all ${launched
            ? 'bg-primary/30 text-primary animate-xp-gain glow-strong'
            : 'bg-primary text-primary-foreground hover:glow-strong disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
        >
          {launched ? '✅ XP Lançado!' : `⚡ Lançar ${atividade.xp < 0 ? '' : '+'}${atividade.tipo === 'por_aluno' ? selectedAlunos.length * atividade.xp : selectedEquipes.length * atividade.xp} XP`}
        </button>
      )}
    </div>
  );
}
