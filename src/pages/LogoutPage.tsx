import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Force-clear all Supabase-related keys from localStorage to fix stuck sessions
      Object.keys(localStorage)
        .filter((key) => key.startsWith("sb-"))
        .forEach((key) => localStorage.removeItem(key));

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
