import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Logo from "@/assets/Logo";

const AdminLogin = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/admin");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-8 card-shadow">
        <div className="text-center">
          <Logo variant="filled" className="mx-auto mb-3 h-16 rounded-xl" />
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Shifa's Mainland Healthcare</p>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Need an account? <Link to="/admin/signup" className="text-primary hover:underline">Sign up</Link>
          </p>
          <Link to="/admin/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="pt-2 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Website
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminLogin;
