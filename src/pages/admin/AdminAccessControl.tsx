import { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings, useUpdateSetting } from "@/hooks/useSiteSettings";
import { Save, ShieldCheck } from "lucide-react";
import {
  ADMIN_FEATURES,
  CONFIGURABLE_ROLES,
  DEFAULT_FEATURE_ROLES,
  type ConfigurableRole,
  type FeatureKey,
} from "@/hooks/useFeaturePermissions";

const GROUPS = ["General", "Top", "Catalog", "Content", "Analytics", "System"] as const;
const GROUP_LABELS: Record<string, string> = {
  General: "General",
  Top: "General",
  Catalog: "Catalog",
  Content: "Content",
  Analytics: "Analytics",
  System: "System",
};

const AdminAccessControl = () => {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const updateSetting = useUpdateSetting();
  const { data: allSettings, isLoading } = useSiteSettings();

  const [perms, setPerms] = useState<Record<FeatureKey, ConfigurableRole[]>>(
    () => {
      const init = {} as Record<FeatureKey, ConfigurableRole[]>;
      for (const f of ADMIN_FEATURES) init[f.key] = [...DEFAULT_FEATURE_ROLES[f.key]];
      return init;
    }
  );
  const [saving, setSaving] = useState(false);

  // Track the last-saved state to detect changes
  const savedPerms = useRef<Record<FeatureKey, ConfigurableRole[]> | null>(null);

  useEffect(() => {
    if (!allSettings || !Array.isArray(allSettings)) return;
    const stored = allSettings.find((s: any) => s.key === "feature_permissions")?.value;
    if (stored && typeof stored === "object") {
      const merged = {} as Record<FeatureKey, ConfigurableRole[]>;
      for (const f of ADMIN_FEATURES) {
        merged[f.key] = stored[f.key] ?? [...DEFAULT_FEATURE_ROLES[f.key]];
      }
      setPerms(merged);
      savedPerms.current = merged;
    } else {
      // No stored permissions yet — saved state equals defaults
      const defaults = {} as Record<FeatureKey, ConfigurableRole[]>;
      for (const f of ADMIN_FEATURES) defaults[f.key] = [...DEFAULT_FEATURE_ROLES[f.key]];
      savedPerms.current = defaults;
    }
  }, [allSettings]);

  const hasChanges = useMemo(() => {
    if (!savedPerms.current) return false;
    for (const f of ADMIN_FEATURES) {
      const cur = [...(perms[f.key] ?? [])].sort();
      const saved = [...(savedPerms.current[f.key] ?? [])].sort();
      if (cur.length !== saved.length || cur.some((v, i) => v !== saved[i])) return true;
    }
    return false;
  }, [perms]);

  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const toggle = (feature: FeatureKey, role: ConfigurableRole) => {
    setPerms((prev) => {
      const current = prev[feature] ?? [];
      const updated = current.includes(role)
        ? current.filter((r) => r !== role)
        : [...current, role];
      return { ...prev, [feature]: updated };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key: "feature_permissions", value: perms });
      savedPerms.current = { ...perms };
      toast({ title: "Access control settings saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">Access Control</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Control which roles can access each admin feature. <strong>Super Admin</strong> always has full access and cannot be restricted.
      </p>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
              <th className="text-center py-3 px-3 font-medium text-muted-foreground w-16">
                <span className="text-xs">Super Admin</span>
              </th>
              {CONFIGURABLE_ROLES.map((r) => (
                <th key={r.key} className="text-center py-3 px-3 font-medium text-muted-foreground w-24">
                  <span className="text-xs">{r.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => {
              const features = ADMIN_FEATURES.filter((f) => f.group === group);
              if (features.length === 0) return null;
              return (
                <Fragment key={group}>
                  <tr>
                    <td colSpan={2 + CONFIGURABLE_ROLES.length} className="px-4 pt-4 pb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {GROUP_LABELS[group]}
                      </span>
                    </td>
                  </tr>
                  {features.map((f) => (
                    <tr key={f.key} className="border-b border-border/50 last:border-b-0">
                      <td className="py-2.5 px-4 text-foreground">{f.label}</td>
                      <td className="text-center py-2.5 px-3">
                        <Switch checked disabled className="opacity-60" />
                      </td>
                      {CONFIGURABLE_ROLES.map((r) => (
                        <td key={r.key} className="text-center py-2.5 px-3">
                          <Switch
                            checked={perms[f.key]?.includes(r.key) ?? false}
                            onCheckedChange={() => toggle(f.key, r.key)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3">
        <Button onClick={save} disabled={saving || !hasChanges}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default AdminAccessControl;
