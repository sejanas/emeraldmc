import { useState, useMemo, useRef, useEffect } from "react";
import PageMeta from "@/components/PageMeta";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, FlaskConical, Users, Star, CheckCircle, Award, Home, Search, ClipboardList, Microscope, FileDown, MapPin, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SectionHeading from "@/components/SectionHeading";
import StatsCounter from "@/components/StatsCounter";
import Testimonials from "@/components/Testimonials";
import useTests from "@/hooks/useTests";
import useDoctors from "@/hooks/useDoctors";
import usePackages from "@/hooks/usePackages";
import useCategories from "@/hooks/useCategories";
import useCertifications from "@/hooks/useCertifications";
import ErrorBox from "@/components/ErrorBox";
import heroImg from "@/assets/hero-lab.png";
import JsonLd from "@/components/JsonLd";
import { useFaqs } from "@/hooks/useFaqs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

const trustBadges = [
  { icon: Shield, label: "ISO Certified Lab" },
  { icon: Clock, label: "Same Day Reports" },
  { icon: Home, label: "Free Home Sample Collection" },
  { icon: Award, label: "Experienced Pathologists" },
];

const howItWorks = [
  { icon: ClipboardList, step: "1", title: "Book Test Online", desc: "Choose your test and book an appointment online" },
  { icon: Home, step: "2", title: "Visit Lab or Home Collection", desc: "Visit our lab or get free home sample collection" },
  { icon: Microscope, step: "3", title: "Sample Analysis", desc: "Sample analyzed in our ISO certified laboratory" },
  { icon: FileDown, step: "4", title: "Download Report", desc: "Get your accurate report on the same day" },
];

const serviceAreas = ["Port Blair", "Wimberlygunj", "Bambooflat", "Ferrargunj"];

