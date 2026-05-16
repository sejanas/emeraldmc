import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import type { Announcement, Placement } from "@/lib/announcements";
import { AnnouncementIcon, useResolvedTheme } from "../BaseRenderer";

export interface AnnouncementTopBarContentProps {
  announcement: Announcement;
  placement?: Placement;
  onDismiss?: () => void;
  onCta?: (which: "primary" | "secondary") => void;
  /** When false, hide dismiss control (e.g. admin preview). */
  showDismiss?: boolean;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncatePlain(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
}

export function AnnouncementTopBarContent({
  announcement: a,
  placement = "top_bar",
  onDismiss,
  onCta,
  showDismiss = true,
}: AnnouncementTopBarContentProps) {
  const { accent, style } = useResolvedTheme(a);
  const variant = a.presentation?.[placement]?.variant ?? "slim_strip";

  const meta = (a.metadata ?? {}) as { doctor_name?: string; role?: string; visit_label?: string };
  const barTitle =
    a.type === "visiting_doctor" && meta.doctor_name
      ? `${meta.doctor_name}${meta.role ? ` — ${meta.role.split("&")[0]?.trim() ?? meta.role}` : ""}`
      : a.title;
  const barSubtitle =
    a.type === "visiting_doctor"
      ? meta.visit_label ?? ""
      : a.body
        ? truncatePlain(stripTags(a.body), 72)
        : "";

  const inner: ReactNode = (
    <div className="container flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2.5 text-center text-sm font-medium">
      {a.icon && <AnnouncementIcon name={a.icon} className="h-4 w-4 shrink-0" />}
      <span>
        <span className="font-bold">{barTitle}</span>
        {barSubtitle ? (
          <>
            {" — "}
            <span className="opacity-90">{barSubtitle}</span>
          </>
        ) : null}
      </span>
      {a.primary_cta_label && a.primary_cta_url && (
        <CTALink url={a.primary_cta_url} onClick={() => onCta?.("primary")}>
          {a.primary_cta_label} →
        </CTALink>
      )}
      {showDismiss && a.dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-1 rounded-full p-0.5 hover:bg-white/20 transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div
      className="relative overflow-hidden text-primary-foreground"
      style={{ backgroundColor: accent, ...style }}
      role="status"
      aria-live="polite"
    >
      {variant === "ticker" ? (
        <div className="overflow-hidden">
          <div className="animate-[ticker_25s_linear_infinite] whitespace-nowrap">{inner}</div>
        </div>
      ) : (
        inner
      )}
    </div>
  );
}

function CTALink({ url, children, onClick }: { url: string; children: ReactNode; onClick?: () => void }) {
  const isInternal = url.startsWith("/") || url.startsWith("#");
  const className =
    "underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity shrink-0";
  if (isInternal) {
    return (
      <Link to={url} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
      {children}
    </a>
  );
}
