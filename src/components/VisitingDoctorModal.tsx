import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, ExternalLink, Star, Clock, Users } from "lucide-react";
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
      <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[92svh]">
        <DialogTitle className="sr-only">Visiting Doctor — {VISITING_DOCTOR_EVENT.name}</DialogTitle>

        <div className="flex flex-col md:flex-row h-full">
          {/* Left: Doctor photo — fixed height on mobile, full height on desktop */}
          <div className="relative md:w-[260px] shrink-0 bg-primary/10 overflow-hidden">
            <img
              src={VISITING_DOCTOR_EVENT.imageUrl}
              alt={VISITING_DOCTOR_EVENT.name}
              className="h-44 md:h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 to-transparent" />
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
          <div className="flex-1 p-4 md:p-7 space-y-3.5 overflow-y-auto">
            {/* Urgency pill + Brand logo — one row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 px-3 py-1 text-xs font-bold animate-pulse shrink-0">
                <Clock className="h-3 w-3" />
                {urgencyText}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="bg-white rounded-md px-2 py-0.5 shrink-0">
                  <img
                    src={VISITING_DOCTOR_EVENT.brandLogoUrl}
                    alt="The Hive Fertility"
                    className="h-5 w-auto"
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium truncate">{VISITING_DOCTOR_EVENT.organisation}</span>
              </div>
            </div>

            {/* Doctor info */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{VISITING_DOCTOR_EVENT.name}</h2>
              <p className="text-sm font-bold text-foreground mt-1">{VISITING_DOCTOR_EVENT.role}</p>
              <p className="text-xs text-primary font-semibold mt-0.5">{VISITING_DOCTOR_EVENT.credentials}</p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{VISITING_DOCTOR_EVENT.bio}</p>

            {/* Trust stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-accent/60 p-2.5">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">{VISITING_DOCTOR_EVENT.experience} Experience</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-accent/60 p-2.5">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">1000+ Couples Helped</span>
              </div>
            </div>

            {/* Specialties — cap at 4 on mobile, show all on desktop */}
            <div className="flex flex-wrap gap-1.5">
              {VISITING_DOCTOR_EVENT.specialties.slice(0, 4).map((s) => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
              {VISITING_DOCTOR_EVENT.specialties.length > 4 && (
                <Badge variant="outline" className="text-xs md:hidden">+{VISITING_DOCTOR_EVENT.specialties.length - 4} more</Badge>
              )}
              {VISITING_DOCTOR_EVENT.specialties.slice(4).map((s) => (
                <Badge key={s} variant="outline" className="text-xs hidden md:inline-flex">{s}</Badge>
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
