import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import {
  BarChart3, MapPin, List, ChevronLeft, ChevronRight, Trash2, ChevronsUpDown, Check,
  CalendarIcon, Globe, Eye, TrendingUp, Download, Monitor, ArrowLeftRight, Zap,
} from "lucide-react";
import {
  useVisitorAnalytics, useVisitorLocations, useVisitorDaily, useVisitorFilters,
  useVisitorCleanup, useVisitorDevices, useVisitorBounce, useVisitorLive,
} from "@/hooks/useVisitors";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import { useConfirm } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const PIE_COLORS = [
  "hsl(var(--primary))", "#14b8a6", "#f59e0b", "#6366f1", "#ec4899",
  "#8b5cf6", "#ef4444", "#22c55e", "#3b82f6", "#a855f7",
];

const COUNTRY_COORDS: Record<string, [number, number]> = {
  India: [78.96, 20.59], "United States": [-95.71, 37.09], Canada: [-106.35, 56.13],
  China: [104.20, 35.86], Germany: [10.45, 51.17], France: [2.21, 46.23],
  "United Kingdom": [-3.44, 55.38], Australia: [133.78, -25.27], Japan: [138.25, 36.20],
  Brazil: [-51.93, -14.24], Russia: [105.32, 61.52], Poland: [19.15, 51.92],
  Romania: [24.97, 45.94], Netherlands: [5.29, 52.13], "The Netherlands": [5.29, 52.13],
  Estonia: [25.01, 58.60], Mexico: [-102.55, 23.63], Indonesia: [113.92, -0.79],
  "South Korea": [127.77, 35.91], Singapore: [103.82, 1.35], Malaysia: [101.98, 4.21],
  Thailand: [100.99, 15.87], Philippines: [121.77, 12.88], Vietnam: [108.28, 14.06],
  "South Africa": [22.94, -30.56], Nigeria: [8.68, 9.08], Kenya: [37.91, -0.02],
  Egypt: [30.80, 26.82], "Saudi Arabia": [45.08, 23.89], "United Arab Emirates": [53.85, 23.42],
  Turkey: [35.24, 38.96], Italy: [12.57, 41.87], Spain: [3.75, 40.46],
  Sweden: [18.64, 60.13], Norway: [8.47, 60.47], Denmark: [9.50, 56.26],
  Finland: [25.75, 61.92], Ireland: [-8.24, 53.41], Switzerland: [8.23, 46.82],
  Austria: [14.55, 47.52], Belgium: [4.47, 50.50], Portugal: [-8.22, 40.00],
  Greece: [21.82, 39.07], Argentina: [-63.62, -38.42], Colombia: [-74.30, 4.57],
  Pakistan: [69.35, 30.38], Bangladesh: [90.36, 23.69], "Sri Lanka": [80.77, 7.87],
  Nepal: [84.12, 28.39], Israel: [34.85, 31.05], Ukraine: [31.17, 48.38],
  "New Zealand": [174.89, -40.90],
};

const DATE_PRESETS: { label: string; days: number | null }[] = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: null },
  { label: "Custom", days: -1 },
];

function getFromDate(days: number | null): string | undefined {
  if (!days) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10) + "T00:00:00.000Z";
}

const PAGE_SIZE = 50;

/* ---------- CSV Export ---------- */
function downloadCsv(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const s = String(r[h] ?? "");
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- World Map ---------- */
function VisitorMap({ locations }: { locations: { country: string; count: number }[] }) {
  const markers = useMemo(() => {
    const byCountry: Record<string, number> = {};
    locations.forEach((l) => {
      if (l.country !== "Unknown") byCountry[l.country] = (byCountry[l.country] || 0) + l.count;
    });
    const maxCount = Math.max(1, ...Object.values(byCountry));
    return Object.entries(byCountry)
      .filter(([c]) => COUNTRY_COORDS[c])
      .map(([country, count]) => ({
        country,
        count,
        coordinates: COUNTRY_COORDS[country] as [number, number],
        radius: Math.max(4, Math.min(20, (count / maxCount) * 20)),
      }));
  }, [locations]);

  return (
    <ComposableMap projectionConfig={{ scale: 147 }} className="w-full h-[400px]">
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              className="fill-muted stroke-border"
              style={{ default: { outline: "none" }, hover: { outline: "none", fill: "hsl(var(--accent))" }, pressed: { outline: "none" } }}
            />
          ))
        }
      </Geographies>
      {markers.map(({ country, count, coordinates, radius }) => (
        <Marker key={country} coordinates={coordinates}>
          <circle r={radius} className="fill-primary/70 stroke-primary" strokeWidth={1} />
          <title>{`${country}: ${count} visits`}</title>
        </Marker>
      ))}
    </ComposableMap>
  );
}

