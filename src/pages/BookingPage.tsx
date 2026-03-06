import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Phone, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import SectionHeading from "@/components/SectionHeading";
import { bookingSlots } from "@/data/siteData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BookingPage = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", date: "", slot: "", testOrPackage: "", notes: "" });
  const [tests, setTests] = useState<{ id: string; name: string; price: number }[]>([]);
  const [packages, setPackages] = useState<{ id: string; name: string; original_price: number; discounted_price: number | null }[]>([]);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([
      supabase.from("tests").select("id, name, price").eq("is_active", true).order("name"),
      supabase.from("packages").select("id, name, original_price, discounted_price").order("name"),
    ]).then(([{ data: t }, { data: p }]) => {
      if (t) setTests(t);
      if (p) setPackages(p);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.date || !form.slot) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Appointment request submitted!", description: "We will confirm your booking shortly." });
  };

  if (submitted) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md rounded-2xl border border-border bg-card p-10 text-center card-shadow">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Booking Submitted!</h2>
          <p className="mt-2 text-muted-foreground">Your appointment request is pending admin approval. We'll contact you at <strong>{form.phone}</strong> to confirm.</p>
          <Button className="mt-6" onClick={() => { setSubmitted(false); setForm({ name: "", phone: "", email: "", date: "", slot: "", testOrPackage: "", notes: "" }); }}>Book Another</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <SectionHeading title="Book an Appointment" subtitle="Select your preferred date, time, and test. Admin approval is required." />
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-5 rounded-xl border border-border bg-card p-6 card-shadow md:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name" className="flex items-center gap-1.5 mb-1.5"><User className="h-3.5 w-3.5" /> Full Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required maxLength={100} />
          </div>
          <div>
            <Label htmlFor="phone" className="flex items-center gap-1.5 mb-1.5"><Phone className="h-3.5 w-3.5" /> Phone *</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXXXXXXX" required maxLength={15} />
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
          <Select value={form.testOrPackage} onValueChange={(v) => setForm({ ...form, testOrPackage: v })}>
            <SelectTrigger><SelectValue placeholder="Select test or package (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Consultation</SelectItem>
              {packages.map((p) => (
                <SelectItem key={p.id} value={p.name}>📦 {p.name} — ₹{p.discounted_price ?? p.original_price}</SelectItem>
              ))}
              {tests.map((t) => (
                <SelectItem key={t.id} value={t.name}>🔬 {t.name} — ₹{t.price}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="notes" className="mb-1.5 block">Notes</Label>
          <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special requirements..." rows={3} maxLength={500} />
        </div>
        <Button type="submit" className="w-full" size="lg">Submit Booking Request</Button>
        <p className="text-center text-xs text-muted-foreground">Bookings require admin approval. You'll be contacted to confirm.</p>
      </form>
    </div>
  );
};

export default BookingPage;
