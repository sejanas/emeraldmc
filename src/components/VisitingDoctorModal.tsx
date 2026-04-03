import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, ExternalLink, Star, Clock, Users } from "lucide-react";
import { VISITING_DOCTOR_EVENT, isVisitActive } from "@/data/visitingDoctorEvent";

const STORAGE_KEY = "visiting-doctor-popup";

const VisitingDoctorModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isVisitActive()) return;
    const shown = sessionStorage.getItem(STORAGE_KEY);
    if (shown) return;
    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const daysUntil = useMemo(() => {
    const start = new Date(VISITING_DOCTOR_EVENT.visitStart + "T00:00:00");
    const now = new Date();
    const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, []);

  if (!isVisitActive()) return null;

  const urgencyText = daysUntil > 1 ? `Starts in ${daysUntil} days` : daysUntil === 1 ? "Starts tomorrow!" : "Happening now!";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Visiting Doctor — {VISITING_DOCTOR_EVENT.name}</DialogTitle>

        <div className="flex flex-col md:flex-row">
          {/* Left: Doctor photo — full height on desktop, banner on mobile */}
          <div className="relative md:w-[260px] shrink-0 bg-primary/10 overflow-hidden">
            <img
              src={VISITING_DOCTOR_EVENT.imageUrl}
              alt={VISITING_DOCTOR_EVENT.name}
              className="h-56 md:h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/50 to-transparent" />
            {/* Badges over image — bottom-left */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
              <Badge className="bg-green-500 text-white border-0 font-bold text-sm px-3 py-1 w-fit">FREE CAMP</Badge>
              <Badge variant="secondary" className="font-semibold w-fit">
                <Calendar className="h-3 w-3 mr-1" />
                {VISITING_DOCTOR_EVENT.visitLabel}
              </Badge>
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex-1 p-6 md:p-7 space-y-4 overflow-y-auto max-h-[70vh] md:max-h-[80vh]">
            {/* Urgency pill */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 px-3 py-1 text-xs font-bold animate-pulse">
                <Clock className="h-3 w-3" />
                {urgencyText}
              </span>
            </div>

            {/* Doctor info */}
            <div>
              <h2 className="text-2xl font-bold text-foreground leading-tight">{VISITING_DOCTOR_EVENT.name}</h2>
              <p className="text-sm text-primary font-semibold mt-1">{VISITING_DOCTOR_EVENT.credentials}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{VISITING_DOCTOR_EVENT.organisation}</p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{VISITING_DOCTOR_EVENT.bio}</p>

            {/* Trust stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-accent/60 p-2.5">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">{VISITING_DOCTOR_EVENT.experience} Experience</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-accent/60 p-2.5">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">1000+ Couples Helped</span>
              </div>
            </div>

            {/* Specialties */}
            <div className="flex flex-wrap gap-1.5">
              {VISITING_DOCTOR_EVENT.specialties.map((s) => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>

            {/* Free callout */}
            <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3 text-sm flex items-start gap-2">
              <Star className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <span className="text-foreground font-medium">Registration & consultation are <span className="text-green-600 dark:text-green-400 font-bold">completely free</span>. Limited slots available.</span>
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
                className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
