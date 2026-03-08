import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import * as authApi from "@/lib/auth";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  user_id: string;
  name: string;
  clinic_role?: string;
  role: string;
  status: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isBookingManager: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: {
    name: string;
    clinic_role: string;
    phones: string[];
    emails: string[];
    password: string;
  }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await authApi.getProfile();
      setProfile(res.profile);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        await fetchProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(async ({ data: { session: sess } }) => {
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) {
          await fetchProfile();
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);

      const { error } = await supabase.auth.setSession({
        access_token: res.session.access_token,
        refresh_token: res.session.refresh_token,
      });
      if (error) return { error };
      setProfile(res.profile);
      return { error: null };
    } catch (e: any) {
      return { error: new Error(e.message) };
    }
  };

  const signUp = async (data: {
    name: string;
    clinic_role: string;
    phones: string[];
    emails: string[];
    password: string;
  }) => {
    try {
      await authApi.signup(data);
      return { error: null };
    } catch (e: any) {
      return { error: new Error(e.message) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const isAdmin =
    !!profile && ["admin", "super_admin", "booking_manager"].includes(profile.role);
  const isSuperAdmin = profile?.role === "super_admin";
  const isBookingManager = profile?.role === "booking_manager";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isSuperAdmin,
        isBookingManager,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
