import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, CheckCircle, ArrowRight, Percent, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageMeta from "@/components/PageMeta";
import usePackages from "@/hooks/usePackages";
import { Skeleton } from "@/components/ui/skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 20 } as const,
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const PackagesPage = () => {
  const packagesQuery = usePackages();
  const [descModal, setDescModal] = useState<{ name: string; text: string } | null>(null);
  const [popoverExpanded, setPopoverExpanded] = useState<Record<string, boolean>>({});

  const togglePopoverSub = (key: string) =>
    setPopoverExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const packages = packagesQuery.data?.packages ?? [];
  const testNames = packagesQuery.data?.testNames ?? {};
  const testIds: Record<string, string[]> = packagesQuery.data?.testIds ?? {};
  const testSubCounts: Record<string, Record<string, number>> = packagesQuery.data?.testSubCounts ?? {};
  const testSubNames: Record<string, Record<string, string[]>> = packagesQuery.data?.testSubNames ?? {};
  const totalTestCounts: Record<string, number> = packagesQuery.data?.totalTestCounts ?? {};

  const getSavings = (pkg: any) => {
    if (pkg.savings_override && pkg.savings_override > 0) return pkg.savings_override;
    const price = pkg.discounted_price ?? pkg.original_price;
    if (pkg.original_price > price) return pkg.original_price - price;
    return 0;
  };

  return (
    <div className="container py-12">
      <PageMeta
        title="Health Packages – Affordable Checkup Plans"
        description="Choose from our curated health checkup packages including Basic, Comprehensive, Diabetes Care, and Thyroid Profile packages at affordable prices."
      />
      <Breadcrumbs items={[{ label: "Health Packages" }]} />
      <SectionHeading title="Health Packages" subtitle="Choose from our curated health checkup packages designed for comprehensive care" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {packagesQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="relative flex flex-col rounded-xl border border-border p-6">
                <Skeleton className="h-6 w-32" />
                <div className="mt-2"><Skeleton className="h-4 w-full" /></div>
                <div className="mt-4"><Skeleton className="h-10 w-32" /></div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="mt-6 h-10 w-full" />
              </div>
            ))
          : packages.map((pkg, i) => {
              const hasDiscount = pkg.discounted_price && pkg.discounted_price < pkg.original_price;
              const discountPct = hasDiscount ? Math.round(((pkg.original_price - pkg.discounted_price!) / pkg.original_price) * 100) : 0;
              const allTests = testNames[pkg.id] ?? [];
              const allTestIds: string[] = testIds[pkg.id] ?? [];
              const featuredIds: string[] = pkg.featured_test_ids ?? [];
              const displayTests = featuredIds.length > 0
                ? featuredIds
                    .map((fid: string) => {
                      const idx = allTestIds.indexOf(fid);
                      return idx >= 0 ? allTests[idx] : null;
                    })
                    .filter(Boolean)
                    .slice(0, 5) as string[]
                : allTests.slice(0, 5);
              const extraCount = allTests.length - displayTests.length;
              const savings = getSavings(pkg);
              const price = pkg.discounted_price ?? pkg.original_price;

              return (
                <motion.div key={pkg.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className={`relative flex flex-col rounded-xl border p-6 pt-8 transition-all hover:card-shadow-hover hover:scale-[1.02] ${pkg.is_popular ? "border-primary ring-2 ring-primary/20 bg-accent/50" : "border-border bg-card"}`}>
                  {pkg.is_popular && (
                    <span className="absolute -top-3 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                      <Star className="h-3 w-3" /> Most Popular
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground shadow-sm">
                      <Percent className="h-3 w-3" /> {discountPct}% OFF
                    </span>
                  )}
                  <h3 className="font-display text-xl font-semibold text-foreground">{pkg.name}</h3>
                  {pkg.description && (
                    <div className="mt-1">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{pkg.description}</p>
                      <button
                        type="button"
                        onClick={() => setDescModal({ name: pkg.name, text: pkg.description })}
                        className="text-xs font-medium text-primary hover:underline mt-0.5"
                      >
                        Read more →
                      </button>
                    </div>
                  )}
                  <div className="mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold text-primary">₹{price}</span>
                      {hasDiscount && <span className="text-sm text-muted-foreground line-through">₹{pkg.original_price}</span>}
                    </div>
                    {savings > 0 && (
                      <p className="text-xs font-semibold text-primary mt-0.5">Save ₹{savings}</p>
                    )}
                  </div>
                  {pkg.show_test_count !== false && allTests.length > 0 && (
                    <p className="mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      🧪 {totalTestCounts[pkg.id] ?? allTests.length} Tests Included
                    </p>
                  )}
                  {displayTests.length > 0 && (
                    <ul className="mt-2 flex-1 space-y-1.5">
                      {displayTests.map((t: string) => {
                        const subCount = testSubCounts[pkg.id]?.[t] ?? 0;
                        return (
                          <li key={t}>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                              <span className="flex-1">{t}</span>
                              {subCount > 0 && (
                                <Popover onOpenChange={(open) => {
                                  if (open) {
                                    setPopoverExpanded({ [t]: true });
                                  }
                                }}>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/70 hover:text-primary transition-colors shrink-0"
                                    >
                                      ({subCount})
                                      <ChevronRight className="h-3 w-3" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent side="right" align="start" className="w-80 p-0">
                                    <ScrollArea className="max-h-[60vh]">
                                      <div className="p-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                          {allTests.length} Tests in {pkg.name}
                                        </p>
                                        <ul className="space-y-1">
                                          {allTests.map((at: string) => {
                                            const sc = testSubCounts[pkg.id]?.[at] ?? 0;
                                            const sn = testSubNames[pkg.id]?.[at] ?? [];
                                            const isOpen = popoverExpanded[at] ?? false;
                                            return (
                                              <li key={at}>
                                                <button
                                                  type="button"
                                                  onClick={() => sc > 0 && togglePopoverSub(at)}
                                                  className={`flex items-center gap-2 text-sm w-full text-left rounded px-1.5 py-1 transition-colors ${
                                                    sc > 0 ? "hover:bg-accent cursor-pointer" : "cursor-default"
                                                  }`}
                                                >
                                                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                                                  <span className="flex-1 text-foreground">{at}</span>
                                                  {sc > 0 && (
                                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                                                      ({sc})
                                                      {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                    </span>
                                                  )}
                                                </button>
                                                {isOpen && sn.length > 0 && (
                                                  <ul className="ml-7 mt-0.5 mb-1 space-y-0.5">
                                                    {sn.map((name) => (
                                                      <li key={name} className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
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
                                    </ScrollArea>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </li>
                        );
                      })}
                      {extraCount > 0 && (
                        <li>
                          <Popover onOpenChange={(open) => {
                            if (open) setPopoverExpanded({});
                          }}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                +{extraCount} more tests
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="right" align="start" className="w-80 p-0">
                              <ScrollArea className="max-h-[60vh]">
                                <div className="p-3">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    {allTests.length} Tests in {pkg.name}
                                  </p>
                                  <ul className="space-y-1">
                                    {allTests.map((at: string) => {
                                      const sc = testSubCounts[pkg.id]?.[at] ?? 0;
                                      const sn = testSubNames[pkg.id]?.[at] ?? [];
                                      const isOpen = popoverExpanded[at] ?? false;
                                      return (
                                        <li key={at}>
                                          <button
                                            type="button"
                                            onClick={() => sc > 0 && togglePopoverSub(at)}
                                            className={`flex items-center gap-2 text-sm w-full text-left rounded px-1.5 py-1 transition-colors ${
                                              sc > 0 ? "hover:bg-accent cursor-pointer" : "cursor-default"
                                            }`}
                                          >
                                            <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <span className="flex-1 text-foreground">{at}</span>
                                            {sc > 0 && (
                                              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                                                ({sc})
                                                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                              </span>
                                            )}
                                          </button>
                                          {isOpen && sn.length > 0 && (
                                            <ul className="ml-7 mt-0.5 mb-1 space-y-0.5">
                                              {sn.map((name) => (
                                                <li key={name} className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
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
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        </li>
                      )}
                    </ul>
                  )}
                  <div className="mt-auto pt-6">
                    <Button asChild className="w-full" variant={pkg.is_popular ? "default" : "outline"}>
                      <Link to="/book">Book Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
      </div>

      {/* Description Modal */}
      <Dialog open={!!descModal} onOpenChange={(o) => !o && setDescModal(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>{descModal?.name}</DialogTitle>
          <p className="text-sm text-muted-foreground whitespace-pre-line mt-2">{descModal?.text}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackagesPage;
