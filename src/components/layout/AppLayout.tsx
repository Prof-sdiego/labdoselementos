import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Zap, Trophy, Users, GraduationCap, FlaskConical,
  ScrollText, History, Layers, ArrowLeftRight, Monitor, Menu, X, Atom
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lancar-xp', label: 'Lançar XP', icon: Zap },
  { to: '/ranking-equipes', label: 'Ranking Equipes', icon: Trophy },
  { to: '/ranking-individual', label: 'Ranking Individual', icon: GraduationCap },
  { to: '/salas', label: 'Salas', icon: Layers },
  { to: '/equipes', label: 'Equipes', icon: FlaskConical },
  { to: '/alunos', label: 'Alunos', icon: Users },
  { to: '/atividades', label: 'Atividades', icon: ScrollText },
  { to: '/historico', label: 'Histórico XP', icon: History },
  { to: '/fases', label: 'Fases', icon: Layers },
  { to: '/transferencias', label: 'Transferências', icon: ArrowLeftRight },
  { to: '/tv', label: 'Modo TV', icon: Monitor },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // TV mode has no layout
  if (location.pathname === '/tv') return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
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

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-primary/15 text-primary glow-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 lg:px-6">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
        </header>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
