import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, ChevronDown, ChevronRight } from "lucide-react";

interface PackageTestsModalProps {
  packageName: string;
  tests: string[];
  subCounts?: Record<string, number>;
  subNames?: Record<string, string[]>;
  open: boolean;
  onClose: () => void;
}

const PackageTestsModal = ({ packageName, tests, subCounts, subNames, open, onClose }: PackageTestsModalProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (t: string) => setExpanded((prev) => ({ ...prev, [t]: !prev[t] }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{packageName} — All Tests</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 mt-2">
          {tests.map((t, i) => {
            const count = subCounts?.[t] ?? 0;
            const names = subNames?.[t] ?? [];
            const isOpen = expanded[t] ?? false;
            return (
              <li key={i}>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1">{t}</span>
                  {count > 0 && (
                    <button
                      type="button"
                      onClick={() => toggle(t)}
                      className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      {count} parameters
                      {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                  )}
                </div>
                {isOpen && names.length > 0 && (
                  <ul className="mt-1 ml-6 space-y-0.5">
                    {names.map((sn) => (
                      <li key={sn} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                        {sn}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default PackageTestsModal;
