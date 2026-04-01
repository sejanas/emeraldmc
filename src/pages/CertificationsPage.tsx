import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageMeta from "@/components/PageMeta";
import CertificatePreview from "@/components/CertificatePreview";
import useCertifications from "@/hooks/useCertifications";
import { BadgeCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const CertificationsPage = () => {
  const certsQuery = useCertifications();
  const [certPreview, setCertPreview] = useState<any>(null);
  const certifications = (certsQuery.data ?? []).filter((c: any) => c.is_active !== false);

  return (
    <div className="container py-12">
      <PageMeta
        title="Our Certifications – Quality Standards & Accreditations"
        description="View Shifa's Mainland Healthcare certifications including ISO and NABL accreditations, ensuring world-class diagnostic standards."
      />
      <Breadcrumbs items={[{ label: "Certifications" }]} />
      <SectionHeading title="Our Certifications" subtitle="Trusted quality standards and accreditations that ensure accurate and reliable results" />

      {certsQuery.isLoading ? (
        <div className="flex flex-wrap justify-center gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-48 rounded-xl border border-border bg-card p-6 flex flex-col items-center gap-3">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : certifications.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No certifications listed yet.</p>
      ) : (
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
              {cert.description && (
                <p className="text-xs text-muted-foreground text-center line-clamp-3 text-justify">{cert.description}</p>
              )}
            </motion.button>
          ))}
        </div>
      )}

      <CertificatePreview cert={certPreview} open={!!certPreview} onClose={() => setCertPreview(null)} />
    </div>
  );
};

export default CertificationsPage;
