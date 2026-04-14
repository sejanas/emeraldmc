import { useState, useMemo, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import {
  BarChart3, MapPin, List, ChevronLeft, ChevronRight, Trash2, ChevronsUpDown, Check,
  CalendarIcon, Globe, Eye, TrendingUp, Download, Monitor, ArrowLeftRight, Zap,
  ZoomIn, ZoomOut, RotateCcw, FileText, GitBranch, Megaphone, Clock, Plus, X, Archive,
} from "lucide-react";
import {
  useVisitorAnalytics, useVisitorLocations, useVisitorDaily, useVisitorFilters,
  useVisitorCleanup, useVisitorDevices, useVisitorBounce, useVisitorLive,
  useVisitorUtm, useVisitorFunnel, useVisitorAnnotations, useVisitorAnnotationsMutation,
  useVisitorAnnotationDelete, useVisitorArchive,
} from "@/hooks/useVisitors";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import { useConfirm } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ComposableMap, Geographies, Geography, Marker, Graticule, ZoomableGroup } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const PIE_COLORS = [
  "hsl(var(--primary))", "#14b8a6", "#f59e0b", "#6366f1", "#ec4899",
  "#8b5cf6", "#ef4444", "#22c55e", "#3b82f6", "#a855f7",
];

/* Map GeoJSON names → geolocation API names (ip-api.com) */
const GEO_TO_API: Record<string, string> = {
  "United States of America": "United States",
  "The Netherlands": "Netherlands",
  "Czechia": "Czech Republic",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Dominican Rep.": "Dominican Republic",
  "Central African Rep.": "Central African Republic",
  "Dem. Rep. Congo": "Democratic Republic of the Congo",
  "S. Sudan": "South Sudan",
  "eSwatini": "Eswatini",
  "W. Sahara": "Western Sahara",
  "Eq. Guinea": "Equatorial Guinea",
  "N. Cyprus": "Northern Cyprus",
  "Solomon Is.": "Solomon Islands",
  "Falkland Is.": "Falkland Islands",
  "Fr. S. Antarctic Lands": "French Southern Territories",
  "Macedonia": "North Macedonia",
  "Lao PDR": "Laos",
  "Côte d'Ivoire": "Ivory Coast",
};

