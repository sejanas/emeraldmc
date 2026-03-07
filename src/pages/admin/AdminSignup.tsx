import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, CheckCircle } from "lucide-react";

const AdminSignup = () => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    clinic_role: "",
    password: "",
    confirmPassword: "",
  });
  const [phones, setPhones] = useState([""]);
  const [emails, setEmails] = useState([""]);

  const addPhone = () => setPhones([...phones, ""]);
  const addEmail = () => setEmails([...emails, ""]);
  const removePhone = (i: number) => setPhones(phones.filter((_, idx) => idx !== i));
  const removeEmail = (i: number) => setEmails(emails.filter((_, idx) => idx !== i));
  const updatePhone = (i: number, v: string) => { const p = [...phones]; p[i] = v; setPhones(p); };
  const updateEmail = (i: number, v: string) => { const e = [...emails]; e[i] = v; setEmails(e); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    const validEmails = emails.filter((e) => e.trim());
    if (!validEmails.length) {
      toast({ title: "At least one email is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await signUp({
      name: form.name,
      clinic_role: form.clinic_role,
      phones: phones.filter((p) => p.trim()),
      emails: validEmails,
      password: form.password,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 card-shadow text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Account Created</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your account is pending approval. A Super Admin will review and activate your account.</p>
          <Button asChild className="mt-6"><Link to="/admin/login">Go to Login</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-8 card-shadow">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">E</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Signup</h1>
          <p className="mt-1 text-sm text-muted-foreground">Request access to the admin panel</p>
        </div>

        <div>
          <Label>Full Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
        </div>

        <div>
          <Label>Clinic Role</Label>
          <Input value={form.clinic_role} onChange={(e) => setForm({ ...form, clinic_role: e.target.value })}
            placeholder="Your role in the clinic (e.g. Nurse, Lab Incharge, Cameraman, Receptionist)" className="mt-1" />
        </div>

        <div>
          <Label className="mb-1.5 block">Email Addresses *</Label>
          {emails.map((email, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input type="email" value={email} onChange={(e) => updateEmail(i, e.target.value)}
                placeholder={`Email ${i + 1}`} required={i === 0} />
              {emails.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeEmail(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addEmail}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Email
          </Button>
        </div>

        <div>
          <Label className="mb-1.5 block">Phone Numbers</Label>
          {phones.map((phone, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input type="tel" value={phone} onChange={(e) => updatePhone(i, e.target.value)}
                placeholder={`Phone ${i + 1}`} />
              {phones.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removePhone(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addPhone}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Phone
          </Button>
        </div>

        <div>
          <Label>Password *</Label>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="mt-1" minLength={6} />
        </div>
        <div>
          <Label>Confirm Password *</Label>
          <Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required className="mt-1" />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/admin/login" className="text-primary hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default AdminSignup;
