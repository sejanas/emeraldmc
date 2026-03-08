import { useFaqs } from "@/hooks/useFaqs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionHeading from "@/components/SectionHeading";
import ErrorBox from "@/components/ErrorBox";

const FaqPage = () => {
  const { data: faqs, isLoading, error, refetch } = useFaqs(true);

  return (
    <section className="container py-16">
      <SectionHeading title="Frequently Asked Questions" subtitle="Find answers to common questions about our services" />

      {error && <ErrorBox title="Failed to load FAQs" message={String(error)} onRetry={refetch} />}

      {isLoading && (
        <div className="max-w-2xl mx-auto space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && (faqs ?? []).length === 0 && !error && (
        <p className="text-center text-muted-foreground">No FAQs available yet.</p>
      )}

      <Accordion type="single" collapsible className="max-w-2xl mx-auto">
        {(faqs ?? []).map((faq: any) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger className="text-left font-medium text-foreground">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FaqPage;
