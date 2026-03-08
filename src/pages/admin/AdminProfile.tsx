import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Plus, Trash2, Save, RefreshCw, AlertTriangle } from "lucide-react";
import * as authApi from "@/lib/auth";

function useCooldown(declinedAt: string | null | undefined) {
  const COOLDOWN_MS = 5 * 60 * 1000;
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!declinedAt) { setRemaining(0); return; }
    const tick = () => {
      const elapsed = Date.now() - new Date(declinedAt).getTime();
      const rem = Math.max(0, COOLDOWN_MS - elapsed);
      setRemaining(rem);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [declinedAt]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.ceil((remaining % 60000) / 1000);
  return { remaining, label: remaining > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : null };
}

const AdminProfile = () => {
  const { toast } = useToast();
  const { profile: authProfile, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [resubmitting, setResubmitting] = useState(false);

  const [name, setName] = useState("");
  const [clinicRole, setClinicRole] = useState("");
  const [phones, setPhones] = useState<string[]>([""]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [profileStatus, setProfileStatus] = useState<string>("");
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  const [declinedAt, setDeclinedAt] = useState<string | null>(null);

  const { remaining: cooldownRemaining, label: cooldownLabel } = useCooldown(declinedAt);

  const fetchProfile = useCallback(async () => {
    setFetchLoading(true);
    try {
      const res = await authApi.getProfile() as any;
      const p = res.profile;
      setName(p.name ?? "");
      setClinicRole(p.clinic_role ?? "");
      setProfileStatus(p.status ?? "");
      setDeclineReason(p.decline_reason ?? null);
      setDeclinedAt(p.declined_at ?? null);
      setPhones((res.phones ?? []).map((ph: any) => ph.phone).filter(Boolean) || [""]);
      setEmails((res.emails ?? []).map((e: any) => e.email).filter(Boolean) || [""]);
    } catch (err: any) {
      toast({ title: "Failed to load profile", description: err.message, variant: "destructive" });
    } finally {
      setFetchLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = emails.filter((e) => e.trim());
    if (!validEmails.length) {
      toast({ title: "At least one email is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.put("/auth/profile", {
        name: name.trim(),
        clinic_role: clinicRole.trim(),
        phones: phones.filter((p) => p.trim()),
        emails: validEmails,
      });
      toast({ title: "Profile updated successfully" });
      fetchProfile();
    } catch (err: any) {
      toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async () => {
    setResubmitting(true);
    try {
      await api.post("/auth/resubmit");
      toast({ title: "Resubmitted for approval", description: "A super admin will review your application." });
      fetchProfile();
    } catch (err: any) {
      toast({ title: "Resubmit failed", description: err.message, variant: "destructive" });
    } finally {
      setResubmitting(false);
    }
  };

  const addPhone = () => setPhones([...phones, ""]);
  const removePhone = (i: number) => setPhones(phones.filter((_, idx) => idx !== i));
  const updatePhone = (i: number, v: string) => { const p = [...phones]; p[i] = v; setPhones(p); };
  const addEmail = () => setEmails([...emails, ""]);
  const removeEmail = (i: number) => setEmails(emails.filter((_, idx) => idx !== i));
  const updateEmail = (i: number, v: string) => { const e = [...emails]; e[i] = v; setEmails(e); };

  if (fetchLoading) {
    return <div className="flex items-center justify-center p-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">My Profile</h1>
      <p className="text-sm text-muted-foreground mb-6">Update your name, contact information, and clinic role.</p>

      {profileStatus === "declined" && (
        <div className="mb-6 rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-orange-800 dark:text-orange-300">Account Application Declined</p>
              {declineReason && (
                <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                  Reason: <span className="italic">{declineReason}</span>
                </p>
              )}
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-2">
                You can update your details below and resubmit for approval
                {cooldownLabel ? ` in ${cooldownLabel}` : ""}.
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                disabled={cooldownRemaining > 0 || resubmitting}
                onClick={handleResubmit}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${resubmitting ? "animate-spin" : ""}`} />
                {cooldownLabel ? `Resubmit in ${cooldownLabel}` : "Resubmit for Approval"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {profileStatus === "pending" && (
        <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Your account is <strong>pending approval</strong>. You can still update your details while awaiting review.
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 rounded-xl border border-border bg-card p-6">
        <div>
          <Label>Full Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
        </div>

        <div>
          <Label>Clinic Role</Label>
          <Input
            value={clinicRole}
            onChange={(e) => setClinicRole(e.target.value)}
            placeholder="e.g. Nurse, Lab Incharge, Receptionist"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="mb-1.5 block">Email Addresses *</Label>
          {emails.map((email, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => updateEmail(i, e.target.value)}
                placeholder={`Email ${i + 1}`}
                required={i === 0}
              />
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
              <Input
                type="tel"
                value={phone}
                onChange={(e) => updatePhone(i, e.target.value)}
                placeholder={`Phone ${i + 1}`}
              />
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

        <Button type="submit" disabled={loading} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default AdminProfile;
