import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSalas, useEquipes, useAlunos, useLancamentos, useLancamentoEquipes, useLancamentoAlunos, useShopPurchases, calcEquipeXP, calcAlunoXP } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { getNivel } from '@/types/game';
import { LevelBadge, XPProgressBar } from '@/components/game/LevelBadge';
import { FlaskConical, Plus, Users, Key, Copy, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Equipes() {
  const { user } = useAuth();
  const { data: salas = [] } = useSalas();
  const [salaId, setSalaId] = useState('');
  const { data: allEquipes = [] } = useEquipes(salaId || undefined);
  const { data: allAlunos = [] } = useAlunos();
  const { data: lancamentos = [] } = useLancamentos();
  const { data: lancEquipes = [] } = useLancamentoEquipes();
  const { data: lancAlunos = [] } = useLancamentoAlunos();
  const { data: purchases = [] } = useShopPurchases();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [leaderCode, setLeaderCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');

  // Auto-select first sala
  const activeSalaId = salaId || salas[0]?.id || '';
  const equipes = allEquipes.filter((e: any) => e.sala_id === activeSalaId);

  const handleAdd = async () => {
    if (!nome || !user || !activeSalaId) return;
    const code = leaderCode || Math.floor(100000 + Math.random() * 900000).toString();
    const { error } = await supabase.from('equipes').insert({
      user_id: user.id, sala_id: activeSalaId, nome, leader_code: code
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Equipe criada! Código do líder: ${code}`);
    setShowForm(false); setNome(''); setLeaderCode('');
    qc.invalidateQueries({ queryKey: ['equipes'] });
  };

  const handleRename = async (id: string) => {
    if (!editNome.trim()) return;
    const { error } = await supabase.from('equipes').update({ nome: editNome.trim() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Nome atualizado!');
    setEditingId(null);
    qc.invalidateQueries({ queryKey: ['equipes'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <FlaskConical className="w-6 h-6" /> Equipes (Laboratórios)
        </h1>
        <div className="flex items-center gap-3">
          <select value={activeSalaId} onChange={e => setSalaId(e.target.value)} className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm border border-border font-mono">
            {salas.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:glow-primary transition-all">
            <Plus className="w-4 h-4" /> Nova Equipe
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <input placeholder="Nome do laboratório" value={nome} onChange={e => setNome(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1"><Key className="w-3 h-3" /> Código do Líder (6 dígitos) — deixe vazio para gerar automaticamente</label>
            <input placeholder="Ex: 123456" value={leaderCode} onChange={e => setLeaderCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground font-mono mt-1" />
          </div>
          <button onClick={handleAdd} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">Salvar</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {equipes.map((equipe: any) => {
          const membros = allAlunos.filter((a: any) => a.equipe_id === equipe.id);
          const xpTotal = calcEquipeXP(equipe.id, lancamentos, lancEquipes, lancAlunos, allAlunos, purchases);
          return (
            <div key={equipe.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  {editingId === equipe.id ? (
                    <div className="flex items-center gap-1">
                      <input value={editNome} onChange={e => setEditNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename(equipe.id)}
                        className="rounded border border-border bg-secondary px-2 py-1 text-sm text-foreground font-bold" autoFocus />
                      <button onClick={() => handleRename(equipe.id)} className="text-primary"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display font-bold text-foreground text-lg">{equipe.nome}</h3>
                      <button onClick={() => { setEditingId(equipe.id); setEditNome(equipe.nome); }} className="text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  <LevelBadge xp={xpTotal} size="sm" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold text-primary">{xpTotal}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
              <XPProgressBar xp={xpTotal} />
              {equipe.leader_code && (
                <div className="flex items-center gap-2 text-xs">
                  <Key className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-muted-foreground">Código: {equipe.leader_code}</span>
                  <button onClick={() => { navigator.clipboard.writeText(equipe.leader_code); toast.success('Código copiado!'); }}>
                    <Copy className="w-3 h-3 text-primary" />
                  </button>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> {membros.length}/6 membros</p>
                <div className="space-y-1.5">
                  {membros.map((a: any) => {
                    const alunoXP = calcAlunoXP(a.id, lancamentos, lancAlunos);
                    return (
                      <div key={a.id} className="flex items-center justify-between text-sm bg-secondary/50 rounded-lg px-3 py-1.5">
                        <span className="text-foreground">{a.nome}</span>
                        <span className="text-xs text-muted-foreground">{a.classe} • {alunoXP} XP</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {equipes.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma equipe nesta sala.</p>}
    </div>
  );
}
