import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings, useUpdateSetting } from "@/hooks/useSiteSettings";
import { Save } from "lucide-react";

const AdminStatistics = () => {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const updateSetting = useUpdateSetting();
  const { data: allSettings, isLoading } = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    tests_completed: 0, happy_patients: 0, diagnostic_tests: 0, years_experience: 0,
  });

  useEffect(() => {
    if (!allSettings || !Array.isArray(allSettings)) return;
    const st = allSettings.find((s: any) => s.key === "stats")?.value ?? {};
    setStats({
      tests_completed: st.tests_completed ?? 0,
      happy_patients: st.happy_patients ?? 0,
      diagnostic_tests: st.diagnostic_tests ?? 0,
      years_experience: st.years_experience ?? 0,
    });
  }, [allSettings]);

  if (!isSuperAdmin) return <Navigate to="/admin" replace />;
  if (isLoading) return <div className="flex items-center justify-center p-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const save = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key: "stats", value: stats });
      toast({ title: "Statistics saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Statistics</h1>
        <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}</Button>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <p className="text-sm text-muted-foreground">Configure the numbers shown in the homepage statistics section. Set to 0 to hide a stat.</p>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Tests Completed</Label><Input type="number" value={stats.tests_completed} onChange={(e) => setStats({ ...stats, tests_completed: +e.target.value })} className="mt-1" /></div>
          <div><Label>Happy Patients</Label><Input type="number" value={stats.happy_patients} onChange={(e) => setStats({ ...stats, happy_patients: +e.target.value })} className="mt-1" /></div>
          <div><Label>Diagnostic Tests</Label><Input type="number" value={stats.diagnostic_tests} onChange={(e) => setStats({ ...stats, diagnostic_tests: +e.target.value })} className="mt-1" /></div>
          <div><Label>Years Experience</Label><Input type="number" value={stats.years_experience} onChange={(e) => setStats({ ...stats, years_experience: +e.target.value })} className="mt-1" /></div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;
