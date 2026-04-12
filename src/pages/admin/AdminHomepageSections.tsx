import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings, useUpdateSetting } from "@/hooks/useSiteSettings";
import { Save, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";

export interface HomepageSection {
  key: string;
  label: string;
  visible: boolean;
}

const DEFAULT_SECTIONS: HomepageSection[] = [
  { key: "search", label: "Test Search", visible: true },
  { key: "features", label: "Features", visible: true },
  { key: "health_packages", label: "Health Packages", visible: true },
  { key: "how_it_works", label: "How It Works", visible: true },
  { key: "stats", label: "Statistics", visible: true },
  { key: "certifications", label: "Certifications", visible: true },
  { key: "popular_tests", label: "Popular Tests", visible: true },
  { key: "doctors", label: "Our Doctors", visible: true },
  { key: "testimonials", label: "Testimonials", visible: true },
  { key: "service_areas", label: "Service Areas", visible: true },
  { key: "faqs", label: "FAQs", visible: true },
  { key: "cta", label: "Call to Action", visible: true },
];

const AdminHomepageSections = () => {
  const { isAdmin, isBookingManager } = useAuth();
  const { toast } = useToast();
  const updateSetting = useUpdateSetting();
  const { data: allSettings, isLoading } = useSiteSettings();

  const [sections, setSections] = useState<HomepageSection[]>(DEFAULT_SECTIONS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!allSettings || !Array.isArray(allSettings)) return;
    const saved = allSettings.find((s: any) => s.key === "homepage_sections")?.value;
    if (saved && Array.isArray(saved)) {
      // Merge saved with defaults to handle new sections added later
      const savedKeys = new Set(saved.map((s: any) => s.key));
      const merged = [
        ...saved.map((s: any) => ({
          key: s.key,
          label: s.label || DEFAULT_SECTIONS.find((d) => d.key === s.key)?.label || s.key,
          visible: s.visible ?? true,
        })),
        ...DEFAULT_SECTIONS.filter((d) => !savedKeys.has(d.key)),
      ];
      setSections(merged);
    }
  }, [allSettings]);

  if (!isAdmin || isBookingManager) return <Navigate to="/admin" replace />;

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  const toggleVisibility = (index: number) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], visible: !newSections[index].visible };
    setSections(newSections);
  };

  const saveSections = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key: "homepage_sections", value: sections });
      toast({ title: "Homepage layout saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Homepage Sections</h1>
          <p className="text-sm text-muted-foreground mt-1">Rearrange and toggle visibility of homepage sections</p>
        </div>
        <Button onClick={saveSections} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Layout"}
        </Button>
      </div>

      <div className="space-y-2">
        {sections.map((section, index) => (
          <div
            key={section.key}
            className={`flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors ${
              section.visible ? "border-border" : "border-border opacity-60"
            }`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveSection(index, "up")}
                disabled={index === 0}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveSection(index, "down")}
                disabled={index === sections.length - 1}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </div>
            <span className="text-sm font-medium text-foreground flex-1">{section.label}</span>
            <div className="flex items-center gap-2">
              {section.visible ? (
                <Eye className="h-4 w-4 text-primary" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                checked={section.visible}
                onCheckedChange={() => toggleVisibility(index)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHomepageSections;
