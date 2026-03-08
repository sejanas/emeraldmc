import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Plus, Trash2, Save, RefreshCw, AlertTriangle, Camera, User, Mail, Phone, Briefcase } from "lucide-react";
import * as authApi from "@/lib/auth";
import PhoneInputField from "@/components/PhoneInputField";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import ImageUpload from "@/components/ImageUpload";

function useCooldown(declinedAt: string | null | undefined) {
  const COOLDOWN_MS = 5 * 60 * 1000;
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!declinedAt) { setRemaining(0); return; }
    const tick = () => {
      const elapsed = Date.now() - new Date(declinedAt).getTime();
      setRemaining(Math.max(0, COOLDOWN_MS - elapsed));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [declinedAt]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.ceil((remaining % 60000) / 1000);
  return { remaining, label: remaining > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : null };
}

interface FieldErrors {
  name?: string;
  emails?: string[];
  phones?: string[];
}

const AdminProfile = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [resubmitting, setResubmitting] = useState(false);

  const [name, setName] = useState("");
  const [clinicRole, setClinicRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phones, setPhones] = useState<string[]>([""]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [profileStatus, setProfileStatus] = useState<string>("");
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  const [declinedAt, setDeclinedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const primaryEmail = user?.email ?? "";

  const { remaining: cooldownRemaining, label: cooldownLabel } = useCooldown(declinedAt);

  const fetchProfile = useCallback(async () => {
    setFetchLoading(true);
    try {
      const res = await authApi.getProfile() as any;
      const p = res.profile;
      setName(p.name ?? "");
      setClinicRole(p.clinic_role ?? "");
      setAvatarUrl(p.avatar_url ?? "");
      setProfileStatus(p.status ?? "");
      setDeclineReason(p.decline_reason ?? null);
      setDeclinedAt(p.declined_at ?? null);
      setPhones((res.phones ?? []).map((ph: any) => ph.phone).filter(Boolean));
      setEmails((res.emails ?? []).map((e: any) => e.email).filter(Boolean));
    } catch (err: any) {
      toast({ title: "Failed to load profile", description: err.message, variant: "destructive" });
    } finally {
      setFetchLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Inline validation
  const validate = useCallback((): FieldErrors => {
    const errs: FieldErrors = {};
    if (!name.trim()) errs.name = "Name is required";
    const emailErrs = emails.map((e, i) => {
      if (i === 0 && !e.trim()) return "Required";
      if (e.trim() && !isValidEmail(e)) return "Invalid email";
      return "";
    });
    if (emailErrs.some(Boolean)) errs.emails = emailErrs;
    const phoneErrs = phones.map((p) => {
      if (p.trim() && !isValidPhone(p)) return "Invalid phone";
      return "";
    });
    if (phoneErrs.some(Boolean)) errs.phones = phoneErrs;
    return errs;
  }, [name, emails, phones]);

  const currentErrors = useMemo(() => validate(), [validate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, emails: true, phones: true });
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast({ title: "Please fix the errors below", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const validEmails = emails.filter((e) => e.trim());
      const validPhones = phones.filter((p) => p.trim());
      await api.put("/auth/profile", {
        name: name.trim(),
        clinic_role: clinicRole.trim(),
        phones: validPhones,
        emails: validEmails,
        avatar_url: avatarUrl,
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
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-foreground mb-1">My Profile</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your personal information and contact details.</p>

      {/* Status Banners */}
      {profileStatus === "declined" && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Account Application Declined</p>
              {declineReason && (
                <p className="text-sm text-muted-foreground mt-1">
                  Reason: <span className="italic">{declineReason}</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Update your details and resubmit{cooldownLabel ? ` in ${cooldownLabel}` : ""}.
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
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3">
          <p className="text-sm text-muted-foreground">
            Your account is <strong className="text-foreground">pending approval</strong>. You can still update your details.
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        {/* Avatar & Basic Info Section */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Personal Information</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <ImageUpload
                value=""
                onChange={(url) => setAvatarUrl(url)}
                folder="avatars"
              />
              {avatarUrl && (
                <Button type="button" variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => setAvatarUrl("")}>
                  Remove photo
                </Button>
              )}
            </div>

            {/* Name & Role */}
            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setTouched((t) => ({ ...t, name: true })); }}
                  className={`mt-1 ${touched.name && currentErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  required
                />
                {touched.name && currentErrors.name && (
                  <p className="text-xs text-destructive mt-1">{currentErrors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clinic_role">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Clinic Role
                  </span>
                </Label>
                <Input
                  id="clinic_role"
                  value={clinicRole}
                  onChange={(e) => setClinicRole(e.target.value)}
                  placeholder="e.g. Nurse, Lab Incharge, Receptionist"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Primary Email (read-only) */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Login Email</h2>
          </div>
          <div>
            <Label>Primary Email (cannot be changed)</Label>
            <Input
              value={primaryEmail}
              disabled
              className="mt-1 bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">This is your login email and cannot be edited here.</p>
          </div>
        </div>

        {/* Contact Emails */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contact Emails</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Additional email addresses for notifications and communication.</p>
          {emails.map((email, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <div className="flex-1">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { updateEmail(i, e.target.value); setTouched((t) => ({ ...t, emails: true })); }}
                  placeholder={`Email ${i + 1}`}
                  required={i === 0}
                  className={touched.emails && currentErrors.emails?.[i] ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {touched.emails && currentErrors.emails?.[i] && (
                  <p className="text-xs text-destructive mt-0.5">{currentErrors.emails[i]}</p>
                )}
              </div>
              {emails.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeEmail(i)} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addEmail} className="mt-1">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Email
          </Button>
        </div>

        {/* Phone Numbers */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Phone Numbers</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Phone numbers for contact and notifications.</p>
          {phones.map((phone, i) => (
            <div key={i} className="flex gap-2 mb-2 items-start">
              <div className="flex-1">
                <PhoneInputField
                  value={phone}
                  onChange={(v) => { updatePhone(i, v); setTouched((t) => ({ ...t, phones: true })); }}
                />
                {touched.phones && currentErrors.phones?.[i] && (
                  <p className="text-xs text-destructive mt-0.5">{currentErrors.phones[i]}</p>
                )}
              </div>
              {phones.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removePhone(i)} className="shrink-0 mt-0.5">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addPhone} className="mt-1">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Phone
          </Button>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default AdminProfile;
