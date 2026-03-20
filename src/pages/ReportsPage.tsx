import PageMeta from "@/components/PageMeta";
import { motion } from "framer-motion";
import { FileDown, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ReportsPage = () => {
  const { data: allSettings } = useSiteSettings();

  const reportConfig = (() => {
    if (!allSettings || !Array.isArray(allSettings)) return null;
    return allSettings.find((s: any) => s.key === "report_instructions")?.value ?? null;
  })();
  const portalUrl = reportConfig?.portal_url || "https://www.quantahims.com/";
  const instructions = reportConfig?.instructions || "Login with the credentials received over WhatsApp to view and download your reports.";

  const steps = [
    "Visit the report portal using the button below.",
    "Enter the login credentials you received via WhatsApp.",
    "View and download your diagnostic reports.",
  ];

  return (
    <div className="container py-12">
      <PageMeta title="Download Reports" description="Access and download your diagnostic test reports from Shifa's Mainland Healthcare online portal." />
      <Breadcrumbs items={[{ label: "Reports" }]} />
      <SectionHeading title="Download Your Reports" subtitle="Access your diagnostic reports through our online portal" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-lg"
      >
        <div className="rounded-xl border border-border bg-card p-8 card-shadow space-y-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
          >
            <FileDown className="h-8 w-8 text-primary" />
          </motion.div>

          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Report Portal</h2>
            <p className="mt-2 text-sm text-muted-foreground">{instructions}</p>
          </div>

          <div className="text-left space-y-3">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground pt-0.5">{step}</p>
              </motion.div>
            ))}
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button asChild className="w-full" size="lg">
              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Open Report Portal
              </a>
            </Button>
          </motion.div>

          <p className="text-xs text-muted-foreground">
            Need help? Call us at{" "}
            <a href="tel:+917679348684" className="text-primary hover:underline">+91 7679348684</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportsPage;
