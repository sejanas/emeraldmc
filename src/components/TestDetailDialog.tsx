import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlaskConical } from "lucide-react";

interface TestDetailDialogProps {
  test: {
    name: string;
    sub_test_names?: string[];
    sub_test_count?: number;
  } | null;
  open: boolean;
  onClose: () => void;
}

const TestDetailDialog = ({ test, open, onClose }: TestDetailDialogProps) => {
  if (!test) return null;

  const names = test.sub_test_names ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        <div className="p-5 pb-3">
          <DialogTitle className="font-display text-lg font-semibold">
            {test.name}
          </DialogTitle>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5 text-primary" />
            {test.sub_test_count ?? names.length} parameters
          </p>
        </div>
        <ScrollArea className="max-h-[50vh] px-5 pb-5">
          <ul className="space-y-1">
            {names.map((sn) => (
              <li key={sn} className="text-sm text-muted-foreground flex items-center gap-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                {sn}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TestDetailDialog;
