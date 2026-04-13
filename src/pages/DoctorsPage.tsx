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
import { ArrowRight, ExternalLink } from "lucide-react";
import { VISITING_DOCTOR_EVENT, isVisitActive } from "@/data/visitingDoctorEvent";

const DoctorsPage = () => {
  const doctorsQuery = useDoctors();
  const doctors = (doctorsQuery.data ?? []).filter((d: any) => d.is_active !== false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);

  return (
    <div className="container py-12">
      <PageMeta title="Our Doctors – Expert Healthcare Professionals" description="Meet the qualified pathologists and physicians at Shifa's Mainland Healthcare in Sri Vijaya Puram, Port Blair." />
      <Breadcrumbs items={[{ label: "Our Doctors" }]} />
      <SectionHeading title="Our Expert Doctors" subtitle="Meet the qualified healthcare professionals at Emerald Medical Care" />

      {/* Visiting Doctor Banner */}
      {isVisitActive() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 overflow-hidden rounded-2xl border-2 border-primary/30 bg-card card-shadow max-w-4xl mx-auto"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="relative sm:w-48 shrink-0">
              <img
                src={VISITING_DOCTOR_EVENT.imageUrl}
                alt={VISITING_DOCTOR_EVENT.name}
                className="h-52 w-full object-cover object-top sm:h-full"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent sm:bg-gradient-to-r" />
            </div>
            <div className="flex-1 p-5 sm:p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-green-500 text-white border-0 font-bold">FREE CAMP</Badge>
                <Badge variant="outline" className="font-semibold text-primary border-primary/30">VISITING SPECIALIST</Badge>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">{VISITING_DOCTOR_EVENT.name}</h3>
              <p className="text-sm font-bold text-foreground mt-1">{VISITING_DOCTOR_EVENT.role}</p>
              <p className="text-sm font-semibold text-primary mt-0.5">{VISITING_DOCTOR_EVENT.credentials}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-white rounded-md px-2 py-0.5 shrink-0">
                  <img src={VISITING_DOCTOR_EVENT.brandLogoUrl} alt="The Hive Fertility" className="h-5 w-auto" />
                </div>
                <p className="text-xs text-muted-foreground">{VISITING_DOCTOR_EVENT.organisation}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {VISITING_DOCTOR_EVENT.specialties.map((s) => (
                  <span key={s} className="rounded-full border border-border bg-accent px-2.5 py-0.5 text-xs font-medium text-foreground">{s}</span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-semibold text-foreground">Visiting: <span className="text-primary">{VISITING_DOCTOR_EVENT.visitLabel}</span></span>
                <span className="text-green-600 dark:text-green-400 font-bold">Registration &amp; Consultation FREE</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/book?from=fertility-camp">Book Free Appointment <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={VISITING_DOCTOR_EVENT.sourceUrl} target="_blank" rel="noopener noreferrer">
                    About the Doctor <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
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
