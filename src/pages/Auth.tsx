import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Atom } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
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
        await signUp(email, password, nome);
        toast.success('Conta criada com sucesso!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao autenticar');
    } finally {
      setSubmitting(false);
    }
  };

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
            <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} required
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
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
      </div>
    </div>
  );
}
