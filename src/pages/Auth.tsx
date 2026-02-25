import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Atom, GraduationCap, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate, useNavigate } from 'react-router-dom';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'professor' | 'aluno'>('choose');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Atom className="w-8 h-8 text-primary animate-spin" /></div>;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success('Login realizado!');
      } else {
        if (inviteCode !== '1026') {
          toast.error('Código convite inválido');
          setSubmitting(false);
          return;
        }
        await signUp(email, password, nome);
        toast.success('Conta criada com sucesso!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao autenticar');
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 glow-primary mx-auto mb-4">
            <Atom className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-primary text-glow tracking-wider">LAB DOS ELEMENTOS</h1>
          <p className="text-sm text-muted-foreground">Selecione seu perfil para continuar</p>

          <div className="space-y-3 pt-4">
            <button onClick={() => setMode('professor')}
              className="w-full rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/15 group-hover:glow-primary transition-all">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="font-display font-bold text-foreground">Sou Professor</h2>
                <p className="text-xs text-muted-foreground">Painel de gerenciamento completo</p>
              </div>
            </button>

            <button onClick={() => navigate('/aluno-login')}
              className="w-full rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/15 group-hover:glow-primary transition-all">
                <FlaskConical className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="font-display font-bold text-foreground">Sou Aluno</h2>
                <p className="text-xs text-muted-foreground">Veja sua equipe, loja e ocorrências</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 glow-primary mx-auto mb-4">
            <Atom className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-primary text-glow tracking-wider">LAB DOS ELEMENTOS</h1>
          <p className="text-sm text-muted-foreground mt-1">Painel do Professor</p>
        </div>

        <div className="flex rounded-lg bg-secondary p-1">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${isLogin ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Entrar</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${!isLogin ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Criar Conta</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} required
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
              <input type="text" placeholder="Código convite" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
            </>
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          <button type="submit" disabled={submitting}
            className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-bold text-sm hover:glow-primary transition-all disabled:opacity-50">
            {submitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <button onClick={() => setMode('choose')} className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors">
          ← Voltar
        </button>
      </div>
    </div>
  );
}
