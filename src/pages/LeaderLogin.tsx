import { useState } from 'react';
import { Atom, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function LeaderLogin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (code.length !== 6) { toast.error('O código deve ter 6 dígitos'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('leader-api', {
        body: { action: 'login', code }
      });
      if (error) throw error;
      if (data.error) { toast.error(data.error); return; }
      
      localStorage.setItem('leader_session', JSON.stringify({ code, equipe: data.equipe, membros: data.membros, sala: data.sala }));
      navigate('/lider');
    } catch (err: any) {
      toast.error('Código inválido ou erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 glow-primary mx-auto">
          <Atom className="w-9 h-9 text-primary" />
        </div>
        <h1 className="text-xl font-display font-bold text-primary text-glow">Acesso do Líder</h1>
        <p className="text-sm text-muted-foreground">Digite o código de 6 dígitos da sua equipe</p>

        <div className="flex justify-center gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              value={code[i] || ''}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                const newCode = code.split('');
                newCode[i] = val;
                setCode(newCode.join('').slice(0, 6));
                if (val && i < 5) {
                  const next = e.target.nextElementSibling as HTMLInputElement;
                  next?.focus();
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Backspace' && !code[i] && i > 0) {
                  const prev = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                  prev?.focus();
                }
              }}
              className="w-12 h-14 text-center text-2xl font-mono font-bold rounded-lg border border-border bg-secondary text-foreground focus:border-primary focus:outline-none"
            />
          ))}
        </div>

        <button onClick={handleLogin} disabled={code.length !== 6 || loading}
          className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-bold text-sm hover:glow-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <KeyRound className="w-4 h-4" />
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <a href="/auth" className="text-xs text-muted-foreground hover:text-primary transition-colors">
          Sou professor →
        </a>
      </div>
    </div>
  );
}
