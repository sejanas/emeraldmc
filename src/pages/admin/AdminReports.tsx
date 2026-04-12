import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings, useUpdateSetting } from "@/hooks/useSiteSettings";
import { Save } from "lucide-react";

const AdminReports = () => {
  const { isAdmin, isBookingManager } = useAuth();
  const { toast } = useToast();
  const updateSetting = useUpdateSetting();
  const { data: allSettings, isLoading } = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState({
    portal_url: "https://www.quantahims.com/",
    instructions: "Login with the credentials received over WhatsApp to view and download your reports.",
  });

  useEffect(() => {
    if (!allSettings || !Array.isArray(allSettings)) return;
    const rp = allSettings.find((s: any) => s.key === "report_instructions")?.value ?? {};
    setReports({
      portal_url: rp.portal_url || "https://www.quantahims.com/",
      instructions: rp.instructions || "Login with the credentials received over WhatsApp to view and download your reports.",
    });
  }, [allSettings]);

  if (!isAdmin || isBookingManager) return <Navigate to="/admin" replace />;
  if (isLoading) return <div className="flex items-center justify-center p-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const save = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key: "report_instructions", value: reports });
      toast({ title: "Report settings saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Reports</h1>
        <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}</Button>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <p className="text-sm text-muted-foreground">These instructions are shown on the Reports page when a patient's booking is completed.</p>
        <div>
          <Label>Portal URL</Label>
          <Input value={reports.portal_url} onChange={(e) => setReports({ ...reports, portal_url: e.target.value })} className="mt-1" placeholder="https://www.quantahims.com/" />
        </div>
        <div>
          <Label>Instructions</Label>
          <textarea
            value={reports.instructions}
            onChange={(e) => setReports({ ...reports, instructions: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[100px]"
            placeholder="Instructions shown to patients for downloading reports..."
          />
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
