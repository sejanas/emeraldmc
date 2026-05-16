import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Announcement } from "@/lib/announcements";
import { VisitingDoctorPanel } from "../content/VisitingDoctorPanel";

interface Props {
  announcement: Announcement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCta?: (which: "primary" | "secondary") => void;
}

export function VisitingDoctorRenderer({ announcement: a, open, onOpenChange, onCta }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-y-auto max-h-[92svh]">
        <DialogTitle className="sr-only">{a.title}</DialogTitle>
        <VisitingDoctorPanel
          announcement={a}
          onCta={onCta}
          onPrimaryAction={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default VisitingDoctorRenderer;
