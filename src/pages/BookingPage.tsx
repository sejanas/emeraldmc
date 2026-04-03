import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, Phone, Mail, CheckCircle, MapPin, Stethoscope, ChevronsUpDown, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import { bookingSlots } from "@/data/siteData";
import useTests from "@/hooks/useTests";
import usePackages from "@/hooks/usePackages";
import { useCreateBooking } from "@/hooks/useBookingsMutations";
import { useToast } from "@/hooks/use-toast";
import PhoneInputField from "@/components/PhoneInputField";
import { isValidEmail, isValidPhone } from "@/lib/validation";

const steps = [
  { label: "Patient Details", icon: User },
  { label: "Schedule", icon: Calendar },
  { label: "Confirm", icon: CheckCircle },
];

const BookingPage = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isFertilityCamp = searchParams.get("from") === "fertility-camp";
  const preselectedTest = searchParams.get("test") ?? "";
  const preselectedPackage = searchParams.get("package") ?? "";
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testPkgOpen, setTestPkgOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", date: "", slot: "",
    testOrPackage: isFertilityCamp ? "general" : preselectedPackage || preselectedTest || "",
    address: "",
    notes: isFertilityCamp ? "Fertility Consultation – Dr. Rukkayal Ashik (Free Camp, Apr 18–20)" : "",
  });
  const testsQuery = useTests({ active: true });
  const packagesQuery = usePackages();
  const createBooking = useCreateBooking();

  const tests = testsQuery.data ?? [];
  const packages = packagesQuery.data?.packages ?? [];

  const testPkgOptions = useMemo(() => {
    const opts: { value: string; searchLabel: string; displayLabel: string; group: string; originalPrice?: number; price?: number }[] = [
      { value: "general", searchLabel: "General Consultation", displayLabel: "General Consultation", group: "general" },
    ];
    for (const p of packages) {
      const price = p.discounted_price ?? p.original_price;
      const hasDiscount = p.discounted_price && p.discounted_price < p.original_price;
      opts.push({
        value: p.name,
        searchLabel: `${p.name} ${p.original_price} ${price}`,
        displayLabel: `📦 ${p.name}`,
        group: "packages",
        originalPrice: hasDiscount ? p.original_price : undefined,
        price,
      });
    }
    for (const t of tests) {
      const sub = (t as any).is_sub_test && (t as any).parent_test_name ? ` (Part of ${(t as any).parent_test_name})` : "";
      const hasDiscount = (t as any).original_price && (t as any).original_price > (t as any).price;
      opts.push({
        value: (t as any).name,
        searchLabel: `${(t as any).name}${sub} ${(t as any).original_price ?? ""} ${(t as any).price}`,
        displayLabel: `🔬 ${(t as any).name}${sub}`,
        group: "tests",
        originalPrice: hasDiscount ? (t as any).original_price : undefined,
        price: (t as any).price,
      });
    }
    return opts;
  }, [tests, packages]);

  const today = new Date().toISOString().split("T")[0];
  const currentStep = form.date && form.slot ? 2 : form.name && form.phone ? 1 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date || !form.slot) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (!isValidPhone(form.phone)) {
      toast({ title: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    if (form.email && !isValidEmail(form.email)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await createBooking.mutateAsync({
        patient_name: form.name,
        phone: form.phone,
        email: form.email || null,
        preferred_date: form.date,
        preferred_time: form.slot,
        selected_tests: form.testOrPackage ? [form.testOrPackage] : [],
        selected_package: null,
        address: form.address || null,
        notes: form.notes || null,
      });
      setSubmitted(true);
      toast({ title: "Booking submitted!", description: "We will confirm your booking shortly." });
    } catch (err: any) {
      toast({ title: "Error submitting booking", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="max-w-md rounded-2xl border border-border bg-card p-10 text-center card-shadow"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent"
          >
            <CheckCircle className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="font-display text-2xl font-bold text-foreground">Booking Submitted!</h2>
          <p className="mt-2 text-muted-foreground">Your appointment request is pending. We'll contact you at <strong>{form.phone}</strong> to confirm.</p>
          <Button className="mt-6" onClick={() => { setSubmitted(false); setForm({ name: "", phone: "", email: "", date: "", slot: "", testOrPackage: "", address: "", notes: "" }); }}>Book Another</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <PageMeta title="Book Health Test Appointment" description="Book a diagnostic test appointment at Shifa's Mainland Healthcare. Choose from 50+ tests and health packages with free home sample collection." />
      <Breadcrumbs items={[{ label: "Book Appointment" }]} />
      <SectionHeading title="Book an Appointment" subtitle="Select your preferred date, time, and test." />

      {/* Fertility camp context banner */}
      {isFertilityCamp && (
        <div className="mx-auto mb-6 max-w-lg flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <Stethoscope className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Booking for the Free Fertility Camp</p>
            <p className="text-muted-foreground mt-0.5">Dr. Rukkayal Ashik (MS OG, MRCOG UK) &middot; Visiting Apr 18–20, 2026 &middot; Registration &amp; consultation free</p>
          </div>
        </div>
      )}

      {/* Step Progress */}
      <div className="mx-auto mb-8 flex max-w-lg items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{
                  scale: i === currentStep ? 1.1 : 1,
                  backgroundColor: i <= currentStep ? "hsl(var(--primary))" : "hsl(var(--card))",
                }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  i <= currentStep ? "border-primary text-primary-foreground" : "border-border text-muted-foreground"
                }`}
              >
                <s.icon className="h-4 w-4" />
              </motion.div>
              <span className={`text-xs font-medium ${i <= currentStep ? "text-primary" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <motion.div
                animate={{ scaleX: i < currentStep ? 1 : 0 }}
                transition={{ duration: 0.4 }}
                style={{ transformOrigin: "left" }}
                className={`mx-2 h-0.5 flex-1 rounded-full ${i < currentStep ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-lg space-y-5 rounded-xl border border-border bg-card p-6 card-shadow md:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name" className="flex items-center gap-1.5 mb-1.5"><User className="h-3.5 w-3.5" /> Full Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required maxLength={100} />
          </div>
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5"><Phone className="h-3.5 w-3.5" /> Phone *</Label>
            <PhoneInputField value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          </div>
        </div>
        <div>
          <Label htmlFor="email" className="flex items-center gap-1.5 mb-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" maxLength={255} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="date" className="flex items-center gap-1.5 mb-1.5"><Calendar className="h-3.5 w-3.5" /> Date *</Label>
            <Input id="date" type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="slot" className="flex items-center gap-1.5 mb-1.5"><Clock className="h-3.5 w-3.5" /> Time Slot *</Label>
            <Select value={form.slot} onValueChange={(v) => setForm({ ...form, slot: v })}>
              <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
              <SelectContent>
                {bookingSlots.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="test" className="mb-1.5 block">Test / Package</Label>
          <Popover open={testPkgOpen} onOpenChange={setTestPkgOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={testPkgOpen} className="w-full justify-between font-normal">
                {form.testOrPackage
                  ? (testPkgOptions.find((o) => o.value === form.testOrPackage)?.displayLabel ?? form.testOrPackage)
                  : "Select test or package (optional)"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command filter={(value, search) => {
                const opt = testPkgOptions.find((o) => o.value === value);
                if (!opt) return 0;
                return opt.searchLabel.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
              }}>
                <CommandInput placeholder="Search tests & packages..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="General">
                    {testPkgOptions.filter((o) => o.group === "general").map((o) => (
                      <CommandItem key={o.value} value={o.value} onSelect={(v) => { setForm({ ...form, testOrPackage: v }); setTestPkgOpen(false); }}>
                        <Check className={"mr-2 h-4 w-4 " + (form.testOrPackage === o.value ? "opacity-100" : "opacity-0")} />
                        {o.displayLabel}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {testPkgOptions.some((o) => o.group === "packages") && (
                    <CommandGroup heading="Packages">
                      {testPkgOptions.filter((o) => o.group === "packages").map((o) => (
                        <CommandItem key={o.value} value={o.value} onSelect={(v) => { setForm({ ...form, testOrPackage: v }); setTestPkgOpen(false); }}>
                          <Check className={"mr-2 h-4 w-4 " + (form.testOrPackage === o.value ? "opacity-100" : "opacity-0")} />
                          <span className="flex-1 truncate" title={o.displayLabel}>{o.displayLabel}</span>
                          <span className="ml-2 whitespace-nowrap text-xs">
                            {o.originalPrice && <s className="text-muted-foreground mr-1">₹{o.originalPrice}</s>}
                            <span className="font-semibold text-primary">₹{o.price}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {testPkgOptions.some((o) => o.group === "tests") && (
                    <CommandGroup heading="Tests">
                      {testPkgOptions.filter((o) => o.group === "tests").map((o) => (
                        <CommandItem key={o.value} value={o.value} onSelect={(v) => { setForm({ ...form, testOrPackage: v }); setTestPkgOpen(false); }}>
                          <Check className={"mr-2 h-4 w-4 " + (form.testOrPackage === o.value ? "opacity-100" : "opacity-0")} />
                          <span className="flex-1 truncate" title={o.displayLabel}>{o.displayLabel}</span>
                          <span className="ml-2 whitespace-nowrap text-xs">
                            {o.originalPrice && <s className="text-muted-foreground mr-1">₹{o.originalPrice}</s>}
                            <span className="font-semibold text-primary">₹{o.price}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="address" className="flex items-center gap-1.5 mb-1.5"><MapPin className="h-3.5 w-3.5" /> Address</Label>
          <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Optional" maxLength={500} />
        </div>
        <div>
          <Label htmlFor="notes" className="mb-1.5 block">Notes</Label>
          <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special requirements..." rows={3} maxLength={500} />
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? "Submitting..." : "Submit Booking Request"}</Button>
        </motion.div>
        <p className="text-center text-xs text-muted-foreground">Bookings require confirmation. You'll be contacted shortly.</p>
      </motion.form>
    </div>
  );
};

export default BookingPage;
