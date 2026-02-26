import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSalas, useAlunos, useEquipes, useLancamentos, useLancamentoAlunos, calcAlunoXP } from '@/hooks/useSupabaseData';
import { useSalaContext } from '@/hooks/useSalaContext';
import { supabase } from '@/integrations/supabase/client';
import { CLASSES_INFO } from '@/types/game';
import { Users, Plus, Shield, Upload, Download, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export default function Alunos() {
  const { user } = useAuth();
  const { activeSalaId } = useSalaContext();
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

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEquipeId, setEditEquipeId] = useState('');
  const [editClasse, setEditClasse] = useState('');

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

  const startEdit = (aluno: any) => {
    setEditingId(aluno.id);
    setEditNome(aluno.nome);
    setEditEquipeId(aluno.equipe_id || '');
    setEditClasse(aluno.classe);
  };

  const handleEdit = async () => {
    if (!editingId || !editNome) return;
    const { error } = await supabase.from('alunos').update({
      nome: editNome, equipe_id: editEquipeId || null, classe: editClasse
    }).eq('id', editingId);
    if (error) { toast.error(error.message); return; }
    toast.success('Aluno atualizado!');
    setEditingId(null);
    qc.invalidateQueries({ queryKey: ['alunos'] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('alunos').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Aluno excluído!');
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
        user_id: user.id, nome: parts[0], sala_id: activeSalaId, equipe_id: null,
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

  const handleDownloadTemplate = () => {
    const csv = 'nome,classe\nJoão Silva,Pesquisador\nMaria Souza,Comunicador\nPedro Lima,Engenheiro';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'modelo_alunos.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <Users className="w-6 h-6" /> Alunos
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 rounded-lg bg-secondary text-foreground px-4 py-2 text-sm font-bold hover:bg-secondary/80 transition-colors border border-border">
            <Download className="w-4 h-4" /> Modelo CSV
          </button>
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
                <th className="text-center px-4 py-3 font-display font-bold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {allAlunos.map((aluno: any) => {
                const equipe = equipes.find((e: any) => e.id === aluno.equipe_id);
                const xpInd = calcAlunoXP(aluno.id, lancamentos, lancAlunos);
                const classeInfo = CLASSES_INFO[aluno.classe as keyof typeof CLASSES_INFO];
                const isEditing = editingId === aluno.id;

                if (isEditing) {
                  return (
                    <tr key={aluno.id} className="border-b border-border/50 bg-secondary/30">
                      <td className="px-4 py-2">
                        <input value={editNome} onChange={e => setEditNome(e.target.value)}
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground" />
                      </td>
                      <td className="px-4 py-2">
                        <select value={editEquipeId} onChange={e => setEditEquipeId(e.target.value)}
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground">
                          <option value="">Sem equipe</option>
                          {equipes.map((eq: any) => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select value={editClasse} onChange={e => setEditClasse(e.target.value)}
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground">
                          <option value="Pesquisador">Pesquisador</option>
                          <option value="Comunicador">Comunicador</option>
                          <option value="Engenheiro">Engenheiro</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 text-center font-mono font-bold text-primary">{xpInd}</td>
                      <td className="px-4 py-2" />
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={handleEdit} className="p-1 rounded hover:bg-primary/15 text-primary"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-destructive/15 text-muted-foreground"><X className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                }

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
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => startEdit(aluno)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir aluno</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir <strong>{aluno.nome}</strong>? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(aluno.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
