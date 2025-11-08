import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  sendVerificationCode: (email: string, type: "signup" | "login") => Promise<{ error: any }>;
  verifyCode: (email: string, code: string, type: "signup" | "login") => Promise<{ verified: boolean; error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
        }
      }
    });
    
    if (!error) {
      navigate("/");
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      navigate("/");
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const sendVerificationCode = async (email: string, type: "signup" | "login") => {
    try {
      const { error } = await supabase.functions.invoke("send-verification-code", {
        body: { email, type },
      });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const verifyCode = async (email: string, code: string, type: "signup" | "login") => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-code", {
        body: { email, code, type },
      });
      
      if (error) {
        return { verified: false, error };
      }
      
      return { verified: data?.verified || false, error: null };
    } catch (error: any) {
      return { verified: false, error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, sendVerificationCode, verifyCode, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
