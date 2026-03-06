import { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Zap, Trophy, Users, GraduationCap, FlaskConical,
  ScrollText, History, Layers, ArrowLeftRight, Monitor, Menu, X, Atom,
  ShoppingCart, AlertTriangle, LogOut, Shield, RefreshCw, Bell, TrendingUp, Shuffle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useSalaContext } from '@/hooks/useSalaContext';
import { useSalas } from '@/hooks/useSupabaseData';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lancar-xp', label: 'Lançar XP', icon: Zap },
  { to: '/sorteio', label: 'Sorteio', icon: Shuffle },
  { to: '/ranking-equipes', label: 'Ranking Equipes', icon: Trophy },
  { to: '/ranking-individual', label: 'Ranking Individual', icon: GraduationCap },
  { to: '/salas', label: 'Salas', icon: Layers },
  { to: '/equipes', label: 'Equipes', icon: FlaskConical },
  { to: '/alunos', label: 'Alunos', icon: Users },
  { to: '/poder-alunos', label: 'Poderes', icon: Shield },
  { to: '/atividades', label: 'Atividades', icon: ScrollText },
  { to: '/historico', label: 'Histórico XP', icon: History },
  { to: '/fases', label: 'Fases', icon: Layers },
  { to: '/transferencias', label: 'Transferências', icon: ArrowLeftRight },
  { to: '/loja', label: 'Loja', icon: ShoppingCart },
  { to: '/economia', label: 'Economia', icon: TrendingUp },
  { to: '/ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
  { to: '/tv', label: 'Modo TV', icon: Monitor },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();
  const { activeSalaId, clearSala } = useSalaContext();
  const { data: salas = [] } = useSalas();
  const currentSala = salas.find((s: any) => s.id === activeSalaId);
  const { data: notifications = [] } = useNotifications();
  const qc = useQueryClient();

  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = (notifications as any[]).filter((n: any) => !n.lida).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    const unread = (notifications as any[]).filter((n: any) => !n.lida);
    if (unread.length === 0) return;
    await supabase.from('notifications').update({ lida: true } as any).in('id', unread.map((n: any) => n.id));
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleBellClick = () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs && unreadCount > 0) {
      markAllRead();
    }
  };

  const handleChangeSala = () => {
    clearSala();
  };

  if (location.pathname === '/tv') return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 glow-primary">
            <Atom className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold text-primary text-glow tracking-wider">LAB DOS</h1>
            <h1 className="text-xs font-display font-bold text-foreground tracking-wider">ELEMENTOS</h1>
          </div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentSala && (
          <div className="px-4 py-2 border-b border-sidebar-border flex items-center justify-between">
            <div className="text-xs">
              <p className="font-bold text-foreground">{currentSala.nome}</p>
              <p className="text-muted-foreground">{currentSala.ano_serie}</p>
            </div>
            <button onClick={handleChangeSala} title="Mudar turma" className="text-muted-foreground hover:text-primary transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active ? "bg-primary/15 text-primary glow-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button onClick={() => signOut()} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-all">
            <LogOut className="w-4 h-4 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 lg:px-6">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          
          {/* Notifications bell */}
          <div className="relative" ref={notifRef}>
            <button onClick={handleBellClick} className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-10 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-lg z-50">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-display font-bold text-foreground text-sm">Notificações</h3>
                </div>
                <div className="divide-y divide-border">
                  {(notifications as any[]).length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-6">Nenhuma notificação</p>
                  )}
                  {(notifications as any[]).slice(0, 20).map((n: any) => (
                    <div key={n.id} className={cn("px-4 py-3 text-sm", !n.lida && "bg-primary/5")}>
                      <p className="text-foreground">{n.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleDateString('pt-BR')} {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