/* ---------- Searchable Combobox ---------- */
function FilterCombobox({
  label,
  placeholder,
  value,
  options,
  onSelect,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-[140px]">
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="h-8 w-full justify-between text-xs font-normal">
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0" align="start">
          <Command filter={(val, search) => val.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
            <CommandInput placeholder={`Search ${label.toLowerCase()}…`} className="h-9" />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="__all__" onSelect={() => { onSelect(""); setOpen(false); }}>
                  <Check className={cn("mr-2 h-3.5 w-3.5", !value ? "opacity-100" : "opacity-0")} />
                  {placeholder}
                </CommandItem>
                {options.map((o) => (
                  <CommandItem key={o} value={o} onSelect={() => { onSelect(o); setOpen(false); }}>
                    <Check className={cn("mr-2 h-3.5 w-3.5", value === o ? "opacity-100" : "opacity-0")} />
                    {o}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ---------- Date Picker Popover ---------- */
function DatePicker({ label, value, onChange }: { label: string; value: Date | undefined; onChange: (d: Date | undefined) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("h-8 w-[130px] justify-start text-xs font-normal", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-1.5 h-3 w-3" />
            {value ? format(value, "MMM dd, yyyy") : "Pick date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={(d) => { onChange(d); setOpen(false); }} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const AdminVisitors = () => {
  const { profile } = useAuth();
  const { canAccess } = useFeaturePermissions();
  const confirm = useConfirm();
  const { toast } = useToast();
  const cleanupMutation = useVisitorCleanup();
  const [datePreset, setDatePreset] = useState(1);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  const [country, setCountry] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [page, setPage] = useState<string>("");
  const [logOffset, setLogOffset] = useState(0);
  const [compareEnabled, setCompareEnabled] = useState(false);

  const isCustom = DATE_PRESETS[datePreset].days === -1;

  const from = useMemo(() => {
    if (isCustom) return customFrom ? customFrom.toISOString().slice(0, 10) + "T00:00:00.000Z" : undefined;
    return getFromDate(DATE_PRESETS[datePreset].days);
  }, [datePreset, isCustom, customFrom]);

  const to = useMemo(() => {
    if (isCustom && customTo) return customTo.toISOString().slice(0, 10) + "T23:59:59.999Z";
    return undefined;
  }, [isCustom, customTo]);

  // Comparison: previous period of same length
  const compFrom = useMemo(() => {
    const days = DATE_PRESETS[datePreset].days;
    if (!days || days < 0 || !compareEnabled) return undefined;
    const d = new Date();
    d.setDate(d.getDate() - days * 2);
    return d.toISOString().slice(0, 10) + "T00:00:00.000Z";
  }, [datePreset, compareEnabled]);
  const compTo = useMemo(() => {
    if (!compareEnabled) return undefined;
    return from;
  }, [from, compareEnabled]);

  const filtersQuery = useVisitorFilters();
  const filterOpts = filtersQuery.data ?? { countries: [], regions: [], cities: [], pages: [] };

  const dailyQuery = useVisitorDaily({ from, to, country: country || undefined, page: page || undefined });
  const compDailyQuery = useVisitorDaily({ from: compFrom, to: compTo, country: country || undefined, page: page || undefined });
  const locationsQuery = useVisitorLocations({ from, to, country: country || undefined });
  const analyticsQuery = useVisitorAnalytics({
    from, to,
    country: country || undefined, region: region || undefined,
    city: city || undefined, page: page || undefined,
    limit: PAGE_SIZE, offset: logOffset,
  });
  const devicesQuery = useVisitorDevices({ from, to });
  const bounceQuery = useVisitorBounce({ from, to });
  const liveQuery = useVisitorLive(60);

  // Summary stats
  const totalVisits = useMemo(() => (locationsQuery.data ?? []).reduce((s, l) => s + l.count, 0), [locationsQuery.data]);
  const uniqueCountries = useMemo(() => new Set((locationsQuery.data ?? []).map((l) => l.country).filter((c) => c !== "Unknown")).size, [locationsQuery.data]);
  const topCity = useMemo(() => {
    const locs = (locationsQuery.data ?? []).filter((l) => l.city !== "Unknown");
    return locs.length > 0 ? locs[0] : null;
  }, [locationsQuery.data]);

  // Comparison chart data
  const comparisonChartData = useMemo(() => {
    if (!compareEnabled || !compDailyQuery.data || !dailyQuery.data) return null;
    const current = dailyQuery.data;
    const previous = compDailyQuery.data;
    const maxLen = Math.max(current.length, previous.length);
    const merged = [];
    for (let i = 0; i < maxLen; i++) {
      merged.push({
        day: i + 1,
        current: current[i]?.count ?? 0,
        previous: previous[i]?.count ?? 0,
        currentDate: current[i]?.date ?? "",
        previousDate: previous[i]?.date ?? "",
      });
    }
    return merged;
  }, [compareEnabled, dailyQuery.data, compDailyQuery.data]);

  const chartConfig = {
    count: { label: "Visits", color: "hsl(var(--primary))" },
    current: { label: "Current", color: "hsl(var(--primary))" },
    previous: { label: "Previous", color: "hsl(var(--muted-foreground))" },
  };

  if (!canAccess("visitors", profile?.role)) return <Navigate to="/admin" replace />;

  const isSuperAdmin = profile?.role === "super_admin";

  const resetFilters = () => {
    setCountry(""); setRegion(""); setCity(""); setPage("");
    setLogOffset(0); setCustomFrom(undefined); setCustomTo(undefined);
    setDatePreset(1); setCompareEnabled(false);
  };

  const handleCleanup = async (mode: "no_geo" | "before") => {
    const title = mode === "no_geo"
      ? "Delete Unknown Location Records"
      : "Delete Old Records";
    const description = mode === "no_geo"
      ? "This will permanently delete all visitor records with unknown/missing location data. This action cannot be undone."
      : "This will permanently delete all visitor records before the currently selected date range. This action cannot be undone.";

    const { confirmed } = await confirm({ title, description, variant: "destructive", confirmLabel: "Delete" });
    if (!confirmed) return;

    try {
      const filters: { no_geo?: boolean; before?: string } = {};
      if (mode === "no_geo") filters.no_geo = true;
      if (mode === "before" && from) filters.before = from;
      const res = await cleanupMutation.mutateAsync(filters);
      toast({ title: `Deleted ${res.deleted} record(s)` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleExportCsv = () => {
    const rows = analyticsQuery.data?.data ?? [];
    if (!rows.length) { toast({ title: "No data to export" }); return; }
    const mapped = rows.map((v) => ({
      Page: v.page, City: v.city ?? "", Region: v.region ?? "",
      Country: v.country ?? "", Referrer: v.referrer ?? "", "Visited At": v.visited_at,
    }));
    downloadCsv(mapped, `visitors-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: `Exported ${rows.length} rows` });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">Visitor Analytics</h1>
          {(liveQuery.data?.count ?? 0) > 0 && (
            <Badge variant="secondary" className="gap-1 animate-pulse">
              <Zap className="h-3 w-3" />
              {liveQuery.data!.count} in last hour
            </Badge>
          )}
        </div>
        {isSuperAdmin && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs gap-1.5"
              onClick={() => handleCleanup("no_geo")}
              disabled={cleanupMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Unknown
            </Button>
            {from && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs gap-1.5"
                onClick={() => handleCleanup("before")}
                disabled={cleanupMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Before Range
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalVisits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Visits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{uniqueCountries}</p>
                <p className="text-xs text-muted-foreground">Countries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold truncate">{topCity?.city || "—"}</p>
                <p className="text-xs text-muted-foreground">Top City</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{bounceQuery.data ? `${bounceQuery.data.bounce_rate}%` : "—"}</p>
                <p className="text-xs text-muted-foreground">Bounce Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{liveQuery.data?.count ?? 0}</p>
                <p className="text-xs text-muted-foreground">Last Hour</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            {isCustom && (
              <>
                <DatePicker label="From" value={customFrom} onChange={(d) => { setCustomFrom(d); setLogOffset(0); }} />
                <DatePicker label="To" value={customTo} onChange={(d) => { setCustomTo(d); setLogOffset(0); }} />
              </>
            )}
            <FilterCombobox
              label="Country"
              placeholder="All countries"
              value={country}
              options={filterOpts.countries}
              onSelect={(v) => { setCountry(v); setRegion(""); setCity(""); setLogOffset(0); }}
            />
            <FilterCombobox
              label="Region"
              placeholder="All regions"
              value={region}
              options={filterOpts.regions}
              onSelect={(v) => { setRegion(v); setCity(""); setLogOffset(0); }}
            />
            <FilterCombobox
              label="City"
              placeholder="All cities"
              value={city}
              options={filterOpts.cities}
              onSelect={(v) => { setCity(v); setLogOffset(0); }}
            />
            <FilterCombobox
              label="Page"
              placeholder="All pages"
              value={page}
              options={filterOpts.pages}
              onSelect={(v) => { setPage(v); setLogOffset(0); }}
            />
            <Button size="sm" variant="ghost" onClick={resetFilters} className="text-xs">Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trends">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="trends" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Trends</TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5"><Globe className="h-3.5 w-3.5" />Map</TabsTrigger>
          <TabsTrigger value="locations" className="gap-1.5"><MapPin className="h-3.5 w-3.5" />Locations</TabsTrigger>
          <TabsTrigger value="devices" className="gap-1.5"><Monitor className="h-3.5 w-3.5" />Devices</TabsTrigger>
          <TabsTrigger value="log" className="gap-1.5"><List className="h-3.5 w-3.5" />Log</TabsTrigger>
        </TabsList>

        {/* TRENDS TAB */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Daily Visits</CardTitle>
                {!isCustom && DATE_PRESETS[datePreset].days && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="compare-toggle" className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                      <ArrowLeftRight className="h-3.5 w-3.5" /> Compare previous period
                    </label>
                    <Switch id="compare-toggle" checked={compareEnabled} onCheckedChange={setCompareEnabled} />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {dailyQuery.isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
              ) : (dailyQuery.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No data for selected period</p>
              ) : compareEnabled && comparisonChartData ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={comparisonChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} label={{ value: "Day #", position: "insideBottom", offset: -2, fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <ChartTooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                          <p className="font-medium mb-1">Day {d.day}</p>
                          <p style={{ color: "hsl(var(--primary))" }}>Current: {d.current} <span className="text-muted-foreground">({d.currentDate})</span></p>
                          <p style={{ color: "hsl(var(--muted-foreground))" }}>Previous: {d.previous} <span className="text-muted-foreground">({d.previousDate})</span></p>
                        </div>
                      );
                    }} />
                    <Area type="monotone" dataKey="previous" fill="hsl(var(--muted-foreground) / 0.1)" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="current" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
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

        {/* MAP TAB */}
        <TabsContent value="map">
          <Card>
            <CardHeader><CardTitle className="text-base">World Map</CardTitle></CardHeader>
            <CardContent>
              {locationsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
              ) : (
                <VisitorMap locations={(locationsQuery.data ?? []).map((l) => ({ country: l.country, count: l.count }))} />
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

        {/* DEVICES TAB */}
        <TabsContent value="devices">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Browsers</CardTitle></CardHeader>
              <CardContent>
                {devicesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
                ) : !devicesQuery.data?.browsers?.length ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={devicesQuery.data.browsers} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                          {devicesQuery.data.browsers.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [v, "Visits"]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Operating Systems</CardTitle></CardHeader>
              <CardContent>
                {devicesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
                ) : !devicesQuery.data?.os?.length ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={devicesQuery.data.os} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                          {devicesQuery.data.os.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [v, "Visits"]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LOG TAB */}
        <TabsContent value="log">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Visitor Log</CardTitle>
                <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={handleExportCsv} disabled={!(analyticsQuery.data?.data?.length)}>
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
              </div>
            </CardHeader>
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
