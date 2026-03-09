import { useState } from "react";
import PageMeta from "@/components/PageMeta";
import { motion } from "framer-motion";
import { Phone, Mail, Clock, MapPin, Send, Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import { businessInfo } from "@/data/siteData";
import { useToast } from "@/hooks/use-toast";
import { isValidEmail } from "@/lib/validation";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const contactDetails = [
  { icon: Phone, label: "Phone", value: businessInfo.phone, href: `tel:${businessInfo.phone}` },
  { icon: Mail, label: "Email", value: businessInfo.email, href: `mailto:${businessInfo.email}` },
  { icon: Clock, label: "Working Hours", value: businessInfo.hours },
  { icon: MapPin, label: "Address", value: businessInfo.address, href: businessInfo.mapUrl },
];

const ContactPage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(form.email)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    toast({ title: "Message sent!", description: "We'll get back to you shortly." });
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="container py-12">
      <PageMeta title="Contact Us – Shifa's Mainland Healthcare" description="Get in touch with Shifa's Mainland Healthcare in Sri Vijaya Puram. Call, email, or visit us for diagnostic test inquiries." />
      <Breadcrumbs items={[{ label: "Contact Us" }]} />
      <SectionHeading title="Contact Us" subtitle="Get in touch with Emerald Medical Care" />
      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-6">
          {contactDetails.map((d, i) => (
            <motion.div key={d.label} variants={fadeUp} custom={i} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent transition-transform hover:scale-110">
                <d.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{d.label}</p>
                {d.href ? (
                  <a href={d.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {d.value}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">{d.value}</p>
                )}
              </div>
            </motion.div>
          ))}
          <motion.div variants={fadeUp} custom={4} className="flex gap-3">
            <a href="https://www.facebook.com/profile.php?id=61588640095513" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:text-primary hover:border-primary hover:scale-110" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="https://www.instagram.com/shifa_health_care0/" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:text-primary hover:border-primary hover:scale-110" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
          </motion.div>
          <motion.div variants={fadeUp} custom={5} className="mt-4 overflow-hidden rounded-xl border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15628.0!2d92.7365!3d11.6234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSri+Vijaya+Puram!5e0!3m2!1sen!2sin"
              width="100%" height="220" style={{ border: 0 }} allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade" title="Emerald Medical Care Location"
            />
          </motion.div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6 card-shadow space-y-4"
        >
          <div>
            <Label htmlFor="cname" className="mb-1.5 block">Name *</Label>
            <Input id="cname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required maxLength={100} />
          </div>
          <div>
            <Label htmlFor="cemail" className="mb-1.5 block">Email *</Label>
            <Input id="cemail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" required maxLength={255} />
          </div>
          <div>
            <Label htmlFor="cmsg" className="mb-1.5 block">Message *</Label>
            <Textarea id="cmsg" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help you?" rows={5} required maxLength={1000} />
          </div>
          <Button type="submit" className="w-full">
            <Send className="mr-2 h-4 w-4" /> Send Message
          </Button>
        </motion.form>
      </div>
    </div>
  );
};

export default ContactPage;
