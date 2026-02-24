import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getNivel, getProgressoNivel } from '@/types/game';
import { LevelBadge, XPProgressBar } from '@/components/game/LevelBadge';
import { Atom, Users, ShoppingCart, AlertTriangle, LogOut, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function LeaderDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'equipe' | 'loja' | 'ocorrencias'>('equipe');
  const [session, setSession] = useState<any>(null);
  const [shopData, setShopData] = useState<any>({ items: [], purchases: [] });
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [novaOcorrencia, setNovaOcorrencia] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('leader_session');
    if (!stored) { navigate('/lider-login'); return; }
    setSession(JSON.parse(stored));
  }, []);

  const refresh = async () => {
    if (!session) return;
    const { data } = await supabase.functions.invoke('leader-api', {
      body: { action: 'login', code: session.code }
    });
    if (data && !data.error) {
      const newSession = { ...session, equipe: data.equipe, membros: data.membros, sala: data.sala };
      setSession(newSession);
      localStorage.setItem('leader_session', JSON.stringify(newSession));
    }
  };

  const loadShop = async () => {
    if (!session) return;
    const { data } = await supabase.functions.invoke('leader-api', {
      body: { action: 'get_shop', code: session.code }
    });
    if (data) setShopData(data);
  };

  const loadOcorrencias = async () => {
    if (!session) return;
    const { data } = await supabase.functions.invoke('leader-api', {
      body: { action: 'get_ocorrencias', code: session.code }
    });
    if (data?.ocorrencias) setOcorrencias(data.ocorrencias);
  };

  useEffect(() => {
    if (tab === 'loja') loadShop();
    if (tab === 'ocorrencias') loadOcorrencias();
  }, [tab, session]);

  const handlePurchase = async (itemId: string, itemNome: string, preco: number) => {
    if (session.equipe.xp_total < preco) {
      toast.error('XP insuficiente!'); return;
    }
    setLoading(true);
    const { data } = await supabase.functions.invoke('leader-api', {
      body: { action: 'purchase', code: session.code, item_id: itemId }
    });
    if (data?.error) toast.error(data.error);
    else { toast.success(`${itemNome} comprado!`); await refresh(); await loadShop(); }
    setLoading(false);
  };

  const handleOcorrencia = async () => {
    if (!novaOcorrencia.trim()) return;
    setLoading(true);
    const { data } = await supabase.functions.invoke('leader-api', {
      body: { action: 'create_ocorrencia', code: session.code, descricao: novaOcorrencia }
    });
    if (data?.error) toast.error(data.error);
    else { toast.success('Ocorrência registrada'); setNovaOcorrencia(''); await loadOcorrencias(); }
    setLoading(false);
  };

  const logout = () => { localStorage.removeItem('leader_session'); navigate('/lider-login'); };

  if (!session) return null;

  const { equipe, membros, sala } = session;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Atom className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-display font-bold text-foreground text-sm">{equipe.nome}</h1>
            <p className="text-xs text-muted-foreground">{sala?.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-display font-bold text-primary">{equipe.xp_total} XP</span>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { key: 'equipe', label: 'Equipe', icon: Users },
          { key: 'loja', label: 'Loja', icon: ShoppingCart },
          { key: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${tab === t.key ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {tab === 'equipe' && (
          <>
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <LevelBadge xp={equipe.xp_total} size="md" />
              <p className="text-3xl font-display font-bold text-primary mt-2">{equipe.xp_total} XP</p>
              <XPProgressBar xp={equipe.xp_total} />
            </div>
            <div className="space-y-2">
              {membros.sort((a: any, b: any) => b.xp_individual - a.xp_individual).map((m: any) => (
                <div key={m.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground text-sm">{m.nome}</span>
                    <span className="text-xs text-muted-foreground ml-2">{m.classe}</span>
                  </div>
                  <span className="font-mono font-bold text-primary text-sm">{m.xp_individual} XP</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'loja' && (
          <>
            <p className="text-sm text-muted-foreground">Saldo disponível: <span className="font-bold text-primary">{equipe.xp_total} XP</span></p>
            <div className="space-y-3">
              {shopData.items?.map((item: any) => (
                <div key={item.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">{item.nome}</h3>
                    <p className="text-xs text-muted-foreground">{item.descricao} • Estoque: {item.estoque}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-primary">{item.preco_xp} XP</span>
                    <button onClick={() => handlePurchase(item.id, item.nome, item.preco_xp)} disabled={loading || equipe.xp_total < item.preco_xp}
                      className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold disabled:opacity-30">
                      Comprar
                    </button>
                  </div>
                </div>
              ))}
              {(!shopData.items || shopData.items.length === 0) && (
                <p className="text-center text-muted-foreground py-8">Nenhum item disponível na loja.</p>
              )}
            </div>
          </>
        )}

        {tab === 'ocorrencias' && (
          <>
            <div className="flex gap-2">
              <input placeholder="Descreva a ocorrência..." value={novaOcorrencia} onChange={e => setNovaOcorrencia(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
              <button onClick={handleOcorrencia} disabled={loading || !novaOcorrencia.trim()}
                className="rounded-lg bg-primary text-primary-foreground px-3 py-2 disabled:opacity-30">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {ocorrencias.map((oc: any) => (
                <div key={oc.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-sm text-foreground">{oc.descricao}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${oc.status === 'resolvida' ? 'bg-primary/15 text-primary' : oc.status === 'em_andamento' ? 'bg-level-6/15 text-level-6' : 'bg-destructive/15 text-destructive'}`}>
                      {oc.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(oc.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
