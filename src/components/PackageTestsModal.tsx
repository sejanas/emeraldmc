import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

interface PackageTestsModalProps {
  packageName: string;
  tests: string[];
  subCounts?: Record<string, number>;
  open: boolean;
  onClose: () => void;
}

const PackageTestsModal = ({ packageName, tests, subCounts, open, onClose }: PackageTestsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{packageName} — All Tests</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 mt-2">
          {tests.map((t, i) => {
            const count = subCounts?.[t] ?? 0;
            return (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                {t}
                {count > 0 && <span className="text-[10px] text-muted-foreground">— {count} parameters</span>}
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default PackageTestsModal;
