import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEquipes } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Plus, Trash2, Save, Tag, Timer, X, Gem } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Faixa {
  limite: number;
  multiplicador: number;
}

export function useEconomiaConfig() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['economia_config', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('economia_config').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function calcMultiplicador(totalCristais: number, faixas: Faixa[], inflacaoAtiva: boolean): number {
  if (!inflacaoAtiva || !faixas || faixas.length === 0) return 1.0;
  const sorted = [...faixas].sort((a, b) => b.limite - a.limite);
  for (const f of sorted) {
    if (totalCristais >= f.limite) return f.multiplicador;
  }
  return 1.0;
}

export function calcPrecoFinal(precoBase: number, multiplicador: number): number {
  return Math.max(1, Math.ceil(precoBase * multiplicador));
}

export default function Economia() {
  const { user } = useAuth();
  const { data: config, isLoading } = useEconomiaConfig();
  const { data: equipes = [] } = useEquipes();
  const qc = useQueryClient();

  const [inflacaoAtiva, setInflacaoAtiva] = useState(true);
  const [faixas, setFaixas] = useState<Faixa[]>([
    { limite: 0, multiplicador: 1.0 },
    { limite: 200, multiplicador: 1.25 },
    { limite: 400, multiplicador: 1.5 },
    { limite: 600, multiplicador: 2.0 },
  ]);

  // Promoção
  const [promoAtiva, setPromoAtiva] = useState(false);
  const [promoMult, setPromoMult] = useState(0.75);
  const [promoDias, setPromoDias] = useState(3);
  const [promoSemPrazo, setPromoSemPrazo] = useState(false);
  const [promoGlobal, setPromoGlobal] = useState(true);
  const [promoItemIds, setPromoItemIds] = useState<string[]>([]);
  const [promoFim, setPromoFim] = useState<string | null>(null);

  // Shop items for promo selector
  const [shopItems, setShopItems] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      supabase.from('shop_items').select('id, nome').then(({ data }) => {
        if (data) setShopItems(data);
      });
    }
  }, [user]);

  useEffect(() => {
    if (config) {
      setInflacaoAtiva(config.inflacao_ativa);
      const rawFaixas = config.faixas as any;
      if (Array.isArray(rawFaixas) && rawFaixas.length >= 2) {
        setFaixas(rawFaixas);
      }
      setPromoAtiva(config.promocao_ativa);
      setPromoMult(Number(config.promocao_multiplicador) || 0.75);
      setPromoGlobal(config.promocao_global);
      setPromoItemIds(config.promocao_item_ids || []);
      setPromoFim(config.promocao_fim || null);
    }
  }, [config]);

  const totalCristais = (equipes as any[]).reduce((s, e) => s + (e.cristais || 0), 0);
  const multiplicadorAtual = calcMultiplicador(totalCristais, faixas, inflacaoAtiva);

  // Find active faixa
  const faixaAtiva = (() => {
    if (!inflacaoAtiva) return null;
    const sorted = [...faixas].sort((a, b) => b.limite - a.limite);
    for (const f of sorted) {
      if (totalCristais >= f.limite) return f;
    }
    return faixas[0];
  })();

  const handleSave = async () => {
    if (!user) return;
    if (faixas.length < 2) { toast.error('Mínimo de 2 faixas'); return; }
    if (faixas.length > 6) { toast.error('Máximo de 6 faixas'); return; }

    const payload = {
      user_id: user.id,
      inflacao_ativa: inflacaoAtiva,
      faixas: faixas as any,
      promocao_ativa: promoAtiva,
      promocao_multiplicador: promoMult,
      promocao_fim: promoFim,
      promocao_item_ids: promoGlobal ? null : promoItemIds,
      promocao_global: promoGlobal,
    };

    if (config?.id) {
      const { error } = await supabase.from('economia_config').update(payload as any).eq('id', config.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('economia_config').insert(payload as any);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Configuração salva!');
    qc.invalidateQueries({ queryKey: ['economia_config'] });
  };

  const handleAtivarPromo = async () => {
    const fim = promoSemPrazo ? null : new Date(Date.now() + promoDias * 86400000).toISOString();
    setPromoAtiva(true);
    setPromoFim(fim);

    if (!user) return;
    const payload = {
      user_id: user.id,
      inflacao_ativa: inflacaoAtiva,
      faixas: faixas as any,
      promocao_ativa: true,
      promocao_multiplicador: promoMult,
      promocao_fim: fim,
      promocao_item_ids: promoGlobal ? null : promoItemIds,
      promocao_global: promoGlobal,
    };
    if (config?.id) {
      await supabase.from('economia_config').update(payload as any).eq('id', config.id);
    } else {
      await supabase.from('economia_config').insert(payload as any);
    }
    toast.success('Promoção ativada!');
    qc.invalidateQueries({ queryKey: ['economia_config'] });
  };

  const handleEncerrarPromo = async () => {
    setPromoAtiva(false);
    setPromoFim(null);
    if (config?.id) {
      await supabase.from('economia_config').update({ promocao_ativa: false, promocao_fim: null } as any).eq('id', config.id);
    }
    toast.success('Promoção encerrada');
    qc.invalidateQueries({ queryKey: ['economia_config'] });
  };

  const addFaixa = () => {
    if (faixas.length >= 6) return;
    const lastLimite = faixas[faixas.length - 1]?.limite || 0;
    setFaixas([...faixas, { limite: lastLimite + 200, multiplicador: 1.5 }]);
  };

  const removeFaixa = (i: number) => {
    if (faixas.length <= 2) return;
    setFaixas(faixas.filter((_, j) => j !== i));
  };

  const updateFaixa = (i: number, field: 'limite' | 'multiplicador', value: number) => {
    const n = [...faixas];
    n[i] = { ...n[i], [field]: value };
    setFaixas(n);
  };

  // Promo time remaining
  const promoTimeLeft = (() => {
    if (!promoAtiva || !promoFim) return null;
    const diff = new Date(promoFim).getTime() - Date.now();
    if (diff <= 0) return 'Expirada';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `${days}d ${hours}h restantes`;
  })();

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-primary text-glow flex items-center gap-2">
        <TrendingUp className="w-6 h-6" /> Economia
      </h1>

      {/* Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground font-bold uppercase">Total em Circulação</p>
          <p className="text-3xl font-display font-bold text-level-6 flex items-center gap-2 mt-1"><Gem className="w-6 h-6" />{totalCristais}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground font-bold uppercase">Multiplicador Atual</p>
          <p className="text-3xl font-display font-bold text-primary mt-1">{inflacaoAtiva ? `${multiplicadorAtual}x` : '1.0x (desativado)'}</p>
          {faixaAtiva && inflacaoAtiva && <p className="text-xs text-muted-foreground mt-1">Faixa: ≥ {faixaAtiva.limite} cristais</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground font-bold uppercase">Promoção</p>
          <p className="text-xl font-display font-bold mt-1">
            {promoAtiva ? (
              <span className="text-primary">{Math.round((1 - promoMult) * 100)}% OFF</span>
            ) : (
              <span className="text-muted-foreground">Inativa</span>
            )}
          </p>
          {promoAtiva && promoTimeLeft && <p className="text-xs text-muted-foreground mt-1">{promoTimeLeft}</p>}
        </div>
      </div>

      {/* Team balances */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display font-bold text-foreground mb-3">Saldo por Equipe</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(equipes as any[]).map((eq: any) => (
            <div key={eq.id} className="rounded-lg border border-border bg-secondary p-3 text-center">
              <p className="text-sm font-bold text-foreground truncate">{eq.nome}</p>
              <p className="text-lg font-display font-bold text-level-6 flex items-center justify-center gap-1"><Gem className="w-4 h-4" />{eq.cristais || 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Inflation config */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-foreground">Configuração de Inflação</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={inflacaoAtiva} onChange={e => setInflacaoAtiva(e.target.checked)} className="accent-primary" />
            <span className="text-sm font-bold text-foreground">{inflacaoAtiva ? 'Ativa' : 'Desativada'}</span>
          </label>
        </div>

        {inflacaoAtiva && (
          <>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-bold text-muted-foreground">
                <span>Limite (cristais ≥)</span>
                <span>Multiplicador</span>
                <span></span>
              </div>
              {faixas.map((f, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input type="number" value={f.limite} min={0} onChange={e => updateFaixa(i, 'limite', +e.target.value)}
                    className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
                  <input type="number" value={f.multiplicador} min={0.1} step={0.05} onChange={e => updateFaixa(i, 'multiplicador', +e.target.value)}
                    className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
                  <button onClick={() => removeFaixa(i)} disabled={faixas.length <= 2} className="text-destructive/70 hover:text-destructive disabled:opacity-20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {faixas.length < 6 && (
              <button onClick={addFaixa} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Adicionar faixa
              </button>
            )}
          </>
        )}

        <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">
          <Save className="w-4 h-4" /> Salvar Configuração
        </button>
      </div>

      {/* Promotion control */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2"><Tag className="w-5 h-5" /> Controle de Promoção</h3>

        {promoAtiva ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
              <p className="text-sm font-bold text-primary">🔥 Promoção ativa — {Math.round((1 - promoMult) * 100)}% OFF</p>
              {promoTimeLeft && <p className="text-xs text-muted-foreground mt-1"><Timer className="w-3 h-3 inline" /> {promoTimeLeft}</p>}
              {!promoGlobal && promoItemIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Itens: {promoItemIds.map(id => shopItems.find(i => i.id === id)?.nome || '?').join(', ')}
                </p>
              )}
            </div>
            <button onClick={handleEncerrarPromo} className="flex items-center gap-2 rounded-lg bg-destructive text-destructive-foreground px-4 py-2 text-sm font-bold">
              <X className="w-4 h-4" /> Encerrar Promoção
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Multiplicador da promoção</label>
                <input type="number" value={promoMult} min={0.1} max={1} step={0.05} onChange={e => setPromoMult(+e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
                <p className="text-xs text-muted-foreground mt-1">{Math.round((1 - promoMult) * 100)}% de desconto sobre preço base</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Duração (dias)</label>
                <input type="number" value={promoDias} min={1} disabled={promoSemPrazo} onChange={e => setPromoDias(+e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground disabled:opacity-40" />
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input type="checkbox" checked={promoSemPrazo} onChange={e => setPromoSemPrazo(e.target.checked)} className="accent-primary" />
                  <span className="text-xs text-muted-foreground">Sem prazo</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Abrangência</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={promoGlobal} onChange={() => setPromoGlobal(true)} className="accent-primary" />
                  <span className="text-sm text-foreground">Todos os itens</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={!promoGlobal} onChange={() => setPromoGlobal(false)} className="accent-primary" />
                  <span className="text-sm text-foreground">Itens específicos</span>
                </label>
              </div>
            </div>

            {!promoGlobal && (
              <div className="flex flex-wrap gap-2">
                {shopItems.map(item => (
                  <button key={item.id} onClick={() => {
                    setPromoItemIds(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]);
                  }}
                    className={`text-xs rounded-full px-3 py-1 border transition-colors ${promoItemIds.includes(item.id) ? 'border-primary bg-primary/15 text-primary font-bold' : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'}`}>
                    {item.nome}
                  </button>
                ))}
              </div>
            )}

            <button onClick={handleAtivarPromo} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">
              <Tag className="w-4 h-4" /> Ativar Promoção
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
