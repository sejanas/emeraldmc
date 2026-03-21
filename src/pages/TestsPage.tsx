import { useState, useEffect } from "react";
import PageMeta from "@/components/PageMeta";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Clock, Droplets, AlertCircle, FlaskConical, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    const urlSearch = searchParams.get("search");
    if (urlSearch !== null) setSearch(urlSearch);
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

  const categories = categoriesQuery.data ?? [];
  const tests = testsQuery.data ?? [];

  const filtered = tests.filter((t: any) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      category === "All" ||
      (t.categories ?? []).some((c: any) => c.name === category);
    return matchSearch && matchCat;
  });

  return (
    <div className="container py-12">
      <PageMeta title="Diagnostic Tests – Prices & Details" description="Browse 50+ diagnostic tests with transparent pricing at Shifa's Mainland Healthcare. CBC, thyroid, diabetes, liver function tests and more." />
      <Breadcrumbs items={[{ label: "Diagnostic Tests" }]} />
      <SectionHeading title="Diagnostic Tests" subtitle="Browse our comprehensive range of diagnostic tests with transparent pricing" />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tests..." value={search} onChange={(e) => {
            setSearch(e.target.value);
            const newParams = new URLSearchParams(searchParams);
            if (e.target.value) newParams.set("search", e.target.value);
            else newParams.delete("search");
            setSearchParams(newParams, { replace: true });
          }} className="pl-9 pr-9" />
          {search && <button onClick={() => { setSearch(""); const p = new URLSearchParams(searchParams); p.delete("search"); setSearchParams(p, { replace: true }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
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
                <div className="flex flex-wrap gap-1.5">
                  {(t.categories ?? []).map((c: any) => (
                    <span key={c.id} className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-primary">{c.name}</span>
                  ))}
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{t.name}</h3>
                {t.is_sub_test && t.parent_test_name && (
                  <span className="inline-block mt-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                    Part of {t.parent_test_name}
                  </span>
                )}
                {t.sub_test_count > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 mt-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors w-fit"
                      >
                        <FlaskConical className="h-3 w-3" /> {t.sub_test_count} parameters
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start" className="w-72 p-0">
                      <ScrollArea className="max-h-[60vh]">
                        <div className="p-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.name} — Parameters</p>
                          <ul className="space-y-0.5">
                            {(t.sub_test_names as string[] ?? []).map((sn: string) => (
                              <li key={sn} className="text-[11px] text-muted-foreground flex items-center gap-1.5 py-0.5">
                                <span className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                                {sn}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                )}
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t.report_time}</span>
                  <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> {t.sample_type}</span>
                  {t.fasting_required && <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" /> Fasting</span>}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    {t.original_price && t.original_price > t.price && (
                      <span className="text-sm text-muted-foreground line-through">₹{t.original_price}</span>
                    )}
                    <span className="font-display text-xl font-bold text-primary">₹{t.price}</span>
                  </div>
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
