import useDashboardCounts from "@/hooks/useDashboardCounts";
import { FlaskConical, Package, Users, Image, List, Eye, CalendarCheck, HelpCircle, MapPin } from "lucide-react";

const AdminDashboard = () => {
  const countsQuery = useDashboardCounts();
  const counts = countsQuery.data ?? { categories: 0, tests: 0, packages: 0, doctors: 0, gallery: 0, visitors: 0, bookings: 0, faqs: 0, visitors_today: 0, top_locations: [] };

  const cards = [
    { label: "Categories", count: counts.categories, icon: List },
    { label: "Tests", count: counts.tests, icon: FlaskConical },
    { label: "Packages", count: counts.packages, icon: Package },
    { label: "Doctors", count: counts.doctors, icon: Users },
    { label: "Gallery", count: counts.gallery, icon: Image },
    { label: "FAQs", count: counts.faqs, icon: HelpCircle },
    { label: "Bookings", count: counts.bookings, icon: CalendarCheck },
    { label: "Total Visitors", count: counts.visitors, icon: Eye },
    { label: "Today's Visitors", count: counts.visitors_today, icon: Eye },
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
                {countsQuery.isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted mt-1" />
                ) : (
                  <p className="font-display text-2xl font-bold text-foreground">{c.count}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Locations */}
      {(counts.top_locations?.length ?? 0) > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Top Locations
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Location</th>
                  <th className="text-right px-4 py-2 text-muted-foreground font-medium">Visits</th>
                </tr>
              </thead>
              <tbody>
                {counts.top_locations.map((loc: any, i: number) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      {[loc.city, loc.region, loc.country].filter(Boolean).join(", ")}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">{loc.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
