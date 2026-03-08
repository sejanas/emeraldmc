import { useState, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { BarChart3, MapPin, List, ChevronLeft, ChevronRight } from "lucide-react";
import { useVisitorAnalytics, useVisitorLocations, useVisitorDaily, useVisitorFilters } from "@/hooks/useVisitors";

const DATE_PRESETS: { label: string; days: number | null }[] = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: null },
];

function getFromDate(days: number | null): string | undefined {
  if (!days) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - days);
  // Truncate to start of day so value is stable across renders
  return d.toISOString().slice(0, 10) + "T00:00:00.000Z";
}

const PAGE_SIZE = 50;

const AdminVisitors = () => {
  const [datePreset, setDatePreset] = useState(1); // 30 days default
  const [country, setCountry] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [page, setPage] = useState<string>("");
  const [logOffset, setLogOffset] = useState(0);

  const from = useMemo(() => getFromDate(DATE_PRESETS[datePreset].days), [datePreset]);

  const filtersQuery = useVisitorFilters();
  const filterOpts = filtersQuery.data ?? { countries: [], regions: [], cities: [], pages: [] };

  // Filter regions/cities based on selected country
  const filteredRegions = useMemo(() => {
    if (!country) return filterOpts.regions;
    // Can't filter server-side dependency, show all for now
    return filterOpts.regions;
  }, [country, filterOpts.regions]);

  const dailyQuery = useVisitorDaily({ from, country: country || undefined, page: page || undefined });
  const locationsQuery = useVisitorLocations({ from, country: country || undefined });
  const analyticsQuery = useVisitorAnalytics({
    from,
    country: country || undefined,
    region: region || undefined,
    city: city || undefined,
    page: page || undefined,
    limit: PAGE_SIZE,
    offset: logOffset,
  });

  const chartConfig = {
    count: { label: "Visits", color: "hsl(var(--primary))" },
  };

  const resetFilters = () => {
    setCountry("");
    setRegion("");
    setCity("");
    setPage("");
    setLogOffset(0);
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Visitor Analytics</h1>

      {/* Global Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date Range</label>
              <div className="flex gap-1">
                {DATE_PRESETS.map((p, i) => (
                  <Button
                    key={p.label}
                    size="sm"
                    variant={datePreset === i ? "default" : "outline"}
                    onClick={() => { setDatePreset(i); setLogOffset(0); }}
                    className="text-xs"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">Country</label>
              <Select value={country} onValueChange={(v) => { setCountry(v === "__all__" ? "" : v); setRegion(""); setCity(""); setLogOffset(0); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All countries" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All countries</SelectItem>
                  {filterOpts.countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[130px]">
              <label className="text-xs text-muted-foreground mb-1 block">Region</label>
              <Select value={region} onValueChange={(v) => { setRegion(v === "__all__" ? "" : v); setCity(""); setLogOffset(0); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All regions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All regions</SelectItem>
                  {filteredRegions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[130px]">
              <label className="text-xs text-muted-foreground mb-1 block">City</label>
              <Select value={city} onValueChange={(v) => { setCity(v === "__all__" ? "" : v); setLogOffset(0); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All cities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All cities</SelectItem>
                  {filterOpts.cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[130px]">
              <label className="text-xs text-muted-foreground mb-1 block">Page</label>
              <Select value={page} onValueChange={(v) => { setPage(v === "__all__" ? "" : v); setLogOffset(0); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All pages" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All pages</SelectItem>
                  {filterOpts.pages.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="ghost" onClick={resetFilters} className="text-xs">Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trends">
        <TabsList className="mb-4">
          <TabsTrigger value="trends" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Trends</TabsTrigger>
          <TabsTrigger value="locations" className="gap-1.5"><MapPin className="h-3.5 w-3.5" />Locations</TabsTrigger>
          <TabsTrigger value="log" className="gap-1.5"><List className="h-3.5 w-3.5" />Log</TabsTrigger>
        </TabsList>

        {/* TRENDS TAB */}
        <TabsContent value="trends">
          <Card>
            <CardHeader><CardTitle className="text-base">Daily Visits</CardTitle></CardHeader>
            <CardContent>
              {dailyQuery.isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
              ) : (dailyQuery.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No data for selected period</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={dailyQuery.data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} className="text-muted-foreground" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="count" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOCATIONS TAB */}
        <TabsContent value="locations">
          <Card>
            <CardHeader><CardTitle className="text-base">Visits by Location</CardTitle></CardHeader>
            <CardContent>
              {locationsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(locationsQuery.data ?? []).length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                    ) : (
                      (locationsQuery.data ?? []).map((loc, i) => (
                        <TableRow key={i}>
                          <TableCell>{loc.country}</TableCell>
                          <TableCell>{loc.region}</TableCell>
                          <TableCell>{loc.city}</TableCell>
                          <TableCell className="text-right font-medium">{loc.count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOG TAB */}
        <TabsContent value="log">
          <Card>
            <CardHeader><CardTitle className="text-base">Visitor Log</CardTitle></CardHeader>
            <CardContent>
              {analyticsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Page</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Referrer</TableHead>
                          <TableHead>Visited At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(analyticsQuery.data?.data ?? []).length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                        ) : (
                          (analyticsQuery.data?.data ?? []).map((v) => (
                            <TableRow key={v.id}>
                              <TableCell className="font-mono text-xs">{v.page}</TableCell>
                              <TableCell className="text-xs">
                                {[v.city, v.region, v.country].filter(Boolean).join(", ") || "—"}
                              </TableCell>
                              <TableCell className="text-xs max-w-[200px] truncate">{v.referrer || "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">
                                {new Date(v.visited_at).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-muted-foreground">
                      Showing {logOffset + 1}–{logOffset + (analyticsQuery.data?.data?.length ?? 0)}
                    </p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" disabled={logOffset === 0} onClick={() => setLogOffset(Math.max(0, logOffset - PAGE_SIZE))}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={(analyticsQuery.data?.data?.length ?? 0) < PAGE_SIZE} onClick={() => setLogOffset(logOffset + PAGE_SIZE)}>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVisitors;