const Index = () => {
  const [heroSearch, setHeroSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [certPreview, setCertPreview] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const testsQuery = useTests({ limit: 6 });
  const allTestsQuery = useTests();
  const doctorsQuery = useDoctors(3);
  const packagesQuery = usePackages();
  const categoriesQuery = useCategories();
  const faqsQuery = useFaqs(true);
  const certificationsQuery = useCertifications();

  const getCatNames = (t: any) =>
    (t.categories ?? []).map((c: any) => c.name).join(", ") || "";

  const packages = packagesQuery.data?.packages ?? [];
  const testNames = packagesQuery.data?.testNames ?? {};
  const certifications = (certificationsQuery.data ?? []).filter((c: any) => c.is_active !== false);

  const q = heroSearch.trim().toLowerCase();

  const matchedTests = useMemo(() => {
    if (!q) return [];
    return (allTestsQuery.data ?? [])
      .filter((t: any) => t.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [q, allTestsQuery.data]);

  const matchedPackages = useMemo(() => {
    if (!q) return [];
    return packages
      .filter((pkg: any) => {
        if (pkg.name.toLowerCase().includes(q)) return true;
        const pTests = testNames[pkg.id] ?? [];
        return pTests.some((t: string) => t.toLowerCase().includes(q));
      })
      .slice(0, 4);
  }, [q, packages, testNames]);

  const hasResults = matchedTests.length > 0 || matchedPackages.length > 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      setShowResults(false);
      navigate(`/tests?search=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  return (
    <>
      <JsonLd />

      {/* Hero */}
      <section className="relative overflow-hidden bg-section-gradient">
        <div className="container grid items-center gap-8 py-20 md:grid-cols-2 md:py-28">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-primary">
              <Shield className="h-3 w-3" /> ISO Certified Lab
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Bringing World Class Care to{" "}
              <span className="text-gradient-emerald">the Islands</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-lg">
              Shifa's Mainland Healthcare — ISO Certified Diagnostic Lab providing reliable health tests, affordable packages, and free home sample collection in Sri Vijaya Puram.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/book">Book Health Test <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" size="lg"><Link to="/packages">View Packages</Link></Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <img src={heroImg} alt="Shifa's Mainland Healthcare - ISO certified diagnostic laboratory in Sri Vijaya Puram" className="w-full rounded-2xl card-shadow object-cover" loading="eager" />
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b border-border bg-card">
        <div className="container py-6">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {trustBadges.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2"
              >
                <b.icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-foreground">{b.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Test Search */}
      <section className="container py-12">
        <div ref={searchRef} className="mx-auto max-w-xl relative">
          <motion.form
            onSubmit={handleHeroSearch}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tests like CBC, Thyroid, Diabetes..."
                value={heroSearch}
                onChange={(e) => {
                  setHeroSearch(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => q && setShowResults(true)}
                className="h-14 rounded-full pl-12 pr-32 text-base shadow-md border-border"
              />
              <Button type="submit" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6">
                Search
              </Button>
            </div>
          </motion.form>

          {/* Inline Search Results */}
          {showResults && q && (
            <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-lg max-h-[400px] overflow-y-auto">
              {!hasResults && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No tests or packages found for "{heroSearch.trim()}"
                </div>
              )}

              {matchedTests.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Tests</p>
                  <div className="space-y-1">
                    {matchedTests.map((t: any) => (
                      <Link
                        key={t.id}
                        to={`/tests/${t.slug ?? t.id}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-accent transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{getCatNames(t)} · {t.report_time}</p>
                        </div>
                        <span className="shrink-0 ml-3 text-right">
                          {t.original_price && t.original_price > t.price && (
                            <span className="text-xs text-muted-foreground line-through mr-1">₹{t.original_price}</span>
                          )}
                          <span className="text-sm font-semibold text-primary">₹{t.price}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {matchedPackages.length > 0 && (
                <div className="p-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Packages</p>
                  <div className="space-y-1">
                    {matchedPackages.map((pkg: any) => {
                      const pTests = (testNames[pkg.id] ?? []) as string[];
                      const matching = pTests.filter((t: string) => t.toLowerCase().includes(q));
                      return (
                        <Link
                          key={pkg.id}
                          to="/packages"
                          onClick={() => setShowResults(false)}
                          className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-accent transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{pkg.name}</p>
                            {matching.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Includes: {matching.slice(0, 3).join(", ")}{matching.length > 3 ? ` +${matching.length - 3} more` : ""}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-primary shrink-0 ml-3">
                            ₹{pkg.discounted_price ?? pkg.original_price}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasResults && (
                <div className="border-t border-border p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setShowResults(false);
                      navigate(`/tests?search=${encodeURIComponent(heroSearch.trim())}`);
                    }}
                  >
                    View all results <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="group rounded-xl border border-border bg-card p-6 text-center card-shadow transition-all hover:card-shadow-hover hover:scale-[1.02]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-accent transition-colors group-hover:bg-primary/10"><f.icon className="h-6 w-6 text-primary" /></div>
              <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-section-gradient py-20">
        <div className="container">
          <SectionHeading title="How It Works" subtitle="Getting your diagnostic test done is easy" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {howItWorks.map((s, i) => (
              <motion.div key={s.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="relative flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                  <s.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground lg:right-auto lg:-top-2 lg:left-1/2 lg:-translate-x-1/2 lg:translate-x-8">
                  {s.step}
                </span>
                <h3 className="font-display text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <StatsCounter />

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className="container py-16">
          <SectionHeading title="Our Certifications" subtitle="Trusted quality standards and accreditations" />
          <div className="flex flex-wrap justify-center gap-6">
            {certifications.map((cert: any, i: number) => (
              <motion.button
                key={cert.id}
                type="button"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                onClick={() => setCertPreview(cert)}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:card-shadow-hover hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {cert.image_url ? (
                  <img src={cert.image_url} alt={cert.name} className="h-20 w-auto object-contain" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent">
                    <BadgeCheck className="h-10 w-10 text-primary" />
                  </div>
                )}
                <span className="font-medium text-foreground text-sm text-center">{cert.name}</span>
                {cert.issuing_authority && (
                  <span className="text-xs text-muted-foreground">{cert.issuing_authority}</span>
                )}
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Certification Preview Dialog */}
      <Dialog open={!!certPreview} onOpenChange={(o) => !o && setCertPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="sr-only">{certPreview?.name}</DialogTitle>
          {certPreview && (
            <div className="text-center">
              {certPreview.image_url ? (
                <img src={certPreview.image_url} alt={certPreview.name} className="mx-auto max-h-80 object-contain rounded-lg" />
              ) : (
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-accent">
                  <BadgeCheck className="h-16 w-16 text-primary" />
                </div>
              )}
              <h3 className="mt-4 font-display text-xl font-semibold text-foreground">{certPreview.name}</h3>
              {certPreview.issuing_authority && (
                <p className="text-sm text-muted-foreground mt-1">{certPreview.issuing_authority}</p>
              )}
              {certPreview.description && (
                <p className="text-sm text-muted-foreground mt-3">{certPreview.description}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Popular Tests */}
      <section className="bg-section-gradient py-20">
        <div className="container">
          <SectionHeading title="Popular Tests" subtitle="Browse our most frequently requested diagnostic tests" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testsQuery.error && (
              <div className="col-span-3 p-4">
                <ErrorBox title="Failed to load tests" message={String(testsQuery.error)} onRetry={() => testsQuery.refetch()} />
              </div>
            )}
            {testsQuery.isLoading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between rounded-xl border border-border bg-card p-5">
                <div className="flex-1">
                  <div className="h-4 w-24 mb-2"><div className="animate-pulse rounded bg-muted h-4 w-full" /></div>
                  <div className="h-5 w-40 mb-2"><div className="animate-pulse rounded bg-muted h-5 w-full" /></div>
                </div>
              </div>
            ))}
            {(testsQuery.data ?? []).map((t: any, i: number) => (
              <motion.div key={t.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex items-start justify-between rounded-xl border border-border bg-card p-5 transition-all hover:card-shadow-hover hover:scale-[1.01]">
                <div>
                  <p className="text-xs font-medium text-primary">{getCatNames(t)}</p>
                  <h3 className="mt-1 font-semibold text-foreground">{t.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t.report_time} • {t.sample_type}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {t.original_price && t.original_price > t.price && (
                    <p className="text-xs text-muted-foreground line-through">₹{t.original_price}</p>
                  )}
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
      <section className="container py-20">
        <SectionHeading title="Health Packages" subtitle="Comprehensive health checkup packages at affordable prices" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {packagesQuery.isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={`pkg-skel-${i}`} className="relative rounded-xl border p-6">
              <div className="h-5 w-32 mb-3 bg-muted animate-pulse" />
              <div className="h-4 w-full mb-3 bg-muted animate-pulse" />
              <div className="h-8 w-full bg-muted animate-pulse" />
            </div>
          ))}
          {packagesQuery.error && (
            <div className="col-span-4 p-6">
              <ErrorBox title="Failed to load packages" message={String(packagesQuery.error)} onRetry={() => packagesQuery.refetch()} />
            </div>
          )}
          {packages.map((pkg: any, i: number) => (
            <motion.div key={pkg.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className={`relative flex flex-col rounded-xl border p-6 transition-all hover:card-shadow-hover hover:scale-[1.02] ${pkg.is_popular ? "border-primary ring-2 ring-primary/20 bg-accent/50" : "border-border bg-card"}`}>
              {pkg.is_popular && (
                <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm"><Star className="h-3 w-3" /> Popular</span>
              )}
              <h3 className="font-display text-lg font-semibold text-foreground">{pkg.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
              <p className="mt-3 font-display text-3xl font-bold text-primary">₹{pkg.discounted_price ?? pkg.original_price}</p>
              {pkg.discounted_price && pkg.discounted_price < pkg.original_price && (
                <p className="text-sm text-muted-foreground line-through">₹{pkg.original_price}</p>
              )}
              <ul className="mt-4 flex-1 space-y-1.5">
                {(testNames[pkg.id] ?? []).map((t: string) => (
                  <li key={t} className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" /> {t}</li>
                ))}
              </ul>
              <Button asChild className="mt-5 w-full" size="sm" variant={pkg.is_popular ? "default" : "outline"}><Link to="/book">Book Now</Link></Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Doctors */}
      <section className="bg-section-gradient py-20">
        <div className="container">
          <SectionHeading title="Our Expert Doctors" subtitle="Meet our team of qualified healthcare professionals" />
          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {(doctorsQuery.data ?? []).map((d: any, i: number) => (
              <motion.div key={d.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="overflow-hidden rounded-xl border border-border bg-card text-center card-shadow transition-all hover:card-shadow-hover hover:scale-[1.02]">
                {d.profile_image && <img src={d.profile_image} alt={d.name} className="aspect-square w-full object-cover" loading="lazy" />}
                <div className="p-4">
                  <h3 className="font-display text-base font-semibold text-foreground">{d.name}</h3>
                  <p className="text-sm text-primary">{d.specialization}</p>
                  {d.qualification && <p className="text-xs text-muted-foreground mt-1">{d.qualification}</p>}
                  {d.experience_years && <p className="text-xs text-muted-foreground mt-0.5">{d.experience_years} Years Experience</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Service Area */}
      <section className="container py-20">
        <SectionHeading title="Service Areas" subtitle="Free home sample collection available in these locations" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
          {serviceAreas.map((area, i) => (
            <motion.div key={area} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 card-shadow">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-foreground">{area}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      {(faqsQuery.data ?? []).length > 0 && (
        <section className="bg-section-gradient py-20">
          <div className="container">
            <SectionHeading title="Frequently Asked Questions" subtitle="Quick answers to common questions about our services" />
            <Accordion type="single" collapsible className="max-w-2xl mx-auto">
              {(faqsQuery.data ?? []).slice(0, 5).map((faq: any) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left font-medium text-foreground">{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {(faqsQuery.data ?? []).length > 5 && (
              <div className="mt-6 text-center">
                <Button asChild variant="outline"><Link to="/faq">View All FAQs <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container py-20">
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
