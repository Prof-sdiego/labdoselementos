import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSalas, useAlunos, useEquipes, useLancamentos, useLancamentoAlunos, calcAlunoXP } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { CLASSES_INFO, getNivel } from '@/types/game';
import { Users, Plus, Shield, Unlock, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Alunos() {
  const { user } = useAuth();
  const { data: salas = [] } = useSalas();
  const [salaId, setSalaId] = useState('');
  const activeSalaId = salaId || salas[0]?.id || '';
  const { data: allAlunos = [] } = useAlunos(activeSalaId || undefined);
  const { data: equipes = [] } = useEquipes(activeSalaId || undefined);
  const { data: lancamentos = [] } = useLancamentos();
  const { data: lancAlunos = [] } = useLancamentoAlunos();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [equipeId, setEquipeId] = useState('');
  const [classe, setClasse] = useState('Pesquisador');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!nome || !user || !activeSalaId) return;
    const { error } = await supabase.from('alunos').insert({
      user_id: user.id, nome, sala_id: activeSalaId, equipe_id: equipeId || null, classe
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Aluno cadastrado!');
    setShowForm(false); setNome('');
    qc.invalidateQueries({ queryKey: ['alunos'] });
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeSalaId) return;
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes('nome');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rows = dataLines.map(line => {
      const parts = line.split(/[,;]/).map(s => s.trim().replace(/^"|"$/g, ''));
      return {
        user_id: user.id,
        nome: parts[0],
        sala_id: activeSalaId,
        equipe_id: null,
        classe: (['Pesquisador', 'Comunicador', 'Engenheiro'].includes(parts[1]) ? parts[1] : 'Pesquisador')
      };
    }).filter(r => r.nome);

    if (rows.length === 0) { toast.error('Nenhum aluno encontrado no CSV'); return; }

    const { error } = await supabase.from('alunos').insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} alunos importados!`);
    qc.invalidateQueries({ queryKey: ['alunos'] });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Users className="w-6 h-6" /> Alunos
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={activeSalaId} onChange={e => setSalaId(e.target.value)} className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-sm border border-border font-mono">
            {salas.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-lg bg-secondary text-foreground px-4 py-2 text-sm font-bold cursor-pointer hover:bg-secondary/80 transition-colors border border-border">
            <Upload className="w-4 h-4" /> Importar CSV
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
          </label>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:glow-primary transition-all">
            <Plus className="w-4 h-4" /> Novo Aluno
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">CSV: coluna 1 = nome, coluna 2 = classe (Pesquisador/Comunicador/Engenheiro). Cabeçalho opcional.</p>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <input placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          <div className="flex gap-3">
            <select value={equipeId} onChange={e => setEquipeId(e.target.value)} className="flex-1 bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border">
              <option value="">Sem equipe</option>
              {equipes.map((eq: any) => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
            </select>
            <select value={classe} onChange={e => setClasse(e.target.value)} className="flex-1 bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border border-border">
              <option value="Pesquisador">Pesquisador</option>
              <option value="Comunicador">Comunicador</option>
              <option value="Engenheiro">Engenheiro</option>
            </select>
          </div>
          <button onClick={handleAdd} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">Salvar</button>
        </div>
      )}

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
              {allAlunos.map((aluno: any) => {
                const equipe = equipes.find((e: any) => e.id === aluno.equipe_id);
                const xpInd = calcAlunoXP(aluno.id, lancamentos, lancAlunos);
                const classeInfo = CLASSES_INFO[aluno.classe as keyof typeof CLASSES_INFO];
                // For poder, we'd need equipe XP - simplified here
                return (
                  <tr key={aluno.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{aluno.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{equipe?.nome || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{aluno.classe}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-primary">{xpInd}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield className="w-3 h-3" /> Nv.{classeInfo?.desbloqueiaNivel || '?'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {allAlunos.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhum aluno nesta sala.</p>}
    </div>
  );
}
