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
import { ArrowRight, Phone, Clock, FlaskConical, UserCheck } from "lucide-react";
import NotFound from "./NotFound";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const TestDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const info = testDetails.find((t) => t.slug === slug);

  if (!info) return <NotFound />;

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
        canonical={`https://emeraldmedicalcare.com/tests/${info.slug}`}
      />
      <JsonLd schema={testSchema} />
      <JsonLd schema={faqSchema} />

      <Breadcrumbs items={[{ label: "Diagnostic Tests", href: "/tests" }, { label: info.fullName }]} />

      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
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
      ].map((section, i) => (
        <motion.section
          key={section.title}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-8"
        >
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
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="border-t border-border"
                >
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
              <AccordionContent>
                <p className="text-muted-foreground">{f.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col sm:flex-row gap-3 mt-10"
      >
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button asChild size="lg">
            <Link to="/book">Book {info.name} Test <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button asChild variant="outline" size="lg">
            <a href={`tel:${businessInfo.phone}`}><Phone className="mr-2 h-4 w-4" /> Call to Book</a>
          </Button>
        </motion.div>
      </motion.div>
    </article>
  );
};

export default TestDetailPage;
