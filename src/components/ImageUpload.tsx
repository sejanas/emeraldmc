import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Crop as CropIcon, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
}

function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0, canvas.width, canvas.height,
  );
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/webp", 0.85));
}

const ImageUpload = ({ value, onChange, folder = "uploads" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImgSrc(reader.result as string); setCropOpen(true); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const uploadBlob = useCallback(async (blob: Blob) => {
    setUploading(true);
    const name = `${folder}/${Date.now()}.webp`;
    const { error } = await supabase.storage.from("images").upload(name, blob, { contentType: "image/webp" });
    if (!error) {
      const { data } = supabase.storage.from("images").getPublicUrl(name);
      onChange(data.publicUrl);
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

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Uploaded" className="h-24 w-24 rounded-lg object-cover border border-border" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="mr-1.5 h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Upload Image"}
        </Button>
      )}

      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Crop Image</DialogTitle></DialogHeader>
          {imgSrc && (
            <div className="space-y-4">
              <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)}>
                <img ref={imgRef} src={imgSrc} alt="Crop preview" className="max-h-80 w-full object-contain" />
              </ReactCrop>
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