/* Comprehensive country centroid coordinates [lon, lat] for marker labels */
const COUNTRY_COORDS: Record<string, [number, number]> = {
  India: [78.96, 20.59], "United States": [-95.71, 37.09], Canada: [-106.35, 56.13],
  China: [104.20, 35.86], Germany: [10.45, 51.17], France: [2.21, 46.23],
  "United Kingdom": [-3.44, 55.38], Australia: [133.78, -25.27], Japan: [138.25, 36.20],
  Brazil: [-51.93, -14.24], Russia: [105.32, 61.52], Poland: [19.15, 51.92],
  Romania: [24.97, 45.94], Netherlands: [5.29, 52.13],
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
  "New Zealand": [174.89, -40.90], Peru: [-75.02, -9.19], Chile: [-71.54, -35.68],
  Venezuela: [-66.59, 6.42], Ecuador: [-78.18, -1.83], Bolivia: [-63.59, -16.29],
  Paraguay: [-58.44, -23.44], Uruguay: [-55.77, -32.52], Cuba: [-77.78, 21.52],
  "Costa Rica": [-83.75, 9.75], Panama: [-80.78, 8.54], Jamaica: [-77.30, 18.11],
  Guatemala: [-90.23, 15.78], Honduras: [-86.24, 15.20], "El Salvador": [-88.90, 13.79],
  Nicaragua: [-85.21, 12.87], "Dominican Republic": [-70.16, 18.74],
  "Czech Republic": [15.47, 49.82], Slovakia: [19.70, 48.67], Hungary: [19.50, 47.16],
  Croatia: [15.20, 45.10], Serbia: [21.01, 44.02], Bulgaria: [25.49, 42.73],
  Slovenia: [14.90, 46.15], Lithuania: [23.88, 55.17], Latvia: [24.60, 56.88],
  Belarus: [27.95, 53.71], Moldova: [28.37, 47.41], Albania: [20.17, 41.15],
  "North Macedonia": [21.75, 41.51], "Bosnia and Herzegovina": [17.68, 43.92],
  Montenegro: [19.37, 42.71], Kosovo: [20.90, 42.60], Iceland: [-19.02, 64.96],
  Morocco: [-7.09, 31.79], Algeria: [1.66, 28.03], Tunisia: [9.54, 33.89],
  Libya: [17.23, 26.34], Sudan: [30.22, 12.86], "South Sudan": [31.31, 6.88],
  Ethiopia: [40.49, 9.15], Somalia: [46.20, 5.15], Tanzania: [34.89, -6.37],
  Uganda: [32.29, 1.37], Rwanda: [29.87, -1.94], Mozambique: [35.53, -18.67],
  Zimbabwe: [29.15, -19.02], Botswana: [24.68, -22.33], Namibia: [18.49, -22.96],
  Angola: [17.87, -11.20], "Democratic Republic of the Congo": [21.76, -4.04],
  Congo: [15.83, -0.23], Cameroon: [12.35, 7.37], Ghana: [-1.02, 7.95],
  "Ivory Coast": [-5.55, 7.54], Senegal: [-14.45, 14.50], Mali: [-3.00, 17.57],
  "Burkina Faso": [-1.56, 12.24], Niger: [8.08, 17.61], Chad: [18.73, 15.45],
  Madagascar: [46.87, -18.77], Zambia: [28.31, -13.13], Malawi: [34.30, -13.25],
  "Central African Republic": [20.94, 6.61], Gabon: [11.61, -0.80],
  "Equatorial Guinea": [10.27, 1.65], Benin: [2.32, 9.31], Togo: [0.82, 8.62],
  "Sierra Leone": [-11.78, 8.46], Liberia: [-9.43, 6.43], Guinea: [-9.70, 9.95],
  "Guinea-Bissau": [-15.18, 12.00], Gambia: [-15.31, 13.44], Mauritania: [-10.94, 21.01],
  Eritrea: [39.78, 15.18], Djibouti: [42.59, 11.83],
  Iran: [53.69, 32.43], Iraq: [43.68, 33.22], Afghanistan: [67.71, 33.94],
  Uzbekistan: [64.59, 41.38], Kazakhstan: [66.92, 48.02], Turkmenistan: [58.24, 38.97],
  Tajikistan: [71.28, 38.86], Kyrgyzstan: [74.77, 41.20], Azerbaijan: [47.58, 40.14],
  Georgia: [43.36, 42.32], Armenia: [45.04, 40.07], Jordan: [36.24, 30.59],
  Lebanon: [35.86, 33.85], Syria: [38.99, 34.80], Kuwait: [47.48, 29.31],
  Qatar: [51.18, 25.35], Bahrain: [50.56, 26.07], Oman: [55.92, 21.51],
  Yemen: [48.52, 15.55], Myanmar: [96.68, 19.76], Cambodia: [104.99, 12.57],
  Laos: [102.50, 19.86], Mongolia: [103.85, 46.86], "North Korea": [127.51, 40.34],
  Taiwan: [120.96, 23.75], Bhutan: [90.43, 27.51], Brunei: [114.73, 4.54],
  "Papua New Guinea": [143.96, -6.31], Fiji: [178.07, -17.71],
  "Trinidad and Tobago": [-61.22, 10.69], Cyprus: [33.43, 35.13],
  Luxembourg: [6.13, 49.82],
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

/* ---------- Choropleth color helpers ---------- */
const CHOROPLETH_STOPS = [
  "hsl(var(--muted))",       // 0 visits – base
  "hsl(152, 58%, 85%)",      // low
  "hsl(152, 68%, 65%)",      // mid-low
  "hsl(152, 76%, 42%)",      // mid
  "hsl(152, 82%, 30%)",      // mid-high
  "hsl(152, 90%, 18%)",      // high
];

function choroplethColor(count: number, maxCount: number): string {
  if (!count) return CHOROPLETH_STOPS[0];
  const ratio = count / maxCount;
  if (ratio <= 0.05) return CHOROPLETH_STOPS[1];
  if (ratio <= 0.15) return CHOROPLETH_STOPS[2];
  if (ratio <= 0.35) return CHOROPLETH_STOPS[3];
  if (ratio <= 0.65) return CHOROPLETH_STOPS[4];
  return CHOROPLETH_STOPS[5];
}

/* Resolve GeoJSON name → visitor-data country name */
function geoNameToApi(geoName: string): string {
  return GEO_TO_API[geoName] ?? geoName;
}

/* ---------- World Map ---------- */
const DEFAULT_CENTER: [number, number] = [0, 20];
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

function VisitorMap({ locations }: { locations: { country: string; count: number }[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.5)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.5)), []);
  const handleReset = useCallback(() => { setZoom(DEFAULT_ZOOM); setCenter(DEFAULT_CENTER); }, []);

  const { byCountry, maxCount, topMarkers } = useMemo(() => {
    const bc: Record<string, number> = {};
    locations.forEach((l) => {
      if (l.country !== "Unknown") bc[l.country] = (bc[l.country] || 0) + l.count;
    });
    const mc = Math.max(1, ...Object.values(bc));
    const sorted = Object.entries(bc).sort((a, b) => b[1] - a[1]);
    const top = sorted
      .slice(0, 5)
      .filter(([c]) => COUNTRY_COORDS[c])
      .map(([country, count]) => ({
        country,
        count,
        coordinates: COUNTRY_COORDS[country] as [number, number],
      }));
    return { byCountry: bc, maxCount: mc, topMarkers: top };
  }, [locations]);

  const handleMouseMove = useCallback(
    (country: string, count: number, e: React.MouseEvent) => {
      setTooltip({ x: e.clientX, y: e.clientY, text: `${country}: ${count.toLocaleString()} visits` });
    },
    [],
  );
  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <div className="relative">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 155 }}
        className="w-full h-[520px]"
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates); setZoom(z); }}
        >
          <Graticule className="stroke-border/30" />
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName = geo.properties.name as string;
                const apiName = geoNameToApi(geoName);
                const count = byCountry[apiName] ?? 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={choroplethColor(count, maxCount)}
                    className="stroke-border/60 cursor-pointer transition-colors"
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", opacity: 0.85 },
                      pressed: { outline: "none" },
                    }}
                    onMouseMove={(e: React.MouseEvent) =>
                      handleMouseMove(apiName, count, e)
                    }
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })
            }
          </Geographies>
          {topMarkers.map(({ country, count, coordinates }) => (
            <Marker key={country} coordinates={coordinates}>
              <text
                textAnchor="middle"
                className="fill-foreground text-[9px] font-semibold pointer-events-none"
                style={{ textShadow: "0 0 3px hsl(var(--background)), 0 0 3px hsl(var(--background))" }}
              >
                {country}
              </text>
              <text
                y={11}
                textAnchor="middle"
                className="fill-muted-foreground text-[8px] pointer-events-none"
                style={{ textShadow: "0 0 3px hsl(var(--background)), 0 0 3px hsl(var(--background))" }}
              >
                {count.toLocaleString()}
              </text>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur" onClick={handleZoomIn} disabled={zoom >= MAX_ZOOM}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur" onClick={handleZoomOut} disabled={zoom <= MIN_ZOOM}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 text-xs font-medium rounded-md bg-popover text-popover-foreground shadow-md border pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-background/80 backdrop-blur px-2 py-1 text-[10px] text-muted-foreground border">
        <span>Low</span>
        {CHOROPLETH_STOPS.slice(1).map((c, i) => (
          <div key={i} className="w-5 h-3 rounded-sm border border-border/40" style={{ background: c }} />
        ))}
        <span>High</span>
      </div>
    </div>
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
  const archiveMutation = useVisitorArchive();
  const annotationsMutation = useVisitorAnnotationsMutation();
  const annotationDelete = useVisitorAnnotationDelete();
  const [datePreset, setDatePreset] = useState(1);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  const [country, setCountry] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [page, setPage] = useState<string>("");
  const [logOffset, setLogOffset] = useState(0);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [annotationLabel, setAnnotationLabel] = useState("");
  const [annotationDate, setAnnotationDate] = useState("");

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
  const utmQuery = useVisitorUtm({ from, to });
  const funnelQuery = useVisitorFunnel({ from, to });
  const annotationsQuery = useVisitorAnnotations({ from, to });

  // Summary stats
  const totalVisits = useMemo(() => (locationsQuery.data ?? []).reduce((s, l) => s + l.count, 0), [locationsQuery.data]);
  const uniqueCountries = useMemo(() => new Set((locationsQuery.data ?? []).map((l) => l.country).filter((c) => c !== "Unknown")).size, [locationsQuery.data]);
  const topCity = useMemo(() => {
    const locs = (locationsQuery.data ?? []).filter((l) => l.city !== "Unknown");
    return locs.length > 0 ? locs[0] : null;
  }, [locationsQuery.data]);

  // Top pages from analytics log
  const pageBreakdown = useMemo(() => {
    const rows = analyticsQuery.data?.data ?? [];
    const counts: Record<string, number> = {};
    rows.forEach((r) => { counts[r.page] = (counts[r.page] || 0) + 1; });
    return Object.entries(counts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);
  }, [analyticsQuery.data]);

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

  const handleArchive = async () => {
    const { confirmed } = await confirm({
      title: "Archive Old Records",
      description: "This will permanently delete visitor records older than 90 days and refresh the aggregated stats. This action cannot be undone.",
      variant: "destructive",
      confirmLabel: "Archive",
    });
    if (!confirmed) return;
    try {
      const res = await archiveMutation.mutateAsync({ days_to_keep: 90 });
      toast({ title: `Archived ${res.deleted} old record(s)` });
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
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              onClick={handleArchive}
              disabled={archiveMutation.isPending}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive 90d+
            </Button>
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
          <TabsTrigger value="pages" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Pages</TabsTrigger>
          <TabsTrigger value="funnel" className="gap-1.5"><GitBranch className="h-3.5 w-3.5" />Funnel</TabsTrigger>
          <TabsTrigger value="utm" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" />UTM</TabsTrigger>
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
                    {(annotationsQuery.data ?? []).map((a) => (
                      <ReferenceLine key={a.id} x={comparisonChartData?.findIndex(d => d.currentDate === a.date) !== undefined ? comparisonChartData?.findIndex(d => d.currentDate === a.date) + 1 : undefined} stroke={a.color || "#ef4444"} strokeDasharray="4 2" label={{ value: a.label, position: "top", fontSize: 10, fill: a.color || "#ef4444" }} />
                    ))}
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
                    {(annotationsQuery.data ?? []).map((a) => (
                      <ReferenceLine key={a.id} x={a.date} stroke={a.color || "#ef4444"} strokeDasharray="4 2" label={{ value: a.label, position: "top", fontSize: 10, fill: a.color || "#ef4444" }} />
                    ))}
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Annotation Management */}
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Timeline Annotations</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Date</label>
                  <Input type="date" value={annotationDate} onChange={(e) => setAnnotationDate(e.target.value)} className="w-40 h-8 text-xs" />
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-xs text-muted-foreground">Label</label>
                  <Input placeholder="e.g. Campaign launched" value={annotationLabel} onChange={(e) => setAnnotationLabel(e.target.value)} className="h-8 text-xs" />
                </div>
                <Button size="sm" className="h-8" disabled={!annotationDate || !annotationLabel || annotationsMutation.create.isPending} onClick={async () => { await annotationsMutation.create.mutateAsync({ label: annotationLabel, date: annotationDate }); setAnnotationLabel(""); setAnnotationDate(""); }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {(annotationsQuery.data ?? []).length > 0 && (
                <div className="divide-y rounded-md border">
                  {(annotationsQuery.data ?? []).map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color || "#ef4444" }} />
                        <span className="text-muted-foreground">{a.date}</span>
                        <span>{a.label}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => annotationDelete.mutateAsync(a.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
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

        {/* PAGES TAB */}
        <TabsContent value="pages">
          <Card>
            <CardHeader><CardTitle className="text-base">Page Breakdown</CardTitle></CardHeader>
            <CardContent>
              {analyticsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
              ) : pageBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageBreakdown.map((p, i) => {
                      const pct = totalVisits > 0 ? ((p.count / totalVisits) * 100).toFixed(1) : "0";
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{p.page}</TableCell>
                          <TableCell className="text-right font-medium">{p.count}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{pct}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FUNNEL TAB */}
        <TabsContent value="funnel">
          <div className="grid gap-6">
            {funnelQuery.isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
            ) : !funnelQuery.data ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <p className="text-2xl font-bold">{funnelQuery.data.total_sessions.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Unique Sessions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Top Entry Pages</CardTitle></CardHeader>
                    <CardContent>
                      {funnelQuery.data.entry_pages.slice(0, 5).map((ep, i) => (
                        <div key={i} className="flex justify-between text-xs py-1 border-b last:border-0">
                          <span className="font-mono truncate max-w-[200px]">{ep.page}</span>
                          <span className="font-medium">{ep.count}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Duration by Page</CardTitle></CardHeader>
                    <CardContent>
                      {funnelQuery.data.page_stats.filter((p) => p.avg_duration_sec != null).slice(0, 5).map((ps, i) => (
                        <div key={i} className="flex justify-between text-xs py-1 border-b last:border-0">
                          <span className="font-mono truncate max-w-[200px]">{ps.page}</span>
                          <span className="font-medium flex items-center gap-1"><Clock className="h-3 w-3" />{ps.avg_duration_sec}s</span>
                        </div>
                      ))}
                      {funnelQuery.data.page_stats.filter((p) => p.avg_duration_sec != null).length === 0 && (
                        <p className="text-xs text-muted-foreground py-2">Duration data collecting…</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-base">Top Page Transitions</CardTitle></CardHeader>
                  <CardContent>
                    {funnelQuery.data.top_transitions.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Not enough multi-page sessions yet</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                            <TableHead className="text-right">Flow</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {funnelQuery.data.top_transitions.slice(0, 15).map((t, i) => {
                            const maxT = funnelQuery.data!.top_transitions[0]?.count || 1;
                            const pct = Math.round((t.count / maxT) * 100);
                            return (
                              <TableRow key={i}>
                                <TableCell className="font-mono text-xs">{t.from}</TableCell>
                                <TableCell className="font-mono text-xs">{t.to}</TableCell>
                                <TableCell className="text-right font-medium">{t.count}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="h-2 rounded-full bg-primary/60" style={{ width: `${Math.max(8, pct)}%`, maxWidth: 120 }} />
                                    <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* UTM TAB */}
        <TabsContent value="utm">
          <div className="grid md:grid-cols-3 gap-6">
            {utmQuery.isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center col-span-3">Loading…</p>
            ) : !utmQuery.data ? (
              <p className="text-sm text-muted-foreground py-8 text-center col-span-3">No data</p>
            ) : (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-base">Traffic Sources</CardTitle></CardHeader>
                  <CardContent>
                    {utmQuery.data.sources.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4">No source data</p>
                    ) : (
                      <div className="space-y-2">
                        {utmQuery.data.sources.slice(0, 10).map((s, i) => {
                          const maxS = utmQuery.data!.sources[0]?.count || 1;
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="truncate font-medium">{s.name}</span>
                                <span className="text-muted-foreground">{s.count}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-primary/70" style={{ width: `${(s.count / maxS) * 100}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Mediums</CardTitle></CardHeader>
                  <CardContent>
                    {utmQuery.data.mediums.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4">No medium data — add <code className="text-[10px]">?utm_medium=</code> to links</p>
                    ) : (
                      <div className="space-y-2">
                        {utmQuery.data.mediums.slice(0, 10).map((m, i) => {
                          const maxM = utmQuery.data!.mediums[0]?.count || 1;
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="truncate font-medium">{m.name}</span>
                                <span className="text-muted-foreground">{m.count}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-teal-500/70" style={{ width: `${(m.count / maxM) * 100}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Campaigns</CardTitle></CardHeader>
                  <CardContent>
                    {utmQuery.data.campaigns.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4">No campaign data — add <code className="text-[10px]">?utm_campaign=</code> to links</p>
                    ) : (
                      <div className="space-y-2">
                        {utmQuery.data.campaigns.slice(0, 10).map((c, i) => {
                          const maxC = utmQuery.data!.campaigns[0]?.count || 1;
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="truncate font-medium">{c.name}</span>
                                <span className="text-muted-foreground">{c.count}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-amber-500/70" style={{ width: `${(c.count / maxC) * 100}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
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
