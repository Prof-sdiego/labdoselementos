import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShopItems, useShopPurchases, useSalas } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Plus, Trash2, Gem, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Loja() {
  const { user } = useAuth();
  const { data: items = [], isLoading } = useShopItems();
  const { data: purchases = [] } = useShopPurchases();
  const { data: salas = [] } = useSalas();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState(10);
  const [estoque, setEstoque] = useState(5);
  const [xpNecessario, setXpNecessario] = useState(0);
  const [selectedSalas, setSelectedSalas] = useState<string[]>([]); // empty = todas

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editPreco, setEditPreco] = useState(0);
  const [editEstoque, setEditEstoque] = useState(0);
  const [editXpNecessario, setEditXpNecessario] = useState(0);
  const [editSalas, setEditSalas] = useState<string[]>([]);

  const toggleSala = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter(s => s !== id) : [...list, id]);
  };

  const handleAdd = async () => {
    if (!nome || !user) return;
    const { error } = await supabase.from('shop_items').insert({
      user_id: user.id, nome, descricao, preco_xp: preco, estoque, xp_necessario: xpNecessario,
      sala_ids: selectedSalas.length > 0 ? selectedSalas : null
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success('Item adicionado!');
    setShowForm(false); setNome(''); setDescricao(''); setPreco(10); setEstoque(5); setXpNecessario(0); setSelectedSalas([]);
    qc.invalidateQueries({ queryKey: ['shop_items'] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('shop_purchases').delete().eq('item_id', id);
    if (error) { toast.error('Erro ao remover compras vinculadas: ' + error.message); return; }
    const { error: err2 } = await supabase.from('shop_items').delete().eq('id', id);
    if (err2) { toast.error(err2.message); return; }
    qc.invalidateQueries({ queryKey: ['shop_items'] });
    qc.invalidateQueries({ queryKey: ['shop_purchases'] });
    toast.success('Item removido');
  };

  const handleToggle = async (id: string, ativo: boolean) => {
    await supabase.from('shop_items').update({ ativo: !ativo }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['shop_items'] });
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditNome(item.nome);
    setEditDescricao(item.descricao || '');
    setEditPreco(item.preco_xp);
    setEditEstoque(item.estoque);
    setEditXpNecessario(item.xp_necessario || 0);
    setEditSalas(item.sala_ids || []);
  };

  const handleEditSave = async () => {
    if (!editingId || !editNome.trim()) return;
    const { error } = await supabase.from('shop_items').update({
      nome: editNome.trim(),
      descricao: editDescricao,
      preco_xp: editPreco,
      estoque: editEstoque,
      xp_necessario: editXpNecessario,
      sala_ids: editSalas.length > 0 ? editSalas : null,
    } as any).eq('id', editingId);
    if (error) { toast.error(error.message); return; }
    toast.success('Item atualizado!');
    setEditingId(null);
    qc.invalidateQueries({ queryKey: ['shop_items'] });
  };

  const getSalaNomes = (salaIds: string[] | null) => {
    if (!salaIds || salaIds.length === 0) return 'Todas as salas';
    return salaIds.map(id => salas.find((s: any) => s.id === id)?.nome || '?').join(', ');
  };

  const SalaSelector = ({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) => (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">Salas (vazio = todas)</label>
      <div className="flex flex-wrap gap-2">
        {salas.map((sala: any) => (
          <button key={sala.id} type="button" onClick={() => onToggle(sala.id)}
            className={`text-xs rounded-full px-3 py-1 border transition-colors ${selected.includes(sala.id) ? 'border-primary bg-primary/15 text-primary font-bold' : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'}`}>
            {sala.nome}
          </button>
        ))}
      </div>
      {selected.length === 0 && <p className="text-xs text-muted-foreground mt-1">📋 Disponível para todas as salas</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" /> Loja
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:glow-primary transition-all">
          <Plus className="w-4 h-4" /> Novo Item
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <input placeholder="Nome do item" value={nome} onChange={e => setNome(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          <input placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Preço (💎 Cristais)</label>
              <input type="number" value={preco} onChange={e => setPreco(+e.target.value)} min={1}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Estoque</label>
              <input type="number" value={estoque} onChange={e => setEstoque(+e.target.value)} min={0}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">XP necessário</label>
              <input type="number" value={xpNecessario} onChange={e => setXpNecessario(+e.target.value)} min={0}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
            </div>
          </div>
          <SalaSelector selected={selectedSalas} onToggle={(id) => toggleSala(id, selectedSalas, setSelectedSalas)} />
          <p className="text-xs text-muted-foreground">XP necessário: mínimo de XP que a equipe precisa ter acumulado para desbloquear este item. 0 = disponível desde o início.</p>
          <button onClick={handleAdd} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">Salvar</button>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item: any) => {
          const vendidos = purchases.filter((p: any) => p.item_id === item.id).length;
          const isEditing = editingId === item.id;

          if (isEditing) {
            return (
              <div key={item.id} className="rounded-xl border border-primary/30 bg-card p-5 space-y-3">
                <input value={editNome} onChange={e => setEditNome(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground font-bold" />
                <input value={editDescricao} onChange={e => setEditDescricao(e.target.value)} placeholder="Descrição"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Preço (💎)</label>
                    <input type="number" value={editPreco} onChange={e => setEditPreco(+e.target.value)} min={1}
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Estoque</label>
                    <input type="number" value={editEstoque} onChange={e => setEditEstoque(+e.target.value)} min={0}
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">XP necessário</label>
                    <input type="number" value={editXpNecessario} onChange={e => setEditXpNecessario(+e.target.value)} min={0}
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
                  </div>
                </div>
                <SalaSelector selected={editSalas} onToggle={(id) => toggleSala(id, editSalas, setEditSalas)} />
                <div className="flex gap-2">
                  <button onClick={handleEditSave} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Salvar
                  </button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg bg-secondary text-foreground px-4 py-2 text-sm flex items-center gap-1">
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className={`rounded-xl border bg-card p-4 flex items-center justify-between ${item.ativo ? 'border-border' : 'border-destructive/30 opacity-60'}`}>
              <div>
                <h3 className="font-bold text-foreground">{item.nome}</h3>
                <p className="text-sm text-muted-foreground">{item.descricao}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vendidos: {vendidos} • Estoque: {item.estoque}
                  {item.xp_necessario > 0 && <span> • XP necessário: {item.xp_necessario}</span>}
                  {' '}• {getSalaNomes(item.sala_ids)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xl font-display font-bold text-level-6 flex items-center gap-1"><Gem className="w-4 h-4" />{item.preco_xp}</span>
                </div>
                <button onClick={() => startEdit(item)} className="text-muted-foreground hover:text-primary">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleToggle(item.id, item.ativo)} className="text-xs text-muted-foreground hover:text-foreground">
                  {item.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-destructive/70 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-8">Nenhum item cadastrado. Adicione itens para a loja.</p>
        )}
      </div>
    </div>
  );
}
