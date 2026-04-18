import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import Logo from "@/assets/Logo";

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "1 uppercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "1 number" },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), label: "1 special character" },
];

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const allRulesPassed = PASSWORD_RULES.every((r) => r.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (!allRulesPassed) {
      toast({ title: "Password does not meet requirements", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // api.ts auto-uses the recovery session token cached from onAuthStateChange
      await api.post("/auth/reset-password", { password });
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      await supabase.auth.signOut();
      navigate("/admin/login");
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to reset password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 card-shadow text-center space-y-4">
          <Logo variant="filled" className="mx-auto h-16 rounded-xl" />
          <h1 className="font-display text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">
            Link not working?{" "}
            <Link to="/admin/forgot-password" className="text-primary hover:underline">
              Request a new one
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-8 card-shadow">
        <div className="text-center">
          <Logo variant="filled" className="mx-auto mb-3 h-12 w-12 rounded-xl" />
          <h1 className="font-display text-2xl font-bold text-foreground">Set New Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account</p>
        </div>

        <div>
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
          />
          {password && (
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map((r) => (
                <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.test(password) ? "text-green-600" : "text-muted-foreground"}`}>
                  <span>{r.test(password) ? "✓" : "○"}</span>
                  {r.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <Label htmlFor="confirm">Confirm Password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="mt-1"
          />
          {confirm && password !== confirm && (
            <p className="mt-1 text-xs text-destructive">Passwords don't match</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading || !allRulesPassed || password !== confirm}>
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
};

export default AdminResetPassword;
