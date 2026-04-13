import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink, Star, Clock, Users } from "lucide-react";
import { VISITING_DOCTOR_EVENT, isVisitActive } from "@/data/visitingDoctorEvent";

const VisitingDoctorModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isVisitActive()) return;
    const timer = setTimeout(() => {
      setOpen(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const { isLive, urgencyText } = useMemo(() => {
    const now = new Date();
    const start = new Date(VISITING_DOCTOR_EVENT.visitStart + "T00:00:00");
    const end = new Date(VISITING_DOCTOR_EVENT.visitEnd + "T23:59:59");
    const live = now >= start && now <= end;
    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const text = live ? "Happening now!" : daysUntil === 1 ? "Starts tomorrow!" : `Starts in ${daysUntil} days`;
    return { isLive: live, urgencyText: text };
  }, []);

  if (!isVisitActive()) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[92svh]">
        <DialogTitle className="sr-only">Visiting Doctor — {VISITING_DOCTOR_EVENT.name}</DialogTitle>

        <div className="flex flex-col md:flex-row h-full">
          {/* Left: Doctor photo with overlaid badges */}
          <div className="relative md:w-[260px] shrink-0 bg-primary/10 overflow-hidden">
            <img
              src={VISITING_DOCTOR_EVENT.imageUrl}
              alt={VISITING_DOCTOR_EVENT.name}
              className="h-44 md:h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 to-transparent" />
            {/* Overlaid badges */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-green-500 text-white px-3 py-1 text-xs font-bold shadow animate-pulse">
                FREE CAMP
              </span>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/60 text-white border border-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                {VISITING_DOCTOR_EVENT.visitLabel}
              </span>
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex-1 p-4 md:p-7 space-y-3.5 overflow-y-auto">
            {/* Top row: VISITING SPECIALIST + urgency */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs font-semibold">
                VISITING SPECIALIST
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${isLive ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 animate-pulse" : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"}`}>
                <Clock className="h-3 w-3" />
                {urgencyText}
              </span>
            </div>

            {/* Doctor info */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{VISITING_DOCTOR_EVENT.name}</h2>
              <p className="text-sm font-bold text-foreground mt-1">{VISITING_DOCTOR_EVENT.role}</p>
              <p className="text-xs text-primary font-semibold mt-0.5">{VISITING_DOCTOR_EVENT.credentials}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-white rounded-md px-2 py-0.5 shrink-0">
                  <img src={VISITING_DOCTOR_EVENT.brandLogoUrl} alt="The Hive Fertility" className="h-5 w-auto" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{VISITING_DOCTOR_EVENT.organisation}</span>
              </div>
            </div>

            {/* Trust stat pills */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" /> {VISITING_DOCTOR_EVENT.experience} Experience
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-foreground">
                <Users className="h-3.5 w-3.5 text-primary" /> 1000+ Couples Helped
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{VISITING_DOCTOR_EVENT.bio}</p>

            {/* Specialties */}
            <div className="flex flex-wrap gap-1.5">
              {VISITING_DOCTOR_EVENT.specialties.slice(0, 4).map((s) => (
                <span key={s} className="rounded-full border border-border bg-accent px-2.5 py-0.5 text-xs font-medium text-foreground">{s}</span>
              ))}
              {VISITING_DOCTOR_EVENT.specialties.length > 4 && (
                <span className="rounded-full border border-border bg-accent px-2.5 py-0.5 text-xs font-medium text-foreground md:hidden">
                  +{VISITING_DOCTOR_EVENT.specialties.length - 4} more
                </span>
              )}
              {VISITING_DOCTOR_EVENT.specialties.slice(4).map((s) => (
                <span key={s} className="rounded-full border border-border bg-accent px-2.5 py-0.5 text-xs font-medium text-foreground hidden md:inline-flex">{s}</span>
              ))}
            </div>

            {/* Free callout */}
            <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3 text-sm flex items-start gap-2">
              <Star className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <span className="text-foreground font-medium">
                Registration & consultation are <span className="text-green-600 dark:text-green-400 font-bold">completely free</span>. Limited slots available.
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2 pt-1">
              <Button asChild className="w-full font-semibold text-base py-5 animate-[pulse_2s_ease-in-out_infinite]" onClick={() => setOpen(false)}>
                <Link to="/book?from=fertility-camp">Book Free Appointment →</Link>
              </Button>
              <a
                href={VISITING_DOCTOR_EVENT.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Learn more about Dr. Rukkayal
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisitingDoctorModal;
