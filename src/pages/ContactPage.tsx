import { useState } from "react";
import PageMeta from "@/components/PageMeta";
import { motion } from "framer-motion";
import { Phone, Mail, Clock, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import { businessInfo } from "@/data/siteData";
import { useToast } from "@/hooks/use-toast";
import { isValidEmail } from "@/lib/validation";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const ContactPage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const { data: allSettings } = useSiteSettings();
  const generalSettings = Array.isArray(allSettings)
    ? (allSettings.find((s: any) => s.key === "general")?.value ?? {})
    : {};
  const dynamicHours: string = generalSettings.hours || businessInfo.hours;

  const contactDetails = [
    { icon: Phone, label: "Phone", value: businessInfo.phone, href: `tel:${businessInfo.phone}` },
    { icon: Mail, label: "Email", value: businessInfo.email, href: `mailto:${businessInfo.email}` },
    { icon: Clock, label: "Working Hours", value: dynamicHours },
    { icon: MapPin, label: "Address", value: businessInfo.address, href: businessInfo.mapUrl },
  ];

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
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{d.value}</p>
                )}
              </div>
            </motion.div>
          ))}
          <motion.div variants={fadeUp} custom={4} className="flex gap-3">
            <a href="https://www.facebook.com/profile.php?id=61588640095513" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" aria-label="Facebook">
              {/* Facebook brand icon */}
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
            </a>
            <a href="https://wa.me/917679348684?text=Hello%2C%20I%20want%20to%20book%20a%20health%20test." target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" aria-label="WhatsApp">
              {/* WhatsApp brand icon */}
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/shifa_health_care0/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" aria-label="Instagram">
              {/* Instagram brand icon */}
              <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="ig-grad-contact" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFDC80"/>
                    <stop offset="25%" stopColor="#FCAF45"/>
                    <stop offset="50%" stopColor="#F77737"/>
                    <stop offset="75%" stopColor="#C13584"/>
                    <stop offset="100%" stopColor="#833AB4"/>
                  </linearGradient>
                </defs>
                <path fill="url(#ig-grad-contact)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
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
