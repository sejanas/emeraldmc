import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sun, Contrast, Droplets, RotateCw, RotateCcw,
  FlipHorizontal, FlipVertical, Undo2, Save, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL ?? "https://kswypwqxxhsbnrhnqrzm.supabase.co"}/functions/v1/api`;

interface ImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (newUrl: string) => void;
  folder?: string;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

const DEFAULT_ADJ: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  rotation: 0,
  flipH: false,
  flipV: false,
};

const PRESETS: { label: string; adj: Partial<Adjustments> }[] = [
  { label: "Original", adj: {} },
  { label: "Bright", adj: { brightness: 120, contrast: 105 } },
  { label: "Vivid", adj: { saturation: 140, contrast: 110 } },
  { label: "Muted", adj: { saturation: 60, brightness: 105 } },
  { label: "High Contrast", adj: { contrast: 140, brightness: 95 } },
  { label: "Warm", adj: { brightness: 108, saturation: 115 } },
];

function getFilterString(adj: Adjustments) {
  return `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;
}

function getTransformString(adj: Adjustments) {
  const parts: string[] = [];
  if (adj.rotation) parts.push(`rotate(${adj.rotation}deg)`);
  if (adj.flipH) parts.push("scaleX(-1)");
  if (adj.flipV) parts.push("scaleY(-1)");
  return parts.join(" ") || "none";
}

async function renderToBlob(img: HTMLImageElement, adj: Adjustments): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const rad = (adj.rotation * Math.PI) / 180;
  const abscos = Math.abs(Math.cos(rad));
  const abssin = Math.abs(Math.sin(rad));
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  canvas.width = Math.round(w * abscos + h * abssin);
  canvas.height = Math.round(w * abssin + h * abscos);

  const ctx = canvas.getContext("2d")!;
  ctx.filter = getFilterString(adj);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  if (adj.flipH) ctx.scale(-1, 1);
  if (adj.flipV) ctx.scale(1, -1);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/webp", 0.88));
}

async function uploadBlob(blob: Blob, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, `${Date.now()}.webp`);
  formData.append("folder", folder);

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/upload`, { method: "POST", headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

const ImageEditor = ({ open, onOpenChange, imageUrl, onSave, folder = "gallery" }: ImageEditorProps) => {
  const [adj, setAdj] = useState<Adjustments>({ ...DEFAULT_ADJ });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const hiddenImgRef = useRef<HTMLImageElement | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setAdj({ ...DEFAULT_ADJ });
      setLoaded(false);
      // Preload image for canvas rendering
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { hiddenImgRef.current = img; };
      img.src = imageUrl;
    }
  }, [open, imageUrl]);

  const update = useCallback((key: keyof Adjustments, value: any) => {
    setAdj((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyPreset = (preset: Partial<Adjustments>) => {
    setAdj({ ...DEFAULT_ADJ, ...preset });
  };

  const resetAll = () => setAdj({ ...DEFAULT_ADJ });

  const hasChanges = JSON.stringify(adj) !== JSON.stringify(DEFAULT_ADJ);

  const handleSave = async () => {
    if (!hiddenImgRef.current) return;
    setSaving(true);
    try {
      const blob = await renderToBlob(hiddenImgRef.current, adj);
      const url = await uploadBlob(blob, folder);
      onSave(url);
      onOpenChange(false);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const sliders: { key: keyof Adjustments; label: string; icon: typeof Sun; min: number; max: number }[] = [
    { key: "brightness", label: "Brightness", icon: Sun, min: 50, max: 150 },
    { key: "contrast", label: "Contrast", icon: Contrast, min: 50, max: 200 },
    { key: "saturation", label: "Saturation", icon: Droplets, min: 0, max: 200 },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Preview */}
          <div className="rounded-xl overflow-hidden border border-border bg-muted/30 flex items-center justify-center min-h-[200px]">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Edit preview"
              className="max-h-[50vh] w-full object-contain transition-all duration-200"
              style={{
                filter: getFilterString(adj),
                transform: getTransformString(adj),
              }}
              onLoad={() => setLoaded(true)}
              crossOrigin="anonymous"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Presets</Label>
            <div className="flex gap-1.5 flex-wrap">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => applyPreset(p.adj)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Adjustment Sliders */}
          <div className="space-y-4">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Adjustments</Label>
            {sliders.map(({ key, label, icon: Icon, min, max }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {label}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                    {adj[key] as number}%
                  </span>
                </div>
                <Slider
                  value={[adj[key] as number]}
                  onValueChange={([v]) => update(key, v)}
                  min={min}
                  max={max}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          {/* Transform Controls */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Transform</Label>
            <div className="flex gap-1.5 flex-wrap">
              <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => update("rotation", (adj.rotation - 90) % 360)}>
                <RotateCcw className="h-3.5 w-3.5" /> Rotate Left
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => update("rotation", (adj.rotation + 90) % 360)}>
                <RotateCw className="h-3.5 w-3.5" /> Rotate Right
              </Button>
              <Button
                type="button"
                variant={adj.flipH ? "default" : "outline"}
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => update("flipH", !adj.flipH)}
              >
                <FlipHorizontal className="h-3.5 w-3.5" /> Flip H
              </Button>
              <Button
                type="button"
                variant={adj.flipV ? "default" : "outline"}
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => update("flipV", !adj.flipV)}
              >
                <FlipVertical className="h-3.5 w-3.5" /> Flip V
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-between border-t border-border pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={resetAll} disabled={!hasChanges || saving}>
              <Undo2 className="h-3.5 w-3.5 mr-1" /> Reset All
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving || !loaded}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageEditor;
