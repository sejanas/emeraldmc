import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import ErrorBox from "@/components/ErrorBox";
import PageMeta from "@/components/PageMeta";
import useDoctors from "@/hooks/useDoctors";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const DoctorsPage = () => {
  const doctorsQuery = useDoctors();
  const doctors = (doctorsQuery.data ?? []).filter((d: any) => d.is_active !== false);

  return (
    <div className="container py-12">
      <PageMeta title="Our Doctors – Expert Healthcare Professionals" description="Meet the qualified pathologists and physicians at Shifa's Mainland Healthcare in Sri Vijaya Puram, Port Blair." />
      <Breadcrumbs items={[{ label: "Our Doctors" }]} />
      <SectionHeading title="Our Expert Doctors" subtitle="Meet the qualified healthcare professionals at Emerald Medical Care" />
      <div className={`grid gap-8 max-w-4xl mx-auto ${doctors.length >= 3 ? "sm:grid-cols-3" : doctors.length === 1 ? "grid-cols-1 place-items-center" : "sm:grid-cols-2 justify-items-center"}`}>
        {doctorsQuery.error && (
          <div className="col-span-3 p-6">
            <ErrorBox title="Failed to load doctors" message={String(doctorsQuery.error)} onRetry={() => doctorsQuery.refetch()} />
          </div>
        )}
        {doctorsQuery.isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card card-shadow text-center w-full max-w-[280px]">
            <Skeleton className="aspect-square w-full" />
            <div className="p-5 space-y-2">
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-3 w-24 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          </div>
        ))}
        {doctors.map((d: any, i: number) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }}
            className="overflow-hidden rounded-xl border border-border bg-card card-shadow text-center transition-all hover:card-shadow-hover hover:scale-[1.02] w-full max-w-[280px]">
            {d.profile_image && <img src={d.profile_image} alt={d.name} className="aspect-square w-full object-cover" loading="lazy" />}
            {!d.profile_image && (
              <div className="aspect-square w-full bg-muted flex items-center justify-center">
                <span className="text-5xl text-muted-foreground font-display">{d.name?.[0]}</span>
              </div>
            )}
            <div className="p-5">
              <h3 className="font-display text-xl font-semibold text-foreground">{d.name}</h3>
              <p className="text-sm font-medium text-primary">{d.specialization}</p>
              {d.experience_years && (
                <Badge variant="secondary" className="mt-2 text-xs">{d.experience_years} Years Experience</Badge>
              )}
              {d.qualification && <p className="text-xs text-muted-foreground mt-1">{d.qualification}</p>}
              {d.bio && <p className="mt-2 text-sm text-muted-foreground text-justify">{d.bio}</p>}
            </div>
          </motion.div>
        ))}
      </div>
      {doctorsQuery.isLoading === false && doctors.length === 0 && <p className="py-12 text-center text-muted-foreground">No doctors listed yet.</p>}
    </div>
  );
};

export default DoctorsPage;
