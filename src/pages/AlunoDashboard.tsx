import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getNivel, CLASSES_INFO, ClasseType } from '@/types/game';
import { LevelBadge, XPProgressBar } from '@/components/game/LevelBadge';
import { Atom, Users, ShoppingCart, AlertTriangle, LogOut, Send, Gem, Lock, Shield, Check, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function AlunoDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'equipe' | 'loja' | 'ocorrencias' | 'poderes'>('equipe');
  const [session, setSession] = useState<any>(null);
  const [shopData, setShopData] = useState<any>({ items: [], purchases: [], cristais: 0 });
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [novaOcorrencia, setNovaOcorrencia] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('aluno_session');
    if (!stored) { navigate('/aluno-login'); return; }
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
      localStorage.setItem('aluno_session', JSON.stringify(newSession));
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
    const cristais = shopData.cristais ?? session?.equipe?.cristais ?? 0;
    if (cristais < preco) {
      toast.error('Cristais insuficientes!'); return;
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

  const logout = () => { localStorage.removeItem('aluno_session'); navigate('/aluno-login'); };

  if (!session) return null;

  const { equipe, membros, sala } = session;
  const nivel = getNivel(equipe.xp_total);

  return (
    <div className="min-h-screen bg-background">
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
          <span className="text-sm font-bold text-level-6 flex items-center gap-1"><Gem className="w-4 h-4" />{equipe.cristais ?? 0}</span>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex border-b border-border overflow-x-auto">
        {[
          { key: 'equipe', label: 'Equipe', icon: Users },
          { key: 'poderes', label: 'Poderes', icon: Shield },
          { key: 'loja', label: 'Loja', icon: ShoppingCart },
          { key: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${tab === t.key ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
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
              <p className="text-lg font-bold text-level-6 flex items-center justify-center gap-1 mt-1"><Gem className="w-5 h-5" />{equipe.cristais ?? 0} Cristais</p>
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

        {tab === 'poderes' && (
          <>
            <div className="space-y-4">
              {(['Pesquisador', 'Comunicador', 'Engenheiro'] as ClasseType[]).map(classe => {
                const info = CLASSES_INFO[classe];
                const unlocked = nivel.nivel >= info.desbloqueiaNivel;
                return (
                  <div key={classe} className={`rounded-xl border p-4 ${unlocked ? 'border-primary/30 bg-primary/5' : 'border-border bg-card opacity-70'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {unlocked ? <Shield className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                      <h3 className="font-display font-bold text-foreground">{classe}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${unlocked ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {unlocked ? 'Liberado' : `Nível ${info.desbloqueiaNivel}`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{info.poder}</p>
                  </div>
                );
              })}
            </div>

            <h3 className="font-display font-bold text-foreground mt-6">Status dos membros</h3>
            <div className="space-y-2">
              {membros.map((m: any) => {
                const classeInfo = CLASSES_INFO[m.classe as ClasseType];
                const memberUnlocked = classeInfo && nivel.nivel >= classeInfo.desbloqueiaNivel;
                return (
                  <div key={m.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {memberUnlocked ? (
                        m.poder_usado_nesta_fase
                          ? <XIcon className="w-4 h-4 text-destructive" />
                          : <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-bold text-foreground text-sm">{m.nome}</span>
                      <span className="text-xs text-muted-foreground">{m.classe}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      !memberUnlocked ? 'bg-muted text-muted-foreground'
                        : m.poder_usado_nesta_fase ? 'bg-destructive/15 text-destructive'
                        : 'bg-primary/15 text-primary'
                    }`}>
                      {!memberUnlocked ? 'Bloqueado' : m.poder_usado_nesta_fase ? 'Usado' : 'Disponível'}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'loja' && (
          <>
            <p className="text-sm text-muted-foreground">
              Cristais disponíveis: <span className="font-bold text-level-6">{shopData.cristais ?? equipe.cristais ?? 0} 💎</span>
              {' '}• XP da equipe: <span className="font-bold text-primary">{equipe.xp_total}</span>
            </p>
            <div className="space-y-3">
              {[...(shopData.items || [])].sort((a: any, b: any) => a.preco_xp - b.preco_xp).map((item: any) => {
                const locked = item.xp_necessario > 0 && equipe.xp_total < item.xp_necessario;
                const cristais = shopData.cristais ?? equipe.cristais ?? 0;
                return (
                  <div key={item.id} className={`rounded-xl border bg-card p-4 ${locked ? 'border-muted opacity-60' : 'border-border'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                          {locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                          {item.nome}
                        </h3>
                        <p className="text-xs text-muted-foreground">{item.descricao} • Estoque: {item.estoque}</p>
                        {locked && <p className="text-xs text-destructive mt-1">Necessário {item.xp_necessario} XP para desbloquear</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-level-6 flex items-center gap-1"><Gem className="w-4 h-4" />{item.preco_xp}</span>
                        {!locked && (
                          <button onClick={() => handlePurchase(item.id, item.nome, item.preco_xp)} disabled={loading || cristais < item.preco_xp}
                            className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold disabled:opacity-30">
                            Comprar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
