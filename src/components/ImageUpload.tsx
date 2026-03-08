import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Upload, Crop as CropIcon, X, RotateCcw, Square, RectangleHorizontal, Circle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL ?? "https://kswypwqxxhsbnrhnqrzm.supabase.co"}/functions/v1/api`;

type AspectPreset = "free" | "1:1" | "16:9" | "4:3" | "3:4";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  aspectRatio?: AspectPreset;
  /** Show aspect ratio picker buttons */
  showAspectPicker?: boolean;
  className?: string;
}

const ASPECT_MAP: Record<AspectPreset, number | undefined> = {
  free: undefined,
  "1:1": 1,
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
};

const ASPECT_ICONS: Record<AspectPreset, typeof Square> = {
  free: RotateCcw,
  "1:1": Square,
  "16:9": RectangleHorizontal,
  "4:3": RectangleHorizontal,
  "3:4": Square,
};

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0, canvas.width, canvas.height,
  );
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/webp", 0.88));
}

async function uploadViaApi(blob: Blob, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, `${Date.now()}.webp`);
  formData.append("folder", folder);

  // Get token from supabase client session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

const ImageUpload = ({
  value,
  onChange,
  folder = "uploads",
  aspectRatio = "free",
  showAspectPicker = true,
  className,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedAspect, setSelectedAspect] = useState<AspectPreset>(aspectRatio);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be under 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
      setSelectedAspect(aspectRatio);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const aspect = ASPECT_MAP[selectedAspect];
    if (aspect) {
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }, [selectedAspect]);

  const changeAspect = (preset: AspectPreset) => {
    setSelectedAspect(preset);
    const aspect = ASPECT_MAP[preset];
    if (imgRef.current && aspect) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspect));
    } else {
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  };

  const uploadBlob = useCallback(async (blob: Blob) => {
    setUploading(true);
    try {
      const url = await uploadViaApi(blob, folder);
      onChange(url);
    } catch (err: any) {
      console.error("Upload failed:", err);
      alert(`Upload failed: ${err.message}`);
    }
    setUploading(false);
    setCropOpen(false);
    setImgSrc("");
  }, [folder, onChange]);

  const handleCropConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    const blob = await getCroppedImg(imgRef.current, completedCrop);
    await uploadBlob(blob);
  };

  const handleUploadOriginal = async () => {
    if (!imgSrc) return;
    const res = await fetch(imgSrc);
    const blob = await res.blob();
    await uploadBlob(blob);
  };

  const aspectPresets: AspectPreset[] = ["free", "1:1", "16:9", "4:3"];

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Uploaded" className="h-24 w-24 rounded-lg object-cover border border-border" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:scale-110 transition-transform"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="mr-1.5 h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Upload Image"}
        </Button>
      )}

      <Dialog open={cropOpen} onOpenChange={(o) => { if (!uploading) setCropOpen(o); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Crop & Upload Image</DialogTitle></DialogHeader>
          {imgSrc && (
            <div className="space-y-4">
              {/* Aspect ratio presets */}
              {showAspectPicker && (
                <div className="flex gap-1.5 flex-wrap">
                  {aspectPresets.map((preset) => {
                    const Icon = ASPECT_ICONS[preset];
                    return (
                      <Button
                        key={preset}
                        type="button"
                        variant={selectedAspect === preset ? "default" : "outline"}
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => changeAspect(preset)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {preset === "free" ? "Free" : preset}
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Crop area */}
              <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={ASPECT_MAP[selectedAspect]}
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop preview"
                    className="max-h-80 w-full object-contain"
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={handleUploadOriginal} disabled={uploading}>
                  <Upload className="mr-1 h-3.5 w-3.5" /> Upload Original
                </Button>
                <Button type="button" size="sm" onClick={handleCropConfirm} disabled={uploading || !completedCrop}>
                  <CropIcon className="mr-1 h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Crop & Upload"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageUpload;
