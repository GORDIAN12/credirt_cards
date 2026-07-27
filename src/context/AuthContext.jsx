import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, nombre, telegram_chat_id")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("Profile load error:", error.message);
      setProfile(null);
      return;
    }
    setProfile(data);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      loadProfile(data.session?.user?.id).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      loadProfile(next?.user?.id);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password, nombre) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { nombre: (nombre || "").trim() },
      },
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }

  async function updateProfile(patch) {
    if (!session?.user?.id) throw new Error("Debes iniciar sesión.");
    const payload = {
      ...patch,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", session.user.id)
      .select("id, email, nombre, telegram_chat_id")
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
