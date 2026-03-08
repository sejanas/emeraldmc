import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Clock, Droplets, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import useCategories from "@/hooks/useCategories";
import useTests from "@/hooks/useTests";

const fadeUp = {
  hidden: { opacity: 0, y: 20 } as const,
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

const TestsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const testsQuery = useTests({ active: true });
  const categoriesQuery = useCategories();

  useEffect(() => {
    const urlCat = searchParams.get("category");
    if (urlCat) setCategory(urlCat);
  }, [searchParams]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    if (cat === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", cat);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const catName = (id: string | null) => (categoriesQuery.data ?? []).find((c: any) => c.id === id)?.name ?? "Other";

  const tests = testsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const filtered = tests.filter((t: any) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || catName(t.category_id) === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="container py-12">
      <Breadcrumbs items={[{ label: "Diagnostic Tests" }]} />
      <SectionHeading title="Diagnostic Tests" subtitle="Browse our comprehensive range of diagnostic tests with transparent pricing" />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!testsQuery.isLoading && (
            <Badge variant="secondary" className="text-xs">
              Showing {filtered.length} test{filtered.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {["All", ...categories.map((c: any) => c.name)].map((c) => (
          <button key={c} onClick={() => handleCategoryChange(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${category === c ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
          >{c}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testsQuery.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <Skeleton className="inline-block rounded-full h-5 w-24" />
                <div className="mt-2"><Skeleton className="h-5 w-3/4" /></div>
                <div className="mt-2"><Skeleton className="h-3 w-full" /></div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </div>
            ))
            : filtered.map((t: any, i: number) => (
              <motion.div key={t.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="rounded-xl border border-border bg-card p-5 transition-all hover:card-shadow-hover hover:scale-[1.01]">
                <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-primary">{catName(t.category_id)}</span>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t.report_time}</span>
                  <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> {t.sample_type}</span>
                  {t.fasting_required && <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" /> Fasting</span>}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-primary">₹{t.price}</span>
                  <Button asChild size="sm"><Link to="/book">Book Now</Link></Button>
                </div>
              </motion.div>
            ))}
      </div>
      {!testsQuery.isLoading && filtered.length === 0 && (
        <div className="py-16 text-center">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">No tests found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default TestsPage;
