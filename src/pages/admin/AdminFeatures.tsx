import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings, useUpdateSetting } from "@/hooks/useSiteSettings";
import { Save, Pencil } from "lucide-react";
import { icons } from "lucide-react";
import IconSelector from "@/components/IconSelector";

interface FeatureItem {
  icon: string;
  title: string;
  desc: string;
}

const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: "Shield", title: "ISO Certified", desc: "Internationally certified diagnostic laboratory" },
  { icon: "FlaskConical", title: "50+ Tests", desc: "Comprehensive range of diagnostic tests" },
  { icon: "Clock", title: "Same Day Reports", desc: "Quick turnaround on most test results" },
  { icon: "Users", title: "Expert Doctors", desc: "Qualified pathologists and physicians" },
];

const AdminFeatures = () => {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const updateSetting = useUpdateSetting();
  const { data: allSettings, isLoading } = useSiteSettings();

  const [features, setFeatures] = useState<FeatureItem[]>(DEFAULT_FEATURES);
  const [saving, setSaving] = useState(false);
  const [iconPicker, setIconPicker] = useState<{ index: number } | null>(null);

  useEffect(() => {
    if (!allSettings || !Array.isArray(allSettings)) return;
    const saved = allSettings.find((s: any) => s.key === "homepage_features")?.value;
    if (saved && Array.isArray(saved)) setFeatures(saved);
  }, [allSettings]);

  if (!isSuperAdmin) return <Navigate to="/admin" replace />;
  if (isLoading) return (
    <div className="flex items-center justify-center p-12">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  const updateFeature = (index: number, field: keyof FeatureItem, value: string) => {
    setFeatures((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key: "homepage_features", value: features });
      toast({ title: "Features saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Features</h1>
          <p className="text-sm text-muted-foreground mt-1">Edit the 4 feature cards shown on the homepage</p>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature, index) => {
          const FeatureIcon = icons[feature.icon as keyof typeof icons];
          return (
            <div key={index} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIconPicker({ index })}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent hover:bg-primary/10 transition-colors"
                  title="Change icon"
                >
                  {FeatureIcon ? <FeatureIcon className="h-6 w-6 text-primary" /> : <Pencil className="h-6 w-6 text-muted-foreground" />}
                </button>
                <Button variant="ghost" size="sm" onClick={() => setIconPicker({ index })}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Change Icon
                </Button>
              </div>
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={feature.title} onChange={(e) => updateFeature(index, "title", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input value={feature.desc} onChange={(e) => updateFeature(index, "desc", e.target.value)} className="mt-1" />
              </div>
            </div>
          );
        })}
      </div>

      <IconSelector
        open={!!iconPicker}
        onClose={() => setIconPicker(null)}
        onSelect={(name) => {
          if (iconPicker) updateFeature(iconPicker.index, "icon", name);
        }}
        currentIcon={iconPicker ? features[iconPicker.index]?.icon : undefined}
      />
    </div>
  );
};

export default AdminFeatures;
