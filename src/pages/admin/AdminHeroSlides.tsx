import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, ImageIcon } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import ImageUpload from "@/components/ImageUpload";
import useHeroSlides from "@/hooks/useHeroSlides";
import { useHeroSlidesMutations } from "@/hooks/useHeroSlidesMutations";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";

const HEADING_MAX = 80;
const SUBTITLE_MAX = 200;
const MIN_SLIDES = 2;
const MAX_SLIDES = 5;

const AdminHeroSlides = () => {
  const { profile } = useAuth();
  const { canAccess } = useFeaturePermissions();
  const { toast } = useToast();
  const confirm = useConfirm();
  const slidesQuery = useHeroSlides();
  const { create, update, remove } = useHeroSlidesMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    heading: "",
    subtitle: "",
    image_url: "",
    display_order: 0,
    is_active: true,
  });

  if (!canAccess("gallery", profile?.role)) return <Navigate to="/admin" replace />;

  const items: any[] = slidesQuery.data ?? [];
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.display_order - b.display_order),
    [items],
  );
  const activeCount = items.filter((s) => s.is_active).length;

  const openNew = () => {
    if (items.length >= MAX_SLIDES) {
      toast({ title: `Maximum ${MAX_SLIDES} slides allowed`, variant: "destructive" });
      return;
    }
    setEditing(null);
    setForm({
      heading: "",
      subtitle: "",
      image_url: "",
      display_order: items.length,
      is_active: true,
    });
    setOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      heading: s.heading,
      subtitle: s.subtitle,
      image_url: s.image_url,
      display_order: s.display_order,
      is_active: s.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.heading.trim()) { toast({ title: "Heading is required", variant: "destructive" }); return; }
    if (!form.subtitle.trim()) { toast({ title: "Subtitle is required", variant: "destructive" }); return; }
    if (!form.image_url) { toast({ title: "Please upload an image", variant: "destructive" }); return; }
    if (form.heading.length > HEADING_MAX) { toast({ title: `Heading must be at most ${HEADING_MAX} characters`, variant: "destructive" }); return; }
    if (form.subtitle.length > SUBTITLE_MAX) { toast({ title: `Subtitle must be at most ${SUBTITLE_MAX} characters`, variant: "destructive" }); return; }

    // Check active count limits
    if (!editing && form.is_active && activeCount >= MAX_SLIDES) {
      toast({ title: `Maximum ${MAX_SLIDES} active slides allowed`, variant: "destructive" });
      return;
    }
    if (editing && !form.is_active && editing.is_active && activeCount <= MIN_SLIDES) {
      toast({ title: `At least ${MIN_SLIDES} active slides required`, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...form });
      } else {
        await create.mutateAsync(form);
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (s: any) => {
    if (activeCount <= MIN_SLIDES && s.is_active) {
      toast({ title: `At least ${MIN_SLIDES} active slides required`, variant: "destructive" });
      return;
    }
    const result = await confirm({
      title: "Delete Slide",
      description: `Are you sure you want to delete "${s.heading}"?`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!result.confirmed) return;
    try {
      await remove.mutateAsync(s.id);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleActive = async (s: any) => {
    if (s.is_active && activeCount <= MIN_SLIDES) {
      toast({ title: `At least ${MIN_SLIDES} active slides required`, variant: "destructive" });
      return;
    }
    if (!s.is_active && activeCount >= MAX_SLIDES) {
      toast({ title: `Maximum ${MAX_SLIDES} active slides allowed`, variant: "destructive" });
      return;
    }
    try {
      await update.mutateAsync({ id: s.id, is_active: !s.is_active });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const moveSlide = async (s: any, direction: "up" | "down") => {
    const idx = sorted.findIndex((item: any) => item.id === s.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    try {
      await Promise.all([
        update.mutateAsync({ id: s.id, display_order: other.display_order }),
        update.mutateAsync({ id: other.id, display_order: s.display_order }),
      ]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Hero Slides</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} slide{items.length !== 1 ? "s" : ""} · {activeCount} active
            <span className="text-xs ml-2">(min {MIN_SLIDES}, max {MAX_SLIDES})</span>
          </p>
        </div>
        <Button size="sm" onClick={openNew} disabled={items.length >= MAX_SLIDES}>
          <Plus className="mr-1 h-4 w-4" /> Add Slide
        </Button>
      </div>

      {/* Slides list */}
      <div className="space-y-4">
        {slidesQuery.isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <div className="w-48 aspect-video animate-pulse rounded-lg bg-muted shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))
          : sorted.map((s: any) => (
              <div
                key={s.id}
                className={`flex flex-col sm:flex-row gap-4 rounded-xl border bg-card p-4 transition-opacity ${
                  s.is_active ? "border-border" : "border-border/50 opacity-60"
                }`}
              >
                {/* Thumbnail */}
                <div className="w-full sm:w-48 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.heading}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{s.heading}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {s.subtitle}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={sorted.indexOf(s) === 0}
                        onClick={() => moveSlide(s, "up")}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={sorted.indexOf(s) === sorted.length - 1}
                        onClick={() => moveSlide(s, "down")}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={s.is_active}
                        onCheckedChange={() => toggleActive(s)}
                        aria-label="Toggle active"
                      />
                      <span className="text-xs text-muted-foreground">
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-1 ml-auto">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {!slidesQuery.isLoading && !items.length && (
        <div className="py-16 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">
            No hero slides yet. Add your first slide!
          </p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Hero Slide" : "Add Hero Slide"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                Image <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-1">
                Recommended: 960×540px (16:9 aspect ratio)
              </p>
              <ImageUpload
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                folder="hero"
                aspectRatio="16:9"
                previewClassName="w-full aspect-video rounded-lg object-cover border border-border"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>
                  Heading <span className="text-destructive">*</span>
                </Label>
                <span
                  className={`text-xs ${
                    form.heading.length > HEADING_MAX
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {form.heading.length}/{HEADING_MAX}
                </span>
              </div>
              <Input
                value={form.heading}
                onChange={(e) => setForm({ ...form, heading: e.target.value.slice(0, HEADING_MAX) })}
                className="mt-1"
                placeholder="e.g. Bringing World Class Care to the Islands"
                maxLength={HEADING_MAX}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Last two words will be highlighted with accent color
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>
                  Subtitle <span className="text-destructive">*</span>
                </Label>
                <span
                  className={`text-xs ${
                    form.subtitle.length > SUBTITLE_MAX
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {form.subtitle.length}/{SUBTITLE_MAX}
                </span>
              </div>
              <Textarea
                value={form.subtitle}
                onChange={(e) =>
                  setForm({ ...form, subtitle: e.target.value.slice(0, SUBTITLE_MAX) })
                }
                className="mt-1"
                placeholder="Describe the service or highlight..."
                rows={3}
                maxLength={SUBTITLE_MAX}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>{form.is_active ? "Active" : "Inactive"}</Label>
            </div>
            <Button onClick={save} className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHeroSlides;
