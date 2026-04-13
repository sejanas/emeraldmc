import { useState } from "react";
import { useTheme, THEME_PRESETS } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";

const AdminThemeSettings = () => {
  const { colorPreset, customHsl, setColorPreset, setCustomColor } = useTheme();
  const { profile } = useAuth();
  const { canAccess } = useFeaturePermissions();
  const { toast } = useToast();
  const [customH, setCustomH] = useState(customHsl?.h ?? 200);
  const [customS, setCustomS] = useState(customHsl?.s ?? 60);
  const [customL, setCustomL] = useState(customHsl?.l ?? 45);
  const [saving, setSaving] = useState(false);

  if (!canAccess("theme", profile?.role)) return <Navigate to="/admin" replace />;

  const handlePreset = async (value: string) => {
    setSaving(true);
    await setColorPreset(value);
    setSaving(false);
    toast({ title: "Theme updated", description: "Color theme applied to the entire website." });
  };

  const handleCustom = async () => {
    setSaving(true);
    await setCustomColor(customH, customS, customL);
    setSaving(false);
    toast({ title: "Custom theme applied", description: "Your custom color is now live on the website." });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Website Theme</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a color theme for the entire website. This applies to all visitors.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Color Presets</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {THEME_PRESETS.map((t) => (
            <button
              key={t.value}
              onClick={() => handlePreset(t.value)}
              disabled={saving}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:shadow-md",
                colorPreset === t.value
                  ? "border-primary bg-accent shadow-md"
                  : "border-border bg-card hover:border-muted-foreground/30"
              )}
            >
              <div
                className="h-10 w-10 rounded-full border border-border shadow-sm"
                style={{ background: `hsl(${t.h} ${t.s}% ${t.l}%)` }}
              />
              <span className="text-xs font-medium text-foreground">{t.label}</span>
              {colorPreset === t.value && (
                <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Custom Color</h2>
        <p className="text-sm text-muted-foreground">
          Pick any color by adjusting Hue, Saturation, and Lightness.
        </p>

        <div className="flex flex-wrap items-end gap-6">
          <div
            className="h-16 w-16 rounded-xl border border-border shadow-sm shrink-0"
            style={{ background: `hsl(${customH} ${customS}% ${customL}%)` }}
          />

          <div className="space-y-3 flex-1 min-w-[200px]">
            <div>
              <Label className="text-xs text-muted-foreground">Hue ({customH}°)</Label>
              <Input
                type="range"
                min={0}
                max={359}
                value={customH}
                onChange={(e) => setCustomH(Number(e.target.value))}
                className="h-2 p-0 border-0 cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(0 ${customS}% ${customL}%), hsl(60 ${customS}% ${customL}%), hsl(120 ${customS}% ${customL}%), hsl(180 ${customS}% ${customL}%), hsl(240 ${customS}% ${customL}%), hsl(300 ${customS}% ${customL}%), hsl(359 ${customS}% ${customL}%))`,
                }}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Saturation ({customS}%)</Label>
              <Input
                type="range"
                min={10}
                max={100}
                value={customS}
                onChange={(e) => setCustomS(Number(e.target.value))}
                className="h-2 p-0 border-0 cursor-pointer"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Lightness ({customL}%)</Label>
              <Input
                type="range"
                min={20}
                max={60}
                value={customL}
                onChange={(e) => setCustomL(Number(e.target.value))}
                className="h-2 p-0 border-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleCustom} disabled={saving} size="sm">
          {saving ? "Applying..." : "Apply Custom Color"}
        </Button>

        {colorPreset === "custom" && (
          <p className="text-xs text-primary flex items-center gap-1">
            <Check className="h-3 w-3" /> Custom color is currently active
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminThemeSettings;
