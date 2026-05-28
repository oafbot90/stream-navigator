
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  const clearAuthState = () => {
    console.log('Clearing auth state');
    setSession(null);
    setUser(null);
    localStorage.removeItem('lastProfileId');
  };

  const isSessionValid = (session: Session | null): boolean => {
    if (!session) return false;
    const now = Math.floor(Date.now() / 1000);
    return session.expires_at ? session.expires_at > now : false;
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Verificar sessão existente PRIMEIRO
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('Error getting session:', error);
            clearAuthState();
          } else if (existingSession && isSessionValid(existingSession)) {
            console.log('Valid existing session found');
            setSession(existingSession);
            setUser(existingSession.user);
          } else {
            console.log('No valid session found');
            clearAuthState();
          }
          setLoading(false);
          setInitialized(true);
        }

        // Configurar o listener DEPOIS
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log('Auth state change:', event, !!currentSession);
            
            if (!mounted) return;

            switch (event) {
              case 'SIGNED_OUT':
                clearAuthState();
                break;
              case 'SIGNED_IN':
              case 'TOKEN_REFRESHED':
                if (currentSession && isSessionValid(currentSession)) {
                  setSession(currentSession);
                  setUser(currentSession.user);
                } else {
                  clearAuthState();
                }
                break;
              case 'INITIAL_SESSION':
                // Já tratamos acima com getSession
                break;
            }
            setLoading(false);
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          clearAuthState();
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Erro ao entrar",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }
      
      console.log('Sign in successful');
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo de volta ao FlixHub',
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign in failed:', error);
      toast({
        title: 'Erro ao entrar',
        description: error.message || 'Falha na autenticação',
        variant: 'destructive',
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting sign up for:', email);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }
      
      // Criar assinatura gratuita inicial
      if (data.user) {
        try {
          await supabase
            .from('subscriptions')
            .insert({
              user_id: data.user.id,
              plano: 'free',
              status: 'ativo'
            });
        } catch (subError) {
          console.error('Error creating initial subscription:', subError);
        }
      }
      
      console.log('Sign up successful');
      toast({
        title: 'Cadastro realizado',
        description: 'Verifique seu email para confirmar seu cadastro.',
      });
      return { error: null };
    } catch (error: any) {
      console.error('Sign up failed:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: error.message || 'Falha no cadastro',
        variant: 'destructive',
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      setLoading(true);
      clearAuthState();
      await supabase.auth.signOut();
      toast({
        title: 'Logout realizado',
        description: 'Até a próxima!',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      signIn, 
      signUp, 
      signOut, 
      loading,
      initialized 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
