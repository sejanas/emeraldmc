import { useState, useMemo, useRef, useEffect } from "react";
import PageMeta from "@/components/PageMeta";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, FlaskConical, Users, Star, CheckCircle, Award, Home, Search, ClipboardList, Microscope, FileDown, MapPin, BadgeCheck, Info, Droplets, ChevronRight, Heart, Zap, Target, Lightbulb, Globe, Activity, Lock, Truck, Phone, Mail, CreditCard, ThumbsUp, Headphones, Stethoscope, Wifi, Camera, Monitor, PenTool, Briefcase, Gift, Syringe, Pill, Thermometer, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import SectionHeading from "@/components/SectionHeading";
import StatsCounter from "@/components/StatsCounter";
import Testimonials from "@/components/Testimonials";
import HorizontalScroll from "@/components/HorizontalScroll";
import CertificatePreview from "@/components/CertificatePreview";
import PackageDetailDialog from "@/components/PackageDetailDialog";
import TestDetailDialog from "@/components/TestDetailDialog";
import VisitingDoctorModal from "@/components/VisitingDoctorModal";
import { VISITING_DOCTOR_EVENT, isVisitActive } from "@/data/visitingDoctorEvent";

import useTests from "@/hooks/useTests";
import useDoctors from "@/hooks/useDoctors";
import usePackages from "@/hooks/usePackages";
import useCategories from "@/hooks/useCategories";
import useCertifications from "@/hooks/useCertifications";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import ErrorBox from "@/components/ErrorBox";
import heroImg from "@/assets/hero-lab.png";
import JsonLd from "@/components/JsonLd";
import HeroCarousel from "@/components/HeroCarousel";
import useHeroSlides from "@/hooks/useHeroSlides";
import { useFaqs } from "@/hooks/useFaqs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const FEATURE_ICONS: Record<string, LucideIcon> = {
  Shield, FlaskConical, Clock, Users, Heart, Star, Award, Microscope, Home,
  Search, ClipboardList, MapPin, BadgeCheck, Droplets, CheckCircle,
  Zap, Target, Lightbulb, Globe, Activity, Lock, Truck, Phone, Mail,
  CreditCard, ThumbsUp, Headphones, Stethoscope, Wifi, Camera, Monitor,
  PenTool, Briefcase, Gift, Syringe, Pill, Thermometer, ArrowRight, Info,
  FileDown, ChevronRight,
};

