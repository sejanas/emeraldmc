import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, HelpCircle } from "lucide-react";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "destructive" renders the confirm button in red */
  variant?: "default" | "destructive";
  /** When provided, an optional freetext input will be shown */
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
}

export interface ConfirmResult {
  confirmed: boolean;
  input?: string | null;
}

interface PendingDialog extends ConfirmOptions {
  resolve: (r: ConfirmResult) => void;
}

interface ConfirmContextType {
  confirm: (opts: ConfirmOptions) => Promise<ConfirmResult>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<PendingDialog | null>(null);
  const [inputValue, setInputValue] = useState("");

  const confirm = useCallback((opts: ConfirmOptions): Promise<ConfirmResult> => {
    return new Promise((resolve) => {
      setInputValue("");
      setDialog({ ...opts, resolve });
    });
  }, []);

  const handleConfirm = () => {
    if (!dialog) return;
    dialog.resolve({ confirmed: true, input: inputValue.trim() || null });
    setDialog(null);
  };

  const handleCancel = () => {
    if (!dialog) return;
    dialog.resolve({ confirmed: false, input: null });
    setDialog(null);
  };

  const isDestructive = dialog?.variant === "destructive";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={!!dialog} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full ${isDestructive ? "bg-destructive/10" : "bg-primary/10"}`}>
                {isDestructive
                  ? <AlertTriangle className="h-4 w-4 text-destructive" />
                  : <HelpCircle className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base">{dialog?.title}</DialogTitle>
                {dialog?.description && (
                  <DialogDescription className="mt-1">{dialog.description}</DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          {dialog?.inputLabel && (
            <div className="space-y-1.5">
              <Label className="text-sm">
                {dialog.inputLabel}
                {!dialog.inputRequired && <span className="text-muted-foreground ml-1">(optional)</span>}
              </Label>
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={dialog.inputPlaceholder ?? ""}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              {dialog?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              size="sm"
              variant={isDestructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={dialog?.inputRequired ? !inputValue.trim() : false}
            >
              {dialog?.confirmLabel ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx.confirm;
}
