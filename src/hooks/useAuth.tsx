import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, nome: string) => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // On mount, check if user opted out of "remember me" — sign out if so
  useEffect(() => {
    if (!loading && user && localStorage.getItem('remember_me') === 'false') {
      // Session exists but user didn't want to stay logged in — keep for this tab session
      // We handle this by clearing on window close via beforeunload
    }
  }, [loading, user]);

  useEffect(() => {
    const handler = () => {
      if (localStorage.getItem('remember_me') === 'false') {
        // Can't reliably sign out async in beforeunload, but we mark for next load
        localStorage.setItem('should_logout', 'true');
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Check on mount if we should auto-logout
  useEffect(() => {
    if (localStorage.getItem('should_logout') === 'true') {
      localStorage.removeItem('should_logout');
      localStorage.removeItem('remember_me');
      supabase.auth.signOut();
    }
  }, []);

  const signUp = async (email: string, password: string, nome: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nome } }
    });
    if (error) throw error;
    const { data: { user: newUser } } = await supabase.auth.getUser();
    if (newUser) {
      await supabase.rpc('seed_default_atividades', { p_user_id: newUser.id });
    }
  };

  const signIn = async (email: string, password: string, rememberMe?: boolean) => {
    localStorage.setItem('remember_me', rememberMe ? 'true' : 'false');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    localStorage.removeItem('remember_me');
    localStorage.removeItem('should_logout');
    localStorage.removeItem('activeSalaId');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
