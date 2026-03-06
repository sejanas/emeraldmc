import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FlaskConical, Package, Users, Image, List, Eye } from "lucide-react";

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ categories: 0, tests: 0, packages: 0, doctors: 0, gallery: 0, visitors: 0 });

  useEffect(() => {
    const load = async () => {
      const [c, t, p, d, g, v] = await Promise.all([
        supabase.from("test_categories").select("id", { count: "exact", head: true }),
        supabase.from("tests").select("id", { count: "exact", head: true }),
        supabase.from("packages").select("id", { count: "exact", head: true }),
        supabase.from("doctors").select("id", { count: "exact", head: true }),
        supabase.from("gallery").select("id", { count: "exact", head: true }),
        supabase.from("visitors").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        categories: c.count ?? 0, tests: t.count ?? 0, packages: p.count ?? 0,
        doctors: d.count ?? 0, gallery: g.count ?? 0, visitors: v.count ?? 0,
      });
    };
    load();
  }, []);

  const cards = [
    { label: "Categories", count: counts.categories, icon: List },
    { label: "Tests", count: counts.tests, icon: FlaskConical },
    { label: "Packages", count: counts.packages, icon: Package },
    { label: "Doctors", count: counts.doctors, icon: Users },
    { label: "Gallery", count: counts.gallery, icon: Image },
    { label: "Visitors", count: counts.visitors, icon: Eye },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 card-shadow">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="font-display text-2xl font-bold text-foreground">{c.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
