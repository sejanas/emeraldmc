import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, FlaskConical, Users, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/SectionHeading";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-lab.png";
import JsonLd from "@/components/JsonLd";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Shield, title: "ISO Certified", desc: "Internationally certified diagnostic laboratory" },
  { icon: FlaskConical, title: "50+ Tests", desc: "Comprehensive range of diagnostic tests" },
  { icon: Clock, title: "Same Day Reports", desc: "Quick turnaround on most test results" },
  { icon: Users, title: "Expert Doctors", desc: "Qualified pathologists and physicians" },
];

interface TestRow { id: string; name: string; price: number; report_time: string; sample_type: string; category_id: string | null; }
interface PkgRow { id: string; name: string; description: string | null; original_price: number; discounted_price: number | null; is_popular: boolean; }
interface DoctorRow { id: string; name: string; specialization: string; profile_image: string | null; }
interface CatRow { id: string; name: string; }

const Index = () => {
  const [tests, setTests] = useState<TestRow[]>([]);
  const [packages, setPackages] = useState<PkgRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [categories, setCategories] = useState<CatRow[]>([]);
  const [testNames, setTestNames] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const load = async () => {
      const [{ data: t }, { data: p }, { data: d }, { data: c }, { data: pt }] = await Promise.all([
        supabase.from("tests").select("id, name, price, report_time, sample_type, category_id").eq("is_active", true).order("display_order").limit(6),
        supabase.from("packages").select("*").order("display_order"),
        supabase.from("doctors").select("id, name, specialization, profile_image").order("display_order").limit(3),
        supabase.from("test_categories").select("id, name"),
        supabase.from("package_tests").select("package_id, test_id, tests(name)"),
      ]);
      if (t) setTests(t);
      if (p) setPackages(p);
      if (d) setDoctors(d);
      if (c) setCategories(c);
      if (pt) {
        const map: Record<string, string[]> = {};
        (pt as any[]).forEach((r) => { (map[r.package_id] ??= []).push(r.tests?.name ?? ""); });
        setTestNames(map);
      }
    };
    load();
  }, []);

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "";

  return (
    <>
      <JsonLd />

      {/* Hero */}
      <section className="relative overflow-hidden bg-section-gradient">
        <div className="container grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-primary">
              <Shield className="h-3 w-3" /> ISO Certified Lab
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Trusted ISO Certified Diagnostic Lab in{" "}
              <span className="text-gradient-emerald">Sri Vijaya Puram</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-lg">
              Book your test today at Emerald Medical Care. Accurate results, expert care, affordable prices.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/book">Book Appointment <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" size="lg"><Link to="/packages">View Health Packages</Link></Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <img src={heroImg} alt="Emerald Medical Care - ISO certified diagnostic laboratory in Sri Vijaya Puram" className="w-full rounded-2xl card-shadow object-cover" loading="eager" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="rounded-xl border border-border bg-card p-6 text-center card-shadow transition-shadow hover:card-shadow-hover">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-accent"><f.icon className="h-6 w-6 text-primary" /></div>
              <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popular Tests */}
      <section className="bg-section-gradient py-16">
        <div className="container">
          <SectionHeading title="Popular Tests" subtitle="Browse our most frequently requested diagnostic tests" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((t, i) => (
              <motion.div key={t.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex items-start justify-between rounded-xl border border-border bg-card p-5 transition-shadow hover:card-shadow-hover">
                <div>
                  <p className="text-xs font-medium text-primary">{catName(t.category_id)}</p>
                  <h3 className="mt-1 font-semibold text-foreground">{t.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t.report_time} • {t.sample_type}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-display text-lg font-bold text-primary">₹{t.price}</p>
                  <Button asChild size="sm" variant="outline" className="mt-1 h-7 text-xs"><Link to="/book">Book</Link></Button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline"><Link to="/tests">View All Tests <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      {/* Health Packages */}
      <section className="container py-16">
        <SectionHeading title="Health Packages" subtitle="Comprehensive health checkup packages at affordable prices" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg, i) => (
            <motion.div key={pkg.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className={`relative rounded-xl border p-6 transition-shadow hover:card-shadow-hover ${pkg.is_popular ? "border-primary bg-accent/50" : "border-border bg-card"}`}>
              {pkg.is_popular && (
                <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"><Star className="h-3 w-3" /> Popular</span>
              )}
              <h3 className="font-display text-lg font-semibold text-foreground">{pkg.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
              <p className="mt-3 font-display text-3xl font-bold text-primary">₹{pkg.discounted_price ?? pkg.original_price}</p>
              <ul className="mt-4 space-y-1.5">
                {(testNames[pkg.id] ?? []).map((t) => (
                  <li key={t} className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" /> {t}</li>
                ))}
              </ul>
              <Button asChild className="mt-5 w-full" size="sm" variant={pkg.is_popular ? "default" : "outline"}><Link to="/book">Book Now</Link></Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Doctors */}
      <section className="bg-section-gradient py-16">
        <div className="container">
          <SectionHeading title="Our Expert Doctors" subtitle="Meet our team of qualified healthcare professionals" />
          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {doctors.map((d, i) => (
              <motion.div key={d.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="overflow-hidden rounded-xl border border-border bg-card text-center card-shadow">
                {d.profile_image && <img src={d.profile_image} alt={d.name} className="aspect-square w-full object-cover" loading="lazy" />}
                <div className="p-4">
                  <h3 className="font-display text-base font-semibold text-foreground">{d.name}</h3>
                  <p className="text-sm text-primary">{d.specialization}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="rounded-2xl bg-primary p-10 text-center md:p-16">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">Ready to Book Your Health Checkup?</h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">Schedule your appointment today and get accurate diagnostic results from our ISO certified lab.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6"><Link to="/book">Book Appointment <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>
    </>
  );
};

export default Index;
