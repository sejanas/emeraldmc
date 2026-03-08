import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileDown, Search, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  sample_collected: "Sample Collected",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  sample_collected: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

interface BookingResult {
  id: string;
  patient_name: string;
  phone: string;
  patient_id: string | null;
  preferred_date: string;
  preferred_time: string;
  status: string;
  selected_tests: string[] | null;
  selected_package: string | null;
  created_at: string;
}

const ReportsPage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ patientId: "", mobile: "" });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BookingResult[] | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mobile.trim()) {
      toast({ title: "Please enter your mobile number", variant: "destructive" });
      return;
    }
    const cleanPhone = form.mobile.replace(/\D/g, "").slice(-10);
    if (!/^\d{10}$/.test(cleanPhone)) {
      toast({ title: "Please enter a valid 10-digit mobile number", variant: "destructive" });
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      params.set("phone", form.mobile.trim());
      if (form.patientId.trim()) params.set("patient_id", form.patientId.trim());
      const data = await api.get<BookingResult[]>(`/bookings/track?${params.toString()}`);
      setResults(data ?? []);
      if (!data?.length) {
        toast({ title: "No records found", description: "Please check your details or contact us for assistance." });
      }
    } catch {
      setResults([]);
      toast({ title: "No records found", description: "Please check your Patient ID and Mobile Number, or contact us for assistance." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12">
      <Breadcrumbs items={[{ label: "Track Booking" }]} />
      <SectionHeading title="Track Your Booking" subtitle="Enter your details to check the status of your diagnostic booking" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-md"
      >
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 card-shadow space-y-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2"
          >
            <FileDown className="h-8 w-8 text-primary" />
          </motion.div>

          <div>
            <Label htmlFor="patientId" className="mb-1.5 block">Patient ID</Label>
            <Input id="patientId" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} placeholder="Enter your Patient ID (optional)" maxLength={50} />
          </div>

          <div>
            <Label htmlFor="mobile" className="mb-1.5 block">Mobile Number *</Label>
            <Input id="mobile" type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Enter your registered mobile number" required maxLength={15} />
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2"><Search className="h-4 w-4 animate-spin" /> Searching...</span>
              ) : (
                <span className="flex items-center gap-2"><Search className="h-4 w-4" /> Track Booking</span>
              )}
            </Button>
          </motion.div>

          <p className="text-xs text-center text-muted-foreground">
            Need help? Call us at{" "}
            <a href="tel:+917679348684" className="text-primary hover:underline">+91 7679348684</a>
          </p>
        </form>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {searched && results !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-2xl mt-8"
          >
            {results.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-border bg-card p-8 text-center"
              >
                <Search className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">No bookings found</p>
                <p className="text-sm text-muted-foreground">Please check your details or contact us for assistance.</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Found {results.length} booking{results.length !== 1 ? "s" : ""}
                </h3>
                {results.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="rounded-xl border border-border bg-card p-5 card-shadow transition-all hover:card-shadow-hover"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{b.patient_name}</h4>
                        {b.patient_id && <p className="text-xs text-muted-foreground">Patient ID: {b.patient_id}</p>}
                      </div>
                      <Badge className={`${statusColors[b.status] || ""} border-0`}>
                        {statusLabels[b.status] || b.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {b.preferred_date} at {b.preferred_time}</span>
                      {b.selected_tests?.length ? (
                        <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-primary" /> {b.selected_tests.join(", ")}</span>
                      ) : null}
                      {b.selected_package && (
                        <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-primary" /> {b.selected_package}</span>
                      )}
                    </div>
                    <div className="mt-3">
                      {b.status === "completed" ? (
                        <p className="text-sm text-primary font-medium flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Your report is ready. Please contact us to collect it.</p>
                      ) : b.status === "cancelled" ? (
                        <p className="text-sm text-destructive">This booking was cancelled.</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Your booking is {statusLabels[b.status]?.toLowerCase()}. We will contact you shortly.</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportsPage;
