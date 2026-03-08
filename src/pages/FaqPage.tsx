import { motion } from "framer-motion";
import { useFaqs } from "@/hooks/useFaqs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import ErrorBox from "@/components/ErrorBox";
import PageMeta from "@/components/PageMeta";
import JsonLd, { createFaqSchema } from "@/components/JsonLd";

const FaqPage = () => {
  const { data: faqs, isLoading, error, refetch } = useFaqs(true);
  const faqList = (faqs ?? []) as { id: string; question: string; answer: string }[];

  return (
    <section className="container py-16">
      <PageMeta
        title="FAQs – Frequently Asked Questions"
        description="Find answers to common questions about diagnostic tests, health packages, home sample collection, reports, and services at Emerald Medical Care in Port Blair."
        canonical="https://emeraldmedicalcare.com/faq"
      />
      {faqList.length > 0 && <JsonLd schema={createFaqSchema(faqList)} />}

      <Breadcrumbs items={[{ label: "FAQs" }]} />
      <SectionHeading title="Frequently Asked Questions" subtitle="Find answers to common questions about our services" />

      {error && <ErrorBox title="Failed to load FAQs" message={String(error)} onRetry={refetch} />}

      {isLoading && (
        <div className="max-w-2xl mx-auto space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && faqList.length === 0 && !error && (
        <p className="text-center text-muted-foreground">No FAQs available yet.</p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Accordion type="single" collapsible className="max-w-2xl mx-auto">
          {faqList.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <AccordionItem value={faq.id}>
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
};

export default FaqPage;
