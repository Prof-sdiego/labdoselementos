import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShopItems, useShopPurchases, useSalas, useEquipes } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Plus, Trash2, Gem, Pencil, Check, X, Package, Gift, Dices } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Loja() {
  const { user } = useAuth();
  const { data: items = [], isLoading } = useShopItems();
  const { data: purchases = [] } = useShopPurchases();
  const { data: salas = [] } = useSalas();
  const { data: equipes = [] } = useEquipes();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'itens' | 'vendidos'>('itens');
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState(10);
  const [estoque, setEstoque] = useState(5);
  const [xpNecessario, setXpNecessario] = useState(0);
  const [selectedSalas, setSelectedSalas] = useState<string[]>([]);
  const [isRoleta, setIsRoleta] = useState(false);
  const [roletaOpcoes, setRoletaOpcoes] = useState<{ nome: string; peso: number }[]>([{ nome: '', peso: 1 }, { nome: '', peso: 1 }]);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editPreco, setEditPreco] = useState(0);
  const [editEstoque, setEditEstoque] = useState(0);
  const [editXpNecessario, setEditXpNecessario] = useState(0);
  const [editSalas, setEditSalas] = useState<string[]>([]);
  const [editIsRoleta, setEditIsRoleta] = useState(false);
  const [editRoletaOpcoes, setEditRoletaOpcoes] = useState<{ nome: string; peso: number }[]>([]);

  // Assign item dialog
  const [assignItemId, setAssignItemId] = useState<string | null>(null);
  const [assignEquipeId, setAssignEquipeId] = useState('');

  const toggleSala = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter(s => s !== id) : [...list, id]);
  };

  const handleAdd = async () => {
    if (!nome || !user) return;
    if (isRoleta) {
      const valid = roletaOpcoes.filter(o => o.nome.trim());
      if (valid.length < 2) { toast.error('A roleta precisa de pelo menos 2 opções'); return; }
    }
    const { error } = await supabase.from('shop_items').insert({
      user_id: user.id, nome, descricao, preco_xp: preco, estoque, xp_necessario: xpNecessario,
      sala_ids: selectedSalas.length > 0 ? selectedSalas : null,
      is_roleta: isRoleta,
      roleta_opcoes: isRoleta ? roletaOpcoes.filter(o => o.nome.trim()) : [],
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success('Item adicionado!');
    setShowForm(false); setNome(''); setDescricao(''); setPreco(10); setEstoque(5); setXpNecessario(0); setSelectedSalas([]);
    setIsRoleta(false); setRoletaOpcoes([{ nome: '', peso: 1 }, { nome: '', peso: 1 }]);
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
    setEditIsRoleta(item.is_roleta || false);
    setEditRoletaOpcoes(item.roleta_opcoes?.length ? item.roleta_opcoes : [{ nome: '', peso: 1 }, { nome: '', peso: 1 }]);
  };

  const handleEditSave = async () => {
    if (!editingId || !editNome.trim()) return;
    if (editIsRoleta) {
      const valid = editRoletaOpcoes.filter(o => o.nome.trim());
      if (valid.length < 2) { toast.error('A roleta precisa de pelo menos 2 opções'); return; }
    }
    const { error } = await supabase.from('shop_items').update({
      nome: editNome.trim(),
      descricao: editDescricao,
      preco_xp: editPreco,
      estoque: editEstoque,
      xp_necessario: editXpNecessario,
      sala_ids: editSalas.length > 0 ? editSalas : null,
      is_roleta: editIsRoleta,
      roleta_opcoes: editIsRoleta ? editRoletaOpcoes.filter(o => o.nome.trim()) : [],
    } as any).eq('id', editingId);
    if (error) { toast.error(error.message); return; }
    toast.success('Item atualizado!');
    setEditingId(null);
    qc.invalidateQueries({ queryKey: ['shop_items'] });
  };

  const handleAssignItem = async () => {
    if (!assignItemId || !assignEquipeId || !user) return;
    const item = items.find((i: any) => i.id === assignItemId);
    if (!item) return;
    if ((item as any).estoque <= 0) { toast.error('Sem estoque'); return; }

    await supabase.from('shop_purchases').insert({
      user_id: user.id, item_id: assignItemId, equipe_id: assignEquipeId, cristais_gasto: 0
    } as any);
    await supabase.from('shop_items').update({ estoque: (item as any).estoque - 1 }).eq('id', assignItemId);
    toast.success('Item atribuído!');
    setAssignItemId(null); setAssignEquipeId('');
    qc.invalidateQueries({ queryKey: ['shop_items'] });
    qc.invalidateQueries({ queryKey: ['shop_purchases'] });
  };

  const handleCiente = async () => {
    const unread = (purchases as any[]).filter((p: any) => !p.ciente);
    if (unread.length === 0) return;
    for (const p of unread) {
      await supabase.from('shop_purchases').update({ ciente: true } as any).eq('id', p.id);
    }
    toast.success('Todos marcados como ciente');
    qc.invalidateQueries({ queryKey: ['shop_purchases'] });
  };

  const getSalaNomes = (salaIds: string[] | null) => {
    if (!salaIds || salaIds.length === 0) return 'Todas as salas';
    return salaIds.map(id => salas.find((s: any) => s.id === id)?.nome || '?').join(', ');
  };

  const RoletaEditor = ({ opcoes, setOpcoes }: { opcoes: { nome: string; peso: number }[]; setOpcoes: (v: { nome: string; peso: number }[]) => void }) => (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground font-bold block">Opções da Roleta</label>
      {opcoes.map((op, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input placeholder={`Opção ${i + 1}`} value={op.nome} onChange={e => {
            const n = [...opcoes]; n[i] = { ...n[i], nome: e.target.value }; setOpcoes(n);
          }} className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
          <div className="w-20">
            <input type="number" min={1} max={10} value={op.peso} onChange={e => {
              const n = [...opcoes]; n[i] = { ...n[i], peso: Math.max(1, +e.target.value) }; setOpcoes(n);
            }} className="w-full rounded-lg border border-border bg-secondary px-2 py-2 text-sm text-foreground" title="Peso" />
          </div>
          {opcoes.length > 2 && (
            <button onClick={() => setOpcoes(opcoes.filter((_, j) => j !== i))} className="text-destructive/70 hover:text-destructive">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {opcoes.length < 8 && (
        <button onClick={() => setOpcoes([...opcoes, { nome: '', peso: 1 }])} className="text-xs text-primary hover:underline">
          + Adicionar opção
        </button>
      )}
      <p className="text-xs text-muted-foreground">O peso define a probabilidade (oculto para o aluno). Fatias visualmente iguais.</p>
    </div>
  );

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

      {/* Tabs */}
      <div className="flex rounded-lg bg-secondary p-1">
        <button onClick={() => setActiveTab('itens')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-2 ${activeTab === 'itens' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
          <Package className="w-4 h-4" /> Itens
        </button>
        <button onClick={() => setActiveTab('vendidos')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-2 ${activeTab === 'vendidos' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
          <Gift className="w-4 h-4" /> Itens Vendidos
        </button>
      </div>

      {activeTab === 'itens' && (
        <>
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
              
              {/* Roleta toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isRoleta} onChange={e => setIsRoleta(e.target.checked)} className="accent-primary" />
                  <Dices className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground font-bold">Roleta</span>
                </label>
                <span className="text-xs text-muted-foreground">Após a compra, o aluno roda uma roleta</span>
              </div>
              {isRoleta && <RoletaEditor opcoes={roletaOpcoes} setOpcoes={setRoletaOpcoes} />}

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
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editIsRoleta} onChange={e => setEditIsRoleta(e.target.checked)} className="accent-primary" />
                        <Dices className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground font-bold">Roleta</span>
                      </label>
                    </div>
                    {editIsRoleta && <RoletaEditor opcoes={editRoletaOpcoes} setOpcoes={setEditRoletaOpcoes} />}
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
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      {item.nome}
                      {item.is_roleta && <span title="Item com roleta"><Dices className="w-4 h-4 text-primary" /></span>}
                    </h3>
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
                    <button onClick={() => { setAssignItemId(item.id); setAssignEquipeId(''); }} title="Atribuir a equipe" className="text-muted-foreground hover:text-primary">
                      <Gift className="w-4 h-4" />
                    </button>
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

          {/* Assign item dialog */}
          {assignItemId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setAssignItemId(null)}>
              <div className="rounded-xl border border-border bg-card p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-display font-bold text-foreground">Atribuir Item à Equipe</h3>
                <p className="text-sm text-muted-foreground">Selecione a equipe que receberá o item (consome estoque).</p>
                <select value={assignEquipeId} onChange={e => setAssignEquipeId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                  <option value="">Selecione uma equipe</option>
                  {equipes.map((eq: any) => (
                    <option key={eq.id} value={eq.id}>{eq.nome}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={handleAssignItem} disabled={!assignEquipeId}
                    className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-30">
                    Atribuir
                  </button>
                  <button onClick={() => setAssignItemId(null)} className="rounded-lg bg-secondary text-foreground px-4 py-2 text-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'vendidos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total de compras: {purchases.length}</p>
            {(purchases as any[]).some((p: any) => !p.ciente) && (
              <button onClick={handleCiente} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">
                <Check className="w-4 h-4" /> Ciente
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(purchases as any[]).map((p: any) => {
              const item = items.find((i: any) => i.id === p.item_id);
              const equipe = equipes.find((e: any) => e.id === p.equipe_id);
              return (
                <div key={p.id} className={`rounded-xl border p-4 flex items-center justify-between transition-all ${p.ciente ? 'border-border bg-muted/30 opacity-60' : 'border-primary/30 bg-card'}`}>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{item?.nome || 'Item removido'}</h3>
                    <p className="text-xs text-muted-foreground">
                      Equipe: {equipe?.nome || '?'} • {p.cristais_gasto > 0 ? `💎 ${p.cristais_gasto}` : 'Atribuído'}
                      {p.roleta_resultado && ` • 🎰 ${p.roleta_resultado}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(p.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {p.ciente ? (
                    <span className="text-xs text-muted-foreground">✓ Visto</span>
                  ) : (
                    <span className="text-xs text-primary font-bold">Novo</span>
                  )}
                </div>
              );
            })}
            {purchases.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma compra realizada.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
