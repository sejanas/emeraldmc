import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Star, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Announcement } from "@/lib/announcements";
import { getTypePreset } from "@/lib/announcements";
import { AnnouncementBody } from "../BaseRenderer";

export interface VisitingDoctorMetadata {
  doctor_name?: string;
  credentials?: string;
  role?: string;
  organisation?: string;
  brand_logo_url?: string;
  specialties?: string[];
  experience?: string;
  visit_label?: string;
  is_free?: boolean;
  badge_label?: string;
  specialist_badge?: string;
  couples_helped_stat?: string;
  free_offer_message?: string;
  urgency_label?: string;
}

const DEFAULT_FREE_OFFER =
  "Registration & consultation are completely free. Limited slots available.";

export interface VisitingDoctorPanelProps {
  announcement: Announcement;
  onCta?: (which: "primary" | "secondary") => void;
  onPrimaryAction?: () => void;
}

export function VisitingDoctorPanel({ announcement: a, onCta, onPrimaryAction }: VisitingDoctorPanelProps) {
  const m = (a.metadata ?? {}) as VisitingDoctorMetadata;
  const typePreset = getTypePreset(a.type);

  const specialistBadge = m.specialist_badge?.trim() || typePreset.badgeLabel || "VISITING SPECIALIST";
  const experienceStat = m.experience?.trim();
  const couplesStat =
    m.couples_helped_stat === "" ? null : (m.couples_helped_stat?.trim() || "1000+ Couples Helped");
  const freeOfferMessage = m.free_offer_message?.trim() || DEFAULT_FREE_OFFER;

  const { isLive, urgencyText } = useMemo(() => {
    const override = m.urgency_label?.trim();
    if (override) return { isLive: false, urgencyText: override };

    const now = new Date();
    const start = a.start_at ? new Date(a.start_at) : null;
    const end = a.end_at ? new Date(a.end_at) : null;
    if (!start) return { isLive: false, urgencyText: "" };
    const live = (!end || now <= end) && now >= start;
    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const text = live ? "Happening now!" : daysUntil === 1 ? "Starts tomorrow!" : `Starts in ${daysUntil} days`;
    return { isLive: live, urgencyText: text };
  }, [a.start_at, a.end_at, m.urgency_label]);

  return (
    <div className="flex flex-col md:flex-row min-h-0 bg-background">
      <div className="relative md:w-[260px] shrink-0 bg-primary/10 overflow-hidden min-h-[11rem] md:min-h-[14rem]">
        {a.image_url ? (
          <img
            src={a.image_url}
            alt={m.doctor_name ?? a.title}
            className="h-44 md:h-full w-full object-cover object-top"
            loading="lazy"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
          {(m.badge_label || m.is_free) && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-green-500 text-white px-3 py-1 text-xs font-bold shadow animate-pulse">
              {m.badge_label ?? "FREE CAMP"}
            </span>
          )}
          {m.visit_label && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/60 text-white border border-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
              {m.visit_label}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-7 space-y-3.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs font-semibold">
            {specialistBadge}
          </span>
          {urgencyText && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${isLive ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 animate-pulse" : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"}`}
            >
              <Clock className="h-3 w-3" />
              {urgencyText}
            </span>
          )}
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{m.doctor_name ?? a.title}</h2>
          {m.role && <p className="text-sm font-bold text-foreground mt-1">{m.role}</p>}
          {m.credentials && <p className="text-xs text-primary font-semibold mt-0.5">{m.credentials}</p>}
          {(m.brand_logo_url || m.organisation) && (
            <div className="flex items-center gap-2 mt-1">
              {m.brand_logo_url && (
                <div className="bg-white rounded-md px-2 py-0.5 shrink-0">
                  <img src={m.brand_logo_url} alt={m.organisation ?? ""} className="h-5 w-auto" loading="lazy" />
                </div>
              )}
              {m.organisation && <span className="text-xs text-muted-foreground font-medium">{m.organisation}</span>}
            </div>
          )}
        </div>

        {(experienceStat || couplesStat) && (
          <div className="flex flex-wrap gap-2">
            {experienceStat && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" /> {experienceStat}
              </span>
            )}
            {couplesStat && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-foreground">
                <Users className="h-3.5 w-3.5 text-primary" /> {couplesStat}
              </span>
            )}
          </div>
        )}

        {a.body && <AnnouncementBody html={a.body} className="text-sm text-muted-foreground leading-relaxed" />}

        {Array.isArray(m.specialties) && m.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {m.specialties.map((s) => (
              <span key={s} className="rounded-full border border-border bg-accent px-2.5 py-0.5 text-xs font-medium text-foreground">
                {s}
              </span>
            ))}
          </div>
        )}

        {m.is_free && (
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3 text-sm flex items-start gap-2">
            <Star className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <span className="text-foreground font-medium whitespace-pre-line">{freeOfferMessage}</span>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1 pb-1">
          {a.primary_cta_label && a.primary_cta_url && (
            <CtaPrimary
              url={a.primary_cta_url}
              onClick={() => {
                onCta?.("primary");
                onPrimaryAction?.();
              }}
            >
              {a.primary_cta_label} →
            </CtaPrimary>
          )}
          {a.secondary_cta_label && a.secondary_cta_url && (
            <SecondaryLink url={a.secondary_cta_url} onClick={() => onCta?.("secondary")}>
              {a.secondary_cta_label}
            </SecondaryLink>
          )}
        </div>
      </div>
    </div>
  );
}

function CtaPrimary({ url, onClick, children }: { url: string; onClick?: () => void; children: React.ReactNode }) {
  const isInternal = url.startsWith("/") || url.startsWith("#");
  return (
    <Button asChild className="w-full font-semibold text-base py-5 animate-[pulse_2s_ease-in-out_infinite]">
      {isInternal ? (
        <Link to={url} onClick={onClick}>{children}</Link>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClick}>{children}</a>
      )}
    </Button>
  );
}

function SecondaryLink({ url, onClick, children }: { url: string; onClick?: () => void; children: React.ReactNode }) {
  const cls = "flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1";
  const isInternal = url.startsWith("/") || url.startsWith("#");
  return isInternal ? (
    <Link to={url} className={cls} onClick={onClick}>
      <ExternalLink className="h-3.5 w-3.5" /> {children}
    </Link>
  ) : (
    <a href={url} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>
      <ExternalLink className="h-3.5 w-3.5" /> {children}
    </a>
  );
}
