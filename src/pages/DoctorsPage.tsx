import { useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import Breadcrumbs from "@/components/Breadcrumbs";
import ErrorBox from "@/components/ErrorBox";
import PageMeta from "@/components/PageMeta";
import useDoctors from "@/hooks/useDoctors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const DoctorsPage = () => {
  const doctorsQuery = useDoctors();
  const doctors = (doctorsQuery.data ?? []).filter((d: any) => d.is_active !== false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);

  return (
    <div className="container py-12">
      <PageMeta title="Our Doctors – Expert Healthcare Professionals" description="Meet the qualified pathologists and physicians at Shifa's Mainland Healthcare in Sri Vijaya Puram, Port Blair." />
      <Breadcrumbs items={[{ label: "Our Doctors" }]} />
      <SectionHeading title="Our Expert Doctors" subtitle="Meet the qualified healthcare professionals at Emerald Medical Care" />

      <div className={`grid gap-8 max-w-4xl mx-auto ${doctors.length >= 3 ? "sm:grid-cols-3" : doctors.length === 1 ? "grid-cols-1 place-items-center" : "sm:grid-cols-2 justify-items-center"}`}>
        {doctorsQuery.error && (
          <div className="col-span-3 p-6">
            <ErrorBox title="Failed to load doctors" message={doctorsQuery.error} onRetry={() => doctorsQuery.refetch()} />
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
              {d.bio && (
                <>
                  <p className="mt-2 text-sm text-muted-foreground text-justify line-clamp-4">{d.bio}</p>
                  <button
                    onClick={() => setSelectedDoctor(d)}
                    className="mt-1.5 text-xs font-medium text-primary hover:underline focus:outline-none"
                  >
                    Read More
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      {doctorsQuery.isLoading === false && doctors.length === 0 && <p className="py-12 text-center text-muted-foreground">No doctors listed yet.</p>}

      {/* Doctor Detail Modal */}
      <Dialog open={!!selectedDoctor} onOpenChange={(open) => !open && setSelectedDoctor(null)}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          {selectedDoctor && (
            <>
              {/* Header */}
              <div className="flex gap-4 p-5 pb-4 border-b border-border">
                {selectedDoctor.profile_image ? (
                  <img
                    src={selectedDoctor.profile_image}
                    alt={selectedDoctor.name}
                    className="h-20 w-20 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <span className="text-3xl text-muted-foreground font-display">{selectedDoctor.name?.[0]}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="font-display text-lg font-semibold text-foreground leading-tight">
                    {selectedDoctor.name}
                  </DialogTitle>
                  {selectedDoctor.specialization && (
                    <p className="text-sm font-medium text-primary mt-0.5">{selectedDoctor.specialization}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedDoctor.experience_years && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedDoctor.experience_years} Years Experience
                      </Badge>
                    )}
                    {selectedDoctor.qualification && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {selectedDoctor.qualification}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedDoctor.bio && (
                <ScrollArea className="max-h-[55vh]">
                  <p className="px-5 py-4 text-sm text-muted-foreground leading-relaxed text-justify whitespace-pre-line">
                    {selectedDoctor.bio}
                  </p>
                </ScrollArea>
              )}

              {/* Footer */}
              <div className="p-4 border-t border-border">
                <Button asChild className="w-full">
                  <Link to="/book" onClick={() => setSelectedDoctor(null)}>
                    Book Appointment <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorsPage;
