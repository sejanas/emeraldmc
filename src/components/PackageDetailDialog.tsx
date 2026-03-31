import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronDown, ChevronRight, ArrowRight, Percent } from "lucide-react";

interface PackageDetailDialogProps {
  pkg: {
    name: string;
    description?: string | null;
    original_price: number;
    discounted_price?: number | null;
    is_popular?: boolean;
    instructions?: string | null;
    savings_override?: number | null;
  } | null;
  allTests: string[];
  totalTestCount: number;
  testSubCounts: Record<string, number>;
  testSubNames: Record<string, string[]>;
  defaultExpandTest?: string;
  open: boolean;
  onClose: () => void;
}

const PackageDetailDialog = ({
  pkg,
  allTests,
  totalTestCount,
  testSubCounts,
  testSubNames,
  defaultExpandTest,
  open,
  onClose,
}: PackageDetailDialogProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    defaultExpandTest ? { [defaultExpandTest]: true } : {}
  );
  const toggle = (t: string) =>
    setExpanded((prev) => ({ ...prev, [t]: !prev[t] }));

  // Reset expanded state when dialog opens with a new default
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  if (!pkg) return null;

  const price = pkg.discounted_price ?? pkg.original_price;
  const hasDiscount = pkg.discounted_price && pkg.discounted_price < pkg.original_price;
  const discountPct = hasDiscount
    ? Math.round(((pkg.original_price - pkg.discounted_price!) / pkg.original_price) * 100)
    : 0;
  const savings =
    pkg.savings_override && pkg.savings_override > 0
      ? pkg.savings_override
      : hasDiscount
        ? pkg.original_price - price
        : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-0">
          <DialogTitle className="font-display text-xl font-semibold">
            {pkg.name}
          </DialogTitle>

          {/* Price row */}
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-primary">₹{price}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">₹{pkg.original_price}</span>
            )}
            {discountPct > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                <Percent className="h-3 w-3" /> {discountPct}% OFF
              </span>
            )}
          </div>
          {savings > 0 && (
            <p className="text-xs font-semibold text-primary mt-0.5">Save ₹{savings}</p>
          )}
        </div>

        {/* Scrollable body */}
        <ScrollArea className="max-h-[75vh] px-5">
          {/* Description */}
          {pkg.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mt-3 text-justify">
              {pkg.description}
            </p>
          )}

          {/* Instructions */}
          {pkg.instructions && (
            <div className="mt-3 rounded-lg bg-accent/50 p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Preparation</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line text-justify">{pkg.instructions}</p>
            </div>
          )}

          {/* Tests section */}
          {allTests.length > 0 && (
            <div className="mt-4 mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                🧪 {totalTestCount} Tests Included
              </p>
              <ul className="space-y-0.5">
                {allTests.map((t) => {
                  const sc = testSubCounts[t] ?? 0;
                  const sn = testSubNames[t] ?? [];
                  const isOpen = expanded[t] ?? false;
                  return (
                    <li key={t}>
                      <button
                        type="button"
                        onClick={() => sc > 0 && toggle(t)}
                        className={`flex items-center gap-2 text-sm w-full text-left rounded px-2 py-1.5 transition-colors ${
                          sc > 0 ? "hover:bg-accent cursor-pointer" : "cursor-default"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        <span className="flex-1 text-foreground">{t}</span>
                        {sc > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground shrink-0">
                            ({sc})
                            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </span>
                        )}
                      </button>
                      {isOpen && sn.length > 0 && (
                        <ul className="ml-8 mb-1 space-y-0.5">
                          {sn.map((name) => (
                            <li key={name} className="text-xs text-muted-foreground/80 flex items-center gap-1.5 py-0.5">
                              <span className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                              {name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </ScrollArea>

        {/* Footer CTA */}
        <div className="p-4 border-t border-border">
          <Button asChild className="w-full">
            <Link to="/book" onClick={onClose}>
              Book Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageDetailDialog;
