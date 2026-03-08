import { useState } from "react";
import { FileDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useToast } from "@/hooks/use-toast";

const ReportsPage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ patientId: "", mobile: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId.trim() || !form.mobile.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!/^\d{10}$/.test(form.mobile.replace(/\D/g, "").slice(-10))) {
      toast({ title: "Please enter a valid 10-digit mobile number", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Simulated — replace with real API call when backend is ready
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "No reports found",
        description: "Please check your Patient ID and Mobile Number, or contact us for assistance.",
      });
    }, 1500);
  };

  return (
    <div className="container py-12">
      <Breadcrumbs items={[{ label: "Download Reports" }]} />
      <SectionHeading title="Download Your Reports" subtitle="Enter your details to access and download your diagnostic reports" />

      <div className="mx-auto max-w-md">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8 card-shadow space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2">
            <FileDown className="h-8 w-8 text-primary" />
          </div>

          <div>
            <Label htmlFor="patientId" className="mb-1.5 block">Patient ID *</Label>
            <Input
              id="patientId"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              placeholder="Enter your Patient ID"
              required
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="mobile" className="mb-1.5 block">Mobile Number *</Label>
            <Input
              id="mobile"
              type="tel"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="Enter your registered mobile number"
              required
              maxLength={15}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2"><Search className="h-4 w-4 animate-spin" /> Searching...</span>
            ) : (
              <span className="flex items-center gap-2"><FileDown className="h-4 w-4" /> Download Report</span>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Can't find your report? Call us at{" "}
            <a href="tel:+917679348684" className="text-primary hover:underline">+91 7679348684</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ReportsPage;
