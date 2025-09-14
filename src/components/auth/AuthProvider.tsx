import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  isSessionValid: boolean;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const { toast } = useToast();

  // Helper function to check if session is valid and not expired
  const checkSessionValidity = (session: Session | null): boolean => {
    if (!session) return false;
    
    const now = Date.now() / 1000;
    const expiresAt = session.expires_at || 0;
    
    return expiresAt > now;
  };

  // Check email verification status
  const checkEmailVerification = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error checking email verification:', error);
        setIsEmailVerified(false);
        return;
      }

      setIsEmailVerified(profile?.email_verified || false);
    } catch (error) {
      console.error('Error in checkEmailVerification:', error);
      setIsEmailVerified(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session ? 'session exists' : 'no session');
        
        const isValid = checkSessionValidity(session);
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsSessionValid(isValid);
        setLoading(false);
        
        // Handle session expiry or invalid session
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (!session || !isValid) {
            // Clear any stale data when signed out or session invalid
            setSession(null);
            setUser(null);
            setIsSessionValid(false);
            setIsEmailVerified(false);
          }
        }
        
        // Auto-logout if session is expired
        if (session && !isValid) {
          console.warn('Session expired, clearing auth state');
          setSession(null);
          setUser(null);
          setIsSessionValid(false);
          setIsEmailVerified(false);
        }
        
        // Check email verification for valid sessions
        if (session && isValid && session.user) {
          setTimeout(() => {
            checkEmailVerification(session.user.id);
          }, 0);
        } else {
          setIsEmailVerified(false);
        }
      }
    );

    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Error getting initial session:', error);
          setSession(null);
          setUser(null);
          setIsSessionValid(false);
        } else {
          const isValid = checkSessionValidity(session);
          setSession(session);
          setUser(session?.user ?? null);
          setIsSessionValid(isValid);
          
          // If session exists but is expired, clear it
          if (session && !isValid) {
            console.warn('Initial session expired, clearing');
            setSession(null);
            setUser(null);
            setIsSessionValid(false);
            setIsEmailVerified(false);
          } else if (session && isValid && session.user) {
            // Check email verification for initial session
            setTimeout(() => {
              checkEmailVerification(session.user.id);
            }, 0);
          }
        }
      } catch (error) {
        console.warn('Failed to initialize auth:', error);
        setSession(null);
        setUser(null);
        setIsSessionValid(false);
        setIsEmailVerified(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      // First create the user account (this will be unconfirmed)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });
      
      if (error) {
        toast({
          title: "Registration failed", 
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      if (data.user) {
        // Send custom verification email
        const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            userId: data.user.id,
            email: data.user.email,
            isResend: false
          }
        });

        if (emailError) {
          console.error('Failed to send verification email:', emailError);
          toast({
            title: "Registration completed", 
            description: "Account created but failed to send verification email. You can request a new one from the login page.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registration successful!", 
            description: "Please check your email to verify your account before signing in.",
          });
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?reset=true`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message,
      });
      throw error;
    }

    toast({
      title: "Password reset email sent!",
      description: "Please check your email for password reset instructions.",
    });
  };

  const logout = async () => {
    try {
      // First clear local state immediately to prevent UI issues
      setSession(null);
      setUser(null);
      setIsSessionValid(false);
      setIsEmailVerified(false);
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Don't throw an error if session doesn't exist - user is already logged out
      if (error && !error.message.includes('session_not_found') && !error.message.includes('Session not found')) {
        console.warn('Logout warning:', error.message);
        // Don't show any toast for minor server issues during logout
        // User is already logged out locally which is what matters
        return;
      }

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      // Even if logout fails, clear the local state
      setSession(null);
      setUser(null);
      setIsSessionValid(false);
      setIsEmailVerified(false);
      
      console.warn('Logout error:', error);
      toast({
        title: "Logged out",
        description: "You have been logged out locally.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, resetPassword, loading, isSessionValid, isEmailVerified }}>
      {children}
    </AuthContext.Provider>
  );
};