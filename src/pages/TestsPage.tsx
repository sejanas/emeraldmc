import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Clock, Droplets, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionHeading from "@/components/SectionHeading";
import { api } from "@/lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 } as const,
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

const TestsPage = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tests, setTests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/tests?active=true"),
      api.get("/categories"),
    ]).then(([t, c]) => {
      setTests(t);
      setCategories(c);
    });
  }, []);

  const catName = (id: string | null) => categories.find((c: any) => c.id === id)?.name ?? "Other";

  const filtered = tests.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || catName(t.category_id) === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="container py-12">
      <SectionHeading title="Diagnostic Tests" subtitle="Browse our comprehensive range of diagnostic tests with transparent pricing" />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", ...categories.map((c: any) => c.name)].map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${category === c ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}
            >{c}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t, i) => (
          <motion.div key={t.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
            className="rounded-xl border border-border bg-card p-5 transition-shadow hover:card-shadow-hover">
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
      {filtered.length === 0 && <p className="py-12 text-center text-muted-foreground">No tests found matching your criteria.</p>}
    </div>
  );
};

export default TestsPage;