const defaultFeatures = [
  { icon: "Shield", title: "ISO Certified", desc: "Internationally certified diagnostic laboratory" },
  { icon: "FlaskConical", title: "50+ Tests", desc: "Comprehensive range of diagnostic tests" },
  { icon: "Clock", title: "Same Day Reports", desc: "Quick turnaround on most test results" },
  { icon: "Users", title: "Expert Doctors", desc: "Qualified pathologists and physicians" },
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

const serviceAreas = ["Port Blair", "Wimberlygunj", "Bambooflat", "Chouldari"];

const Index = () => {
  const [heroSearch, setHeroSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [certPreview, setCertPreview] = useState<any>(null);
  const [instructionsModal, setInstructionsModal] = useState<{ name: string; text: string } | null>(null);
  const [detailPkg, setDetailPkg] = useState<{ pkg: any; defaultExpandTest?: string } | null>(null);
  const [testDetail, setTestDetail] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const testsQuery = useTests({ limit: 12 });
  const allTestsQuery = useTests();
  const doctorsQuery = useDoctors(3);
  const packagesQuery = usePackages();
  const categoriesQuery = useCategories();
  const faqsQuery = useFaqs(true);
  const certificationsQuery = useCertifications();
  const settingsQuery = useSiteSettings();
  const heroSlidesQuery = useHeroSlides(true);

  const getCatNames = (t: any) =>
    (t.categories ?? []).map((c: any) => c.name).join(", ") || "";

  const packages = packagesQuery.data?.packages ?? [];
  const testNames = packagesQuery.data?.testNames ?? {};
  const testSubCounts: Record<string, Record<string, number>> = packagesQuery.data?.testSubCounts ?? {};
  const testSubNames: Record<string, Record<string, string[]>> = packagesQuery.data?.testSubNames ?? {};
  const totalTestCounts: Record<string, number> = packagesQuery.data?.totalTestCounts ?? {};
  const certifications = (certificationsQuery.data ?? []).filter((c: any) => c.is_active !== false && c.show_on_homepage !== false);

  const heroSlides = useMemo(() => {
    const slides = heroSlidesQuery.data ?? [];
    return slides.length > 0
      ? slides.sort((a: any, b: any) => a.display_order - b.display_order)
      : [{ id: "fallback", heading: "Bringing World Class Care to the Islands", subtitle: "Shifa\u2019s Mainland Healthcare \u2014 ISO Certified Diagnostic Lab providing reliable health tests, affordable packages, and free home sample collection in Sri Vijaya Puram.", image_url: heroImg }];
  }, [heroSlidesQuery.data]);

  // Filter active packages for display
  const activePackages = useMemo(() => packages.filter((p: any) => p.is_active !== false), [packages]);

  // Filter tests that should show on homepage
  const homepageTests = useMemo(() => {
    const allTests = allTestsQuery.data ?? [];
    const withHomepage = allTests.filter((t: any) => t.show_on_homepage);
    // Show homepage-marked tests; fall back to first 6 if none are marked
    return withHomepage.length > 0 ? withHomepage : allTests.slice(0, 6);
  }, [allTestsQuery.data]);

  // Homepage section ordering & visibility from settings
  const defaultSections = [
    { key: "search", visible: true },
    { key: "features", visible: true },
    { key: "health_packages", visible: true },
    { key: "how_it_works", visible: true },
    { key: "stats", visible: true },
    { key: "certifications", visible: true },
    { key: "popular_tests", visible: true },
    { key: "doctors", visible: true },
    { key: "testimonials", visible: true },
    { key: "service_areas", visible: true },
    { key: "faqs", visible: true },
    { key: "cta", visible: true },
  ];

  const sectionConfig = useMemo(() => {
    const allSettings = settingsQuery.data;
    if (!allSettings || !Array.isArray(allSettings)) return defaultSections;
    const saved = allSettings.find((s: any) => s.key === "homepage_sections")?.value;
    if (saved && Array.isArray(saved)) return saved;
    return defaultSections;
  }, [settingsQuery.data]);

  const isSectionVisible = (key: string) => {
    const section = sectionConfig.find((s: any) => s.key === key);
    return section ? section.visible !== false : true;
  };

  const sectionOrder = useMemo(() => sectionConfig.map((s: any) => s.key), [sectionConfig]);

  // Load features from settings, fall back to defaults
  const features = useMemo(() => {
    const allSettings = settingsQuery.data;
    if (!allSettings || !Array.isArray(allSettings)) return defaultFeatures;
    const saved = allSettings.find((s: any) => s.key === "homepage_features")?.value;
    if (saved && Array.isArray(saved)) return saved;
    return defaultFeatures;
  }, [settingsQuery.data]);

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

  const getDiscountPct = (t: any) => {
    if (t.discount_override && t.discount_override > 0) return Math.round(t.discount_override);
    if (t.original_price && t.original_price > t.price) {
      return Math.round(((t.original_price - t.price) / t.original_price) * 100);
    }
    return 0;
  };

  const getSavings = (pkg: any) => {
    if (pkg.savings_override && pkg.savings_override > 0) return pkg.savings_override;
    const price = pkg.discounted_price ?? pkg.original_price;
    if (pkg.original_price > price) return pkg.original_price - price;
    return 0;
  };

  return (
    <>
      <VisitingDoctorModal />
      <PageMeta
        title="Shifa's Mainland Healthcare – ISO Certified Diagnostic Lab in Sri Vijaya Puram"
        description="ISO certified diagnostic laboratory in Sri Vijaya Puram, Port Blair. 50+ health tests, affordable packages, expert doctors, and free home sample collection."
      />
      <JsonLd />

      {/* Hero Carousel */}
      <HeroCarousel slides={heroSlides} fallbackImage={heroImg} />

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
      {isSectionVisible("search") && (
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
      )}

      {/* Visiting Doctor Camp Section */}
      {isVisitActive() && (
        <section className="container py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-card card-shadow"
          >
            <div className="flex flex-col md:flex-row">
              {/* Doctor photo */}
              <div className="relative md:w-64 shrink-0">
                <img
                  src={VISITING_DOCTOR_EVENT.imageUrl}
                  alt={VISITING_DOCTOR_EVENT.name}
                  className="h-64 w-full object-cover object-top md:h-full"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-gradient-to-r" />
              </div>
              {/* Content */}
              <div className="flex-1 p-6 md:p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 px-3 py-1 text-xs font-bold">
                    FREE CAMP
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs font-semibold">
                    VISITING SPECIALIST
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">{VISITING_DOCTOR_EVENT.name}</h2>
                <p className="text-sm font-bold text-foreground mt-1">{VISITING_DOCTOR_EVENT.role}</p>
                <p className="text-sm text-primary font-semibold mt-0.5">{VISITING_DOCTOR_EVENT.credentials}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="bg-white rounded-md px-2 py-0.5 shrink-0">
                    <img src={VISITING_DOCTOR_EVENT.brandLogoUrl} alt="The Hive Fertility" className="h-5 w-auto" />
                  </div>
                  <p className="text-xs text-muted-foreground">{VISITING_DOCTOR_EVENT.organisation}</p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xl">{VISITING_DOCTOR_EVENT.bio}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {VISITING_DOCTOR_EVENT.specialties.map((s) => (
                    <span key={s} className="rounded-full border border-border bg-accent px-2.5 py-0.5 text-xs font-medium text-foreground">{s}</span>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    Visiting: <span className="text-primary">{VISITING_DOCTOR_EVENT.visitLabel}</span>
                  </span>
                  <span className="text-green-600 dark:text-green-400 text-sm font-bold">Registration &amp; Consultation FREE</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/book?from=fertility-camp">Book Free Appointment <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={VISITING_DOCTOR_EVENT.sourceUrl} target="_blank" rel="noopener noreferrer">
                      About the Doctor <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Dynamic Sections - ordered via admin settings */}
      {sectionOrder.map((key: string) => {
        if (!isSectionVisible(key)) return null;

        switch (key) {
          case "features":
            return (
              <section key="features" className="container py-20">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {features.map((f: any, i: number) => {
                    const FeatureIcon = FEATURE_ICONS[f.icon] || Shield;
                    return (
                    <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                      className="group rounded-xl border border-border bg-card p-6 text-center card-shadow transition-all hover:card-shadow-hover hover:scale-[1.02]">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-accent transition-colors group-hover:bg-primary/10"><FeatureIcon className="h-6 w-6 text-primary" /></div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                    </motion.div>
                    );
                  })}
                </div>
              </section>
            );

          case "how_it_works":
            return (
              <section key="how_it_works" className="bg-section-gradient py-20">
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
            );

          case "stats":
            return <StatsCounter key="stats" />;

          case "certifications":
            return certifications.length > 0 ? (
              <section key="certifications" className="container py-16">
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
                      className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:card-shadow-hover hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary w-48"
                    >
                      {cert.image_url ? (
                        <img src={cert.image_url} alt={cert.name} width={107} height={80} className="h-20 w-auto object-contain" loading="lazy" />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent">
                          <BadgeCheck className="h-10 w-10 text-primary" />
                        </div>
                      )}
                      <span className="font-medium text-foreground text-sm text-center">{cert.name}</span>
                      {cert.issuing_authority && (
                        <span className="text-xs text-muted-foreground">{cert.issuing_authority}</span>
                      )}
                      {cert.authority_logo && (
                        <img src={cert.authority_logo} alt="Authority" className="h-6 object-contain" loading="lazy" />
                      )}
                      <div className="flex items-center gap-1">
                        {cert.is_verified && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                            <BadgeCheck className="h-3.5 w-3.5" /> Verified
                          </span>
                        )}
                      </div>
                      {cert.valid_till && (
                        <span className="text-[10px] text-muted-foreground">
                          Valid till: {new Date(cert.valid_till).getFullYear()}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </section>
            ) : null;

          case "popular_tests":
            return (
              <section key="popular_tests" className="bg-section-gradient py-20">
                <div className="container">
                  <SectionHeading title="Popular Tests" subtitle="Browse our most frequently requested diagnostic tests" />
                  {testsQuery.error && (
                    <div className="max-w-md mx-auto mb-6">
                      <ErrorBox title="Failed to load tests" message={String(testsQuery.error)} onRetry={() => testsQuery.refetch()} />
                    </div>
                  )}
                  {testsQuery.isLoading ? (
                    <HorizontalScroll autoScroll>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="w-[240px] sm:w-[270px] flex-shrink-0 snap-start rounded-xl border border-border bg-card p-5">
                          <Skeleton className="h-5 w-40 mb-3" />
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-4 w-28 mb-4" />
                          <div className="flex items-baseline gap-2">
                            <Skeleton className="h-7 w-16" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                          <Skeleton className="mt-4 h-9 w-full" />
                        </div>
                      ))}
                    </HorizontalScroll>
                  ) : (
                    <HorizontalScroll autoScroll>
                      {homepageTests.map((t: any, i: number) => {
                        const discountPct = getDiscountPct(t);
                        return (
                          <motion.div
                            key={t.id}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            custom={i}
                            className="w-[240px] sm:w-[270px] flex-shrink-0 snap-start rounded-xl border border-border bg-card p-5 transition-all hover:card-shadow-hover hover:scale-[1.01] flex flex-col"
                          >
                            <h3 className="font-semibold text-foreground text-base">{t.name}</h3>
                            {t.sub_test_count > 0 && (
                              <button
                                type="button"
                                onClick={() => setTestDetail(t)}
                                className="inline-flex items-center gap-0.5 mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary w-fit hover:bg-primary/20 transition-colors"
                              >
                                <FlaskConical className="h-3 w-3" /> {t.sub_test_count} parameters
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              Report: {t.report_time}
                            </p>
                            {t.sample_type && (
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Droplets className="h-3.5 w-3.5 text-primary" />
                                Sample: {t.sample_type}
                              </p>
                            )}
                            <div className="mt-auto pt-4">
                              <div className="flex items-baseline gap-2">
                                <span className="font-display text-xl font-bold text-primary">₹{t.price}</span>
                                {t.original_price && t.original_price > t.price && (
                                  <span className="text-sm text-muted-foreground line-through">₹{t.original_price}</span>
                                )}
                              </div>
                              {discountPct > 0 && (
                                <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                                  {discountPct}% OFF
                                </span>
                              )}
                            </div>
                            <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                              <Link to={"/book?test=" + encodeURIComponent(t.name)}>Book Now</Link>
                            </Button>
                          </motion.div>
                        );
                      })}
                    </HorizontalScroll>
                  )}
                  <div className="mt-8 text-center">
                    <Button asChild variant="outline"><Link to="/tests">View All Tests <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  </div>
                </div>
              </section>
            );

          case "health_packages":
            return (
              <section key="health_packages" className="container py-20">
                <SectionHeading title="Health Packages" subtitle="Comprehensive health checkup packages at affordable prices" />
                {packagesQuery.error && (
                  <div className="max-w-md mx-auto mb-6">
                    <ErrorBox title="Failed to load packages" message={String(packagesQuery.error)} onRetry={() => packagesQuery.refetch()} />
                  </div>
                )}
                {packagesQuery.isLoading ? (
                  <HorizontalScroll autoScroll className="pt-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="w-[300px] flex-shrink-0 snap-start rounded-xl border border-border p-6">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <Skeleton className="h-10 w-28 mb-4" />
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-5/6" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                        <Skeleton className="mt-6 h-10 w-full" />
                      </div>
                    ))}
                  </HorizontalScroll>
                ) : (
                  <HorizontalScroll autoScroll className="pt-5">
                    {activePackages.map((pkg: any, i: number) => {
                      const allTests = testNames[pkg.id] ?? [];
                      const allTestIds: string[] = packagesQuery.data?.testIds?.[pkg.id] ?? [];
                      const featuredIds: string[] = pkg.featured_test_ids ?? [];
                      const displayTests = featuredIds.length > 0
                        ? featuredIds
                            .map((fid: string) => {
                              const idx = allTestIds.indexOf(fid);
                              return idx >= 0 ? allTests[idx] : null;
                            })
                            .filter(Boolean)
                            .slice(0, 5) as string[]
                        : allTests.slice(0, 5);
                      const extraCount = allTests.length - displayTests.length;
                      const savings = getSavings(pkg);
                      const price = pkg.discounted_price ?? pkg.original_price;
                      const hasDiscount = pkg.discounted_price && pkg.discounted_price < pkg.original_price;
                      const discountPct = hasDiscount ? Math.round(((pkg.original_price - pkg.discounted_price) / pkg.original_price) * 100) : 0;
                      const totalCount = totalTestCounts[pkg.id] ?? allTests.length;

                      return (
                        <motion.div
                          key={pkg.id}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true }}
                          variants={fadeUp}
                          custom={i}
                          className={`w-[300px] flex-shrink-0 snap-start relative flex flex-col rounded-xl border p-6 pt-8 transition-all hover:card-shadow-hover hover:scale-[1.02] ${pkg.is_popular ? "border-primary ring-2 ring-primary/20 bg-accent/50" : "border-border bg-card"}`}
                        >
                          {pkg.is_popular && (
                            <span className="absolute -top-3 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                              <Star className="h-3 w-3" /> Most Popular
                            </span>
                          )}
                          {hasDiscount && (
                            <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground shadow-sm">
                               {discountPct}% OFF
                            </span>
                          )}
                          <div className="flex items-start justify-between">
                            <h3 className="font-display text-lg font-semibold text-foreground">{pkg.name}</h3>
                            {pkg.instructions && (
                              isMobile ? (
                                <button
                                  type="button"
                                  onClick={() => setInstructionsModal({ name: pkg.name, text: pkg.instructions })}
                                  className="shrink-0 ml-2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Info className="h-4 w-4" />
                                </button>
                              ) : (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <button type="button" className="shrink-0 ml-2 text-muted-foreground hover:text-primary transition-colors">
                                      <Info className="h-4 w-4" />
                                    </button>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="max-w-xs text-sm">
                                    <p className="font-medium text-foreground mb-1">Instructions</p>
                                    <p className="text-muted-foreground whitespace-pre-line">{pkg.instructions}</p>
                                  </HoverCardContent>
                                </HoverCard>
                              )
                            )}
                          </div>
                          {pkg.description && (
                            <div className="mt-1">
                              <p className="text-sm text-muted-foreground line-clamp-3 text-justify">
                                {pkg.description}
                              </p>
                              <button
                                type="button"
                                onClick={() => setDetailPkg({ pkg })}
                                className="text-xs font-medium text-primary hover:underline mt-0.5"
                              >
                                Read more →
                              </button>
                            </div>
                          )}
                          <div className="mt-3">
                            <div className="flex items-baseline gap-2">
                              <span className="font-display text-3xl font-bold text-primary">₹{price}</span>
                              {hasDiscount && (
                                <span className="text-sm text-muted-foreground line-through">₹{pkg.original_price}</span>
                              )}
                            </div>
                            {savings > 0 && (
                              <p className="text-xs font-semibold text-primary mt-0.5">Save ₹{savings}</p>
                            )}
                          </div>
                          {pkg.show_test_count !== false && totalCount > 0 && (
                            <p className="mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              🧪 {totalCount} Tests Included
                            </p>
                          )}
                          {displayTests.length > 0 && (
                            <ul className="mt-2 flex-1 space-y-1.5">
                              {displayTests.map((t: string) => {
                                const subCount = testSubCounts[pkg.id]?.[t] ?? 0;
                                return (
                                  <li key={t}>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                                      <span className="flex-1">{t}</span>
                                      {subCount > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => setDetailPkg({ pkg, defaultExpandTest: t })}
                                          className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/70 hover:text-primary transition-colors shrink-0"
                                        >
                                          ({subCount})
                                          <ChevronRight className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                              {extraCount > 0 && (
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => setDetailPkg({ pkg })}
                                    className="text-xs font-medium text-primary hover:underline"
                                  >
                                    +{extraCount} more tests
                                  </button>
                                </li>
                              )}
                            </ul>
                          )}
                          <Button asChild className="mt-5 w-full" size="sm" variant={pkg.is_popular ? "default" : "outline"}>
                            <Link to={"/book?package=" + encodeURIComponent(pkg.name)}>Book Now</Link>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </HorizontalScroll>
                )}
              </section>
            );

          case "doctors":
            return (
              <section key="doctors" className="bg-section-gradient py-20">
                <div className="container">
                  <SectionHeading title="Our Expert Doctors" subtitle="Meet our team of qualified healthcare professionals" />
                  {doctorsQuery.isLoading ? (
                    <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card text-center">
                          <Skeleton className="aspect-square w-full" />
                          <div className="p-4 space-y-2">
                            <Skeleton className="h-4 w-32 mx-auto" />
                            <Skeleton className="h-3 w-24 mx-auto" />
                            <Skeleton className="h-3 w-20 mx-auto" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`grid gap-6 max-w-3xl mx-auto ${(() => { const docs = (doctorsQuery.data ?? []).filter((d: any) => d.is_active !== false); const len = docs.length; return len >= 3 ? "sm:grid-cols-3" : len === 1 ? "grid-cols-1 place-items-center" : "sm:grid-cols-2 justify-items-center"; })()}`}>
                      {(doctorsQuery.data ?? []).filter((d: any) => d.is_active !== false).map((d: any, i: number) => (
                        <motion.div key={d.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                          className="overflow-hidden rounded-xl border border-border bg-card text-center card-shadow transition-all hover:card-shadow-hover hover:scale-[1.02] w-full max-w-[280px]">
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
                  )}
                </div>
              </section>
            );

          case "testimonials":
            return <Testimonials key="testimonials" />;

          case "service_areas":
            return (
              <section key="service_areas" className="container py-20">
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
            );

          case "faqs":
            return (faqsQuery.data ?? []).length > 0 ? (
              <section key="faqs" className="bg-section-gradient py-20">
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
            ) : null;

          case "cta":
            return (
              <section key="cta" className="container py-20">
                <div className="rounded-2xl bg-primary p-10 text-center md:p-16">
                  <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">Ready to Book Your Health Checkup?</h2>
                  <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">Schedule your appointment today and get accurate diagnostic results from our ISO certified lab.</p>
                  <Button asChild size="lg" variant="secondary" className="mt-6"><Link to="/book">Book Appointment <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}

      {/* Certification Preview */}
      <CertificatePreview cert={certPreview} open={!!certPreview} onClose={() => setCertPreview(null)} />

      {/* Instructions Modal (mobile) */}
      <Dialog open={!!instructionsModal} onOpenChange={(o) => !o && setInstructionsModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>{instructionsModal?.name} — Instructions</DialogTitle>
          <p className="text-sm text-muted-foreground whitespace-pre-line mt-2">{instructionsModal?.text}</p>
        </DialogContent>
      </Dialog>

      {/* Package Detail Dialog */}
      <PackageDetailDialog
        pkg={detailPkg?.pkg ?? null}
        allTests={detailPkg ? (testNames[detailPkg.pkg.id] ?? []) : []}
        totalTestCount={detailPkg ? (totalTestCounts[detailPkg.pkg.id] ?? 0) : 0}
        testSubCounts={detailPkg ? (testSubCounts[detailPkg.pkg.id] ?? {}) : {}}
        testSubNames={detailPkg ? (testSubNames[detailPkg.pkg.id] ?? {}) : {}}
        defaultExpandTest={detailPkg?.defaultExpandTest}
        open={!!detailPkg}
        onClose={() => setDetailPkg(null)}
      />

      {/* Test Detail Dialog */}
      <TestDetailDialog
        test={testDetail}
        open={!!testDetail}
        onClose={() => setTestDetail(null)}
      />
    </>
  );
};

export default Index;
