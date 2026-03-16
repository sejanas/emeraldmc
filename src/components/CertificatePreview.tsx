import { useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CertificatePreviewProps {
  cert: any;
  open: boolean;
  onClose: () => void;
}

const WATERMARK_TEXT = "Emerald Mainland Clinic";

const CertificatePreview = ({ cert, open, onClose }: CertificatePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent right-click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Prevent drag
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Prevent keyboard shortcuts for saving
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (!cert) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-background/95 backdrop-blur-sm"
        onContextMenu={handleContextMenu}
      >
        <DialogTitle className="sr-only">{cert.name} Certificate</DialogTitle>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 z-50 rounded-full bg-background/80 hover:bg-background"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div ref={containerRef} className="relative w-full h-full overflow-auto p-4">
          {/* Certificate image with watermark overlay */}
          <div className="relative mx-auto max-w-3xl select-none">
            {cert.image_url ? (
              <img
                src={cert.image_url}
                alt={cert.name}
                className="w-full rounded-lg pointer-events-none"
                draggable={false}
                onDragStart={handleDragStart}
                style={{ userSelect: "none", WebkitUserDrag: "none" } as any}
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg bg-accent">
                <BadgeCheck className="h-24 w-24 text-primary" />
              </div>
            )}

            {/* Watermark overlay - CSS-based diagonal repeating pattern */}
            <div
              className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <div
                className="absolute inset-[-50%] flex flex-wrap items-center justify-center gap-8"
                style={{
                  transform: "rotate(-30deg)",
                  width: "200%",
                  height: "200%",
                }}
              >
                {Array.from({ length: 80 }).map((_, i) => (
                  <span
                    key={i}
                    className="text-foreground/[0.06] font-bold whitespace-nowrap select-none pointer-events-none"
                    style={{
                      fontSize: "1.1rem",
                      letterSpacing: "0.15em",
                      userSelect: "none",
                    }}
                  >
                    {WATERMARK_TEXT}
                  </span>
                ))}
              </div>
            </div>

            {/* Canvas-based secondary watermark for extra protection */}
            <canvas
              className="absolute inset-0 w-full h-full rounded-lg pointer-events-none"
              style={{ zIndex: 11, opacity: 0.04, mixBlendMode: "multiply" }}
              ref={(canvas) => {
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                canvas.width = canvas.offsetWidth * 2;
                canvas.height = canvas.offsetHeight * 2;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = "bold 28px system-ui, sans-serif";
                ctx.fillStyle = "#000";
                ctx.textAlign = "center";
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(-Math.PI / 6);
                for (let y = -canvas.height; y < canvas.height; y += 80) {
                  for (let x = -canvas.width; x < canvas.width; x += 320) {
                    ctx.fillText(WATERMARK_TEXT, x, y);
                  }
                }
                ctx.restore();
              }}
            />
          </div>

          {/* Certificate info */}
          <div className="mt-4 text-center space-y-2">
            <h3 className="font-display text-xl font-semibold text-foreground">{cert.name}</h3>
            {cert.issuing_authority && (
              <p className="text-sm text-muted-foreground">Issued by: {cert.issuing_authority}</p>
            )}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {cert.authority_logo && (
                <img src={cert.authority_logo} alt="Authority" className="h-8 object-contain" />
              )}
              {cert.is_verified && (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  <BadgeCheck className="h-4 w-4" /> Verified
                </span>
              )}
            </div>
            {cert.valid_till && (
              <p className="text-xs text-muted-foreground">
                Valid till: {new Date(cert.valid_till).getFullYear()}
              </p>
            )}
            {cert.certificate_id && (
              <p className="text-xs text-muted-foreground">Certificate ID: {cert.certificate_id}</p>
            )}
            {cert.description && (
              <p className="text-sm text-muted-foreground mt-2">{cert.description}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificatePreview;
