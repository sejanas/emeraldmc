import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { forgotPassword } from "@/lib/auth";
import loginLogo from "@/assets/logo.png";

const AdminForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 card-shadow text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/admin/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-8 card-shadow">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary p-0.5">
            <img src={loginLogo} alt="Admin" width={48} height={48} className="h-full w-full object-contain" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Forgot Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your email to receive a reset link</p>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
            placeholder="admin@example.com"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        <div className="pt-2 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" asChild>
            <Link to="/admin/login">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminForgotPassword;
