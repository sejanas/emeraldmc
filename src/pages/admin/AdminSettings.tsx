import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings, useUpdateSetting } from "@/hooks/useSiteSettings";
import { Save, Shield, Globe, Settings2 } from "lucide-react";

const AdminSettings = () => {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const updateSetting = useUpdateSetting();
  const { data: allSettings, isLoading } = useSiteSettings();

  const [saving, setSaving] = useState(false);

  // General settings
  const [general, setGeneral] = useState({ business_name: "", phone: "", email: "", address: "", hours: "" });

  // Security settings
  const [security, setSecurity] = useState({
    timeout_minutes: 30,
    enabled: true,
    exceptions: { booking_manager: true } as Record<string, boolean>,
  });

  // Stats settings
  const [stats, setStats] = useState({
    tests_completed: 0, happy_patients: 0, diagnostic_tests: 0, years_experience: 0,
  });

  // SEO settings
  const [seo, setSeo] = useState({ meta_title: "", meta_description: "", og_image: "" });

  useEffect(() => {
    if (!allSettings || !Array.isArray(allSettings)) return;
    const get = (key: string) => allSettings.find((s: any) => s.key === key)?.value;
    const g = get("general") ?? {};
    setGeneral({ business_name: g.business_name || "", phone: g.phone || "", email: g.email || "", address: g.address || "", hours: g.hours || "" });
    const sec = get("session_config") ?? {};
    setSecurity({ timeout_minutes: sec.timeout_minutes ?? 30, enabled: sec.enabled !== false, exceptions: sec.exceptions ?? { booking_manager: true } });
    const st = get("stats") ?? {};
    setStats({ tests_completed: st.tests_completed ?? 0, happy_patients: st.happy_patients ?? 0, diagnostic_tests: st.diagnostic_tests ?? 0, years_experience: st.years_experience ?? 0 });
    const se = get("seo") ?? {};
    setSeo({ meta_title: se.meta_title || "", meta_description: se.meta_description || "", og_image: se.og_image || "" });
  }, [allSettings]);

  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  const saveSection = async (key: string, value: any) => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key, value });
      toast({ title: "Settings saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center p-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Settings</h1>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general"><Settings2 className="h-4 w-4 mr-1" /> General</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-1" /> Security</TabsTrigger>
          <TabsTrigger value="stats">📊 Statistics</TabsTrigger>
          <TabsTrigger value="seo"><Globe className="h-4 w-4 mr-1" /> SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-foreground">General Settings</h2>
            <p className="text-sm text-muted-foreground">These values are used across the website.</p>
            <div><Label>Business Name</Label><Input value={general.business_name} onChange={(e) => setGeneral({ ...general, business_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Contact Phone</Label><Input value={general.phone} onChange={(e) => setGeneral({ ...general, phone: e.target.value })} className="mt-1" /></div>
            <div><Label>Contact Email</Label><Input value={general.email} onChange={(e) => setGeneral({ ...general, email: e.target.value })} className="mt-1" /></div>
            <div><Label>Address</Label><Input value={general.address} onChange={(e) => setGeneral({ ...general, address: e.target.value })} className="mt-1" /></div>
            <div><Label>Working Hours</Label><Input value={general.hours} onChange={(e) => setGeneral({ ...general, hours: e.target.value })} className="mt-1" /></div>
            <Button onClick={() => saveSection("general", general)} disabled={saving}><Save className="h-4 w-4 mr-2" /> Save</Button>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Session & Security</h2>
            <div className="flex items-center gap-3">
              <Switch checked={security.enabled} onCheckedChange={(v) => setSecurity({ ...security, enabled: v })} />
              <Label>Enable auto-logout on inactivity</Label>
            </div>
            <div><Label>Default Timeout (minutes)</Label><Input type="number" value={security.timeout_minutes} onChange={(e) => setSecurity({ ...security, timeout_minutes: +e.target.value })} className="mt-1 max-w-xs" min={1} /></div>
            <h3 className="font-medium text-foreground pt-2">Role Exceptions</h3>
            <p className="text-sm text-muted-foreground">Roles that should NOT be auto-logged out.</p>
            {["booking_manager", "admin", "super_admin"].map((role) => (
              <div key={role} className="flex items-center gap-3">
                <Switch checked={security.exceptions?.[role] ?? (role === "booking_manager")} onCheckedChange={(v) => setSecurity({ ...security, exceptions: { ...security.exceptions, [role]: v } })} />
                <Label className="capitalize">{role.replace(/_/g, " ")}</Label>
              </div>
            ))}
            <Button onClick={() => saveSection("session_config", security)} disabled={saving}><Save className="h-4 w-4 mr-2" /> Save</Button>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Homepage Statistics</h2>
            <p className="text-sm text-muted-foreground">Configure the numbers shown in the statistics section. Set to 0 to hide a stat.</p>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tests Completed</Label><Input type="number" value={stats.tests_completed} onChange={(e) => setStats({ ...stats, tests_completed: +e.target.value })} className="mt-1" /></div>
              <div><Label>Happy Patients</Label><Input type="number" value={stats.happy_patients} onChange={(e) => setStats({ ...stats, happy_patients: +e.target.value })} className="mt-1" /></div>
              <div><Label>Diagnostic Tests</Label><Input type="number" value={stats.diagnostic_tests} onChange={(e) => setStats({ ...stats, diagnostic_tests: +e.target.value })} className="mt-1" /></div>
              <div><Label>Years Experience</Label><Input type="number" value={stats.years_experience} onChange={(e) => setStats({ ...stats, years_experience: +e.target.value })} className="mt-1" /></div>
            </div>
            <Button onClick={() => saveSection("stats", stats)} disabled={saving}><Save className="h-4 w-4 mr-2" /> Save</Button>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-foreground">SEO Settings</h2>
            <div><Label>Default Meta Title</Label><Input value={seo.meta_title} onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })} className="mt-1" maxLength={60} /></div>
            <div><Label>Default Meta Description</Label><Input value={seo.meta_description} onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })} className="mt-1" maxLength={160} /></div>
            <div><Label>OG Image URL</Label><Input value={seo.og_image} onChange={(e) => setSeo({ ...seo, og_image: e.target.value })} className="mt-1" /></div>
            <Button onClick={() => saveSection("seo", seo)} disabled={saving}><Save className="h-4 w-4 mr-2" /> Save</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
