import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

interface PackageTestsModalProps {
  packageName: string;
  tests: string[];
  open: boolean;
  onClose: () => void;
}

const PackageTestsModal = ({ packageName, tests, open, onClose }: PackageTestsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{packageName} — All Tests</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 mt-2">
          {tests.map((t, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default PackageTestsModal;
