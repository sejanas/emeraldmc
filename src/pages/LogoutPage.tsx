import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      // Attempt to sign out, but don't let this hang the UI — use a timeout.
      try {
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("signout-timeout")), 3000)),
        ]);
      } catch (e) {
        // ignore errors/timeouts — proceed to clear client state anyway
      }

      // Force-clear all Supabase-related keys from localStorage to fix stuck sessions
      try {
        Object.keys(localStorage)
          .filter((key) => key.startsWith("sb-"))
          .forEach((key) => localStorage.removeItem(key));
      } catch (e) {
        // localStorage might be blocked in some environments — ignore
      }

      navigate("/", { replace: true });
    };

    doLogout();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Signing out…</p>
      </div>
    </div>
  );
};

export default LogoutPage;
