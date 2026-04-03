import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { testDetails } from "@/data/testInfo";
import { businessInfo } from "@/data/siteData";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageMeta from "@/components/PageMeta";
import JsonLd, { createTestPageSchema, createFaqSchema } from "@/components/JsonLd";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Phone, Clock, FlaskConical, UserCheck, CheckCircle, Droplets, AlertCircle } from "lucide-react";
import NotFound from "./NotFound";
import useTests from "@/hooks/useTests";
import { useSubTests } from "@/hooks/useSubTests";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ─── Static detail page (rich content from testInfo.ts) ─── */
const StaticTestDetail = ({ info }: { info: (typeof testDetails)[0] }) => {
  const testSchema = createTestPageSchema({
    name: info.fullName,
    description: info.whatIs,
    price: 0,
    sample_type: "Blood",
    report_time: "Same Day",
  });
  const faqSchema = createFaqSchema(info.faq);

  return (
    <article className="container py-12 max-w-3xl mx-auto">
      <PageMeta
        title={`${info.fullName} in Port Blair – Price, Preparation, Normal Range`}
        description={`Get ${info.fullName} at Emerald Medical Care in Sri Vijaya Puram, Port Blair. ISO certified lab with same-day reports. ${info.whatIs.slice(0, 100)}`}
        canonical={`https://www.wellnessandaman.com/tests/${info.slug}`}
      />
      <JsonLd schema={testSchema} />
      <JsonLd schema={faqSchema} />

      <Breadcrumbs items={[{ label: "Diagnostic Tests", href: "/tests" }, { label: info.fullName }]} />

      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">
          {info.fullName} in Port Blair
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary"><FlaskConical className="h-3 w-3 mr-1" /> Blood Test</Badge>
          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Same Day Reports</Badge>
          <Badge variant="outline">ISO Certified Lab</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
          <UserCheck className="h-4 w-4" /> Reviewed by Dr. Ashok Menon, MD Pathology, 15+ Years Experience
        </p>
      </motion.header>

      {[
        { title: `What is a ${info.name} Test?`, content: info.whatIs },
        { title: `Why is a ${info.name} Test Done?`, content: info.whyDone },
        { title: `Preparation for ${info.name} Test`, content: info.preparation },
      ].map((section) => (
        <motion.section key={section.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-3">{section.title}</h2>
          <p className="text-muted-foreground leading-relaxed">{section.content}</p>
        </motion.section>
      ))}

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-3">Normal {info.name} Range</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-accent">
                <th className="text-left p-3 font-medium text-foreground">Parameter</th>
                <th className="text-left p-3 font-medium text-foreground">Normal Range</th>
              </tr>
            </thead>
            <tbody>
              {info.normalRanges.map((r, i) => (
                <motion.tr key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="border-t border-border">
                  <td className="p-3 text-foreground">{r.parameter}</td>
                  <td className="p-3 text-muted-foreground">{r.range}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-3">{info.name} Test Availability in Port Blair</h2>
        <p className="text-muted-foreground leading-relaxed">
          {info.fullName} is available at {businessInfo.name}, an ISO certified diagnostic laboratory
          located in Sri Vijaya Puram, Port Blair, Andaman and Nicobar Islands. We offer same-day reports
          and free home sample collection across Port Blair, Wimberlygunj, Bambooflat, and Ferrargunj.
        </p>
      </motion.section>

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible>
          {info.faq.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary transition-colors">{f.question}</AccordionTrigger>
              <AccordionContent><p className="text-muted-foreground">{f.answer}</p></AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.section>

      <BookCTA name={info.name} />
    </article>
  );
};

/* ─── DB-backed test detail page ─── */
const DbTestDetail = ({ test }: { test: any }) => {
  const subTestsQuery = useSubTests(test.is_sub_test ? null : test.id);
  const subTests = subTestsQuery.data ?? [];
  const visibleSubs = subTests.filter((s: any) => s.is_visible);
  const price = test.discounted_price ?? test.price;

  return (
    <article className="container py-12 max-w-3xl mx-auto">
      <PageMeta
        title={`${test.name} – Price & Details`}
        description={test.description || `Book ${test.name} at Emerald Medical Care, Port Blair. Transparent pricing & same-day reports.`}
        canonical={test.slug ? `https://www.wellnessandaman.com/tests/${test.slug}` : undefined}
      />
      <Breadcrumbs items={[{ label: "Diagnostic Tests", href: "/tests" }, { label: test.name }]} />

      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">{test.name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {test.sample_type && <Badge variant="secondary"><Droplets className="h-3 w-3 mr-1" /> {test.sample_type}</Badge>}
          {test.report_time && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> {test.report_time}</Badge>}
          {test.fasting_required && <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Fasting Required</Badge>}
        </div>
        {test.is_sub_test && test.parent_test_name && (
          <p className="mt-2 text-sm text-primary font-medium">Part of {test.parent_test_name}</p>
        )}
      </motion.header>

      {test.description && (
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-3">About This Test</h2>
          <p className="text-muted-foreground leading-relaxed">{test.description}</p>
        </motion.section>
      )}

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-3">Pricing</h2>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-4xl font-bold text-primary">₹{price}</span>
          {test.original_price && test.original_price > price && (
            <span className="text-lg text-muted-foreground line-through">₹{test.original_price}</span>
          )}
        </div>
      </motion.section>

      {/* Parameters section for parent tests */}
      {!test.is_sub_test && visibleSubs.length > 0 && (
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-3">Parameters Included ({visibleSubs.length})</h2>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {visibleSubs.map((s: any) => (
              <li key={s.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" /> {s.name}
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      <BookCTA name={test.name} />
    </article>
  );
};

/* ─── Shared CTA buttons ─── */
const BookCTA = ({ name }: { name: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col sm:flex-row gap-3 mt-10">
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Button asChild size="lg">
        <Link to={"/book?test=" + encodeURIComponent(name)}>Book {name} Test <ArrowRight className="ml-2 h-4 w-4" /></Link>
      </Button>
    </motion.div>
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Button asChild variant="outline" size="lg">
        <a href={`tel:${businessInfo.phone}`}><Phone className="mr-2 h-4 w-4" /> Call to Book</a>
      </Button>
    </motion.div>
  </motion.div>
);

/* ─── Main page component ─── */
const TestDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const staticInfo = testDetails.find((t) => t.slug === slug);

  // Only query DB when static lookup misses
  const testsQuery = useTests({ active: true, enabled: !staticInfo });
  const dbTest = !staticInfo
    ? (testsQuery.data ?? []).find((t: any) => t.slug === slug)
    : undefined;

  if (staticInfo) return <StaticTestDetail info={staticInfo} />;

  if (testsQuery.isLoading) {
    return (
      <div className="container py-12 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!dbTest) return <NotFound />;

  return <DbTestDetail test={dbTest} />;
};

export default TestDetailPage;
