import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, CheckCircle, ArrowRight, Percent, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageMeta from "@/components/PageMeta";
import PackageDetailDialog from "@/components/PackageDetailDialog";
import usePackages from "@/hooks/usePackages";
import { Skeleton } from "@/components/ui/skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 20 } as const,
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const PackagesPage = () => {
  const packagesQuery = usePackages();
  const [detailPkg, setDetailPkg] = useState<{ pkg: any; defaultExpandTest?: string } | null>(null);

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
                        onClick={() => setDetailPkg({ pkg })}
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
                                <button
                                  type="button"
                                  onClick={() => setDetailPkg({ pkg, defaultExpandTest: t })}
                                  className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/70 hover:text-primary transition-colors shrink-0"
                                >
                                  ({subCount})
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                      {extraCount > 0 && (
                        <li>
                          <button
                            type="button"
                            onClick={() => setDetailPkg({ pkg })}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            +{extraCount} more tests
                          </button>
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

      <PackageDetailDialog
        pkg={detailPkg?.pkg ?? null}
        allTests={detailPkg ? (testNames[detailPkg.pkg.id] ?? []) : []}
        totalTestCount={detailPkg ? (totalTestCounts[detailPkg.pkg.id] ?? 0) : 0}
        testSubCounts={detailPkg ? (testSubCounts[detailPkg.pkg.id] ?? {}) : {}}
        testSubNames={detailPkg ? (testSubNames[detailPkg.pkg.id] ?? {}) : {}}
        defaultExpandTest={detailPkg?.defaultExpandTest}
        open={!!detailPkg}
        onClose={() => setDetailPkg(null)}
      />
    </div>
  );
};

export default PackagesPage;
