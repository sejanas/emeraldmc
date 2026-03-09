import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, CheckCircle, ArrowRight, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const packages = packagesQuery.data?.packages ?? [];
  const testNames = packagesQuery.data?.testNames ?? {};

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
              const tests = testNames[pkg.id] ?? [];

              return (
                <motion.div key={pkg.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className={`relative flex flex-col rounded-xl border p-6 transition-all hover:card-shadow-hover hover:scale-[1.02] ${pkg.is_popular ? "border-primary ring-2 ring-primary/20 bg-accent/50" : "border-border bg-card"}`}>
                  {pkg.is_popular && (
                    <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                      <Star className="h-3 w-3" /> Most Popular
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground shadow-sm">
                      <Percent className="h-3 w-3" /> {discountPct}% OFF
                    </span>
                  )}
                  <h3 className="font-display text-xl font-semibold text-foreground">{pkg.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold text-primary">₹{pkg.discounted_price ?? pkg.original_price}</span>
                    {hasDiscount && <span className="text-sm text-muted-foreground line-through">₹{pkg.original_price}</span>}
                  </div>
                  {tests.length > 0 && (
                    <div className="mt-5 border-t border-border pt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Includes {tests.length} Tests</p>
                      <ul className="flex-1 space-y-2">
                        {tests.map((t: string) => (
                          <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" /> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
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
    </div>
  );
};

export default PackagesPage;
