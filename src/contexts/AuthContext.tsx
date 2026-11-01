import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit, resetRateLimit, logSecurityEvent, secureStorage } from "@/lib/security";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Refs, not state: activity changes on every scroll / key press / click, and
  // putting it in state re-rendered the whole app (everything that calls
  // useAuth) on each of those events.
  const lastActivityRef = useRef(Date.now());
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const signOut = useCallback(async () => {
    logSecurityEvent({ type: 'login_success', details: { action: 'logout', email: userRef.current?.email } });
    secureStorage.clear();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  // Sign the user out after 30 minutes without interaction
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const markActive = () => {
      lastActivityRef.current = Date.now();
    };
    events.forEach(event => window.addEventListener(event, markActive, { passive: true }));

    const checkTimeout = setInterval(() => {
      if (userRef.current && Date.now() - lastActivityRef.current > SESSION_TIMEOUT) {
        logSecurityEvent({ type: 'suspicious_activity', details: { reason: 'session_timeout' } });
        signOut();
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(checkTimeout);
      events.forEach(event => window.removeEventListener(event, markActive));
    };
  }, [signOut]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        logSecurityEvent({ type: 'login_success', details: { method: 'session_restore' } });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      lastActivityRef.current = Date.now();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    // Rate limiting check
    const rateLimit = checkRateLimit(`signup_${email}`, 3, 300000, 900000); // 3 attempts per 5 min, 15 min block
    if (!rateLimit.allowed) {
      logSecurityEvent({ type: 'rate_limit', details: { action: 'signup', email } });
      return {
        error: new Error(`Too many signup attempts. Please try again in ${rateLimit.blockedFor} seconds.`)
      };
    }

    try {
      logSecurityEvent({ type: 'login_attempt', details: { action: 'signup', email } });

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        logSecurityEvent({ type: 'login_failure', details: { action: 'signup', email, error: error.message } });
        return { error: error as Error };
      }

      resetRateLimit(`signup_${email}`);
      logSecurityEvent({ type: 'login_success', details: { action: 'signup', email } });
      return { error: null };
    } catch (error) {
      logSecurityEvent({ type: 'login_failure', details: { action: 'signup', email, error: String(error) } });
      return { error: error as Error };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Rate limiting check
    const rateLimit = checkRateLimit(`login_${email}`, 5, 300000, 900000); // 5 attempts per 5 min, 15 min block
    if (!rateLimit.allowed) {
      logSecurityEvent({ type: 'rate_limit', details: { action: 'login', email } });
      return {
        error: new Error(`Too many login attempts. Please try again in ${rateLimit.blockedFor} seconds.`)
      };
    }

    try {
      logSecurityEvent({ type: 'login_attempt', details: { action: 'login', email } });

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logSecurityEvent({ type: 'login_failure', details: { action: 'login', email, error: error.message } });
        return { error: error as Error };
      }

      resetRateLimit(`login_${email}`);
      lastActivityRef.current = Date.now();
      logSecurityEvent({ type: 'login_success', details: { action: 'login', email } });
      return { error: null };
    } catch (error) {
      logSecurityEvent({ type: 'login_failure', details: { action: 'login', email, error: String(error) } });
      return { error: error as Error };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      logSecurityEvent({ type: 'login_attempt', details: { action: 'google_login' } });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        logSecurityEvent({ type: 'login_failure', details: { action: 'google_login', error: error.message } });
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      logSecurityEvent({ type: 'login_failure', details: { action: 'google_login', error: String(error) } });
      return { error: error as Error };
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.refreshSession();
    setSession(session);
    setUser(session?.user ?? null);
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, signUp, signIn, signInWithGoogle, signOut, refreshSession }),
    [user, session, loading, signUp, signIn, signInWithGoogle, signOut, refreshSession],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
