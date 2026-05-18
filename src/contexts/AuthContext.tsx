import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { clearAllStores } from '@/utils/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: SignUpUserData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface SignUpUserData {
  firstName: string;
  lastName: string;
  birthdate: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: SignUpUserData) => {
    try {
      console.log('[signUp] Attempting to create account for:', email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            birthdate: userData.birthdate,
          },
        },
      });

      if (authError) {
        console.error('[signUp] Auth error:', authError);
        throw authError;
      }
      console.log('[signUp] Account created successfully');

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: email,
            birthdate: userData.birthdate,
          });

        if (profileError && profileError.code !== '23505') {
          throw profileError;
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);

      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else if (error.message?.includes('already registered')) {
        throw new Error('Cette adresse email est déjà utilisée');
      } else if (error.message?.includes('invalid email')) {
        throw new Error('Format d\'email invalide');
      } else if (error.message?.includes('password')) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }
      throw new Error(`Erreur lors de l'inscription: ${error.message || 'Veuillez réessayer'}`);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Email ou mot de passe incorrect');
      }
      throw new Error('Erreur lors de la connexion. Veuillez réessayer.');
    }
  };

  const signOut = async () => {
    try {
      console.log('[signOut] Starting logout process');

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[signOut] Supabase signOut error:', error);
        throw error;
      }

      console.log('[signOut] Supabase signOut successful, clearing stores');
      clearAllStores();

      setUser(null);
      console.log('[signOut] Logout complete');
    } catch (error: any) {
      console.error('[signOut] Error during logout:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
