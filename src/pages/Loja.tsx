import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShopItems, useShopPurchases, useEquipes } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Loja() {
  const { user } = useAuth();
  const { data: items = [], isLoading } = useShopItems();
  const { data: purchases = [] } = useShopPurchases();
  const { data: equipes = [] } = useEquipes();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState(10);
  const [estoque, setEstoque] = useState(5);

  const handleAdd = async () => {
    if (!nome || !user) return;
    const { error } = await supabase.from('shop_items').insert({
      user_id: user.id, nome, descricao, preco_xp: preco, estoque
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Item adicionado!');
    setShowForm(false); setNome(''); setDescricao(''); setPreco(10); setEstoque(5);
    qc.invalidateQueries({ queryKey: ['shop_items'] });
  };

  const handleDelete = async (id: string) => {
    await supabase.from('shop_items').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['shop_items'] });
    toast.success('Item removido');
  };

  const handleToggle = async (id: string, ativo: boolean) => {
    await supabase.from('shop_items').update({ ativo: !ativo }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['shop_items'] });
  };

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
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Preço (XP)</label>
              <input type="number" value={preco} onChange={e => setPreco(+e.target.value)} min={1}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Estoque</label>
              <input type="number" value={estoque} onChange={e => setEstoque(+e.target.value)} min={0}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
            </div>
          </div>
          <button onClick={handleAdd} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">Salvar</button>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item: any) => {
          const vendidos = purchases.filter((p: any) => p.item_id === item.id).length;
          return (
            <div key={item.id} className={`rounded-xl border bg-card p-4 flex items-center justify-between ${item.ativo ? 'border-border' : 'border-destructive/30 opacity-60'}`}>
              <div>
                <h3 className="font-bold text-foreground">{item.nome}</h3>
                <p className="text-sm text-muted-foreground">{item.descricao}</p>
                <p className="text-xs text-muted-foreground mt-1">Vendidos: {vendidos} • Estoque: {item.estoque}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-display font-bold text-primary">{item.preco_xp} XP</span>
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
