import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Announcement, Placement } from "@/lib/announcements";
import { AnnouncementBody, AnnouncementIcon, useResolvedTheme } from "./BaseRenderer";

export interface AnnouncementCardProps {
  announcement: Announcement;
  placement: Placement;
  onDismiss?: () => void;
  onCta?: (which: "primary" | "secondary") => void;
  compact?: boolean;
  className?: string;
}

export function AnnouncementCard({
  announcement: a,
  placement,
  onDismiss,
  onCta,
  compact,
  className,
}: AnnouncementCardProps) {
  const { accent, style } = useResolvedTheme(a);
  const hasImage = Boolean(a.image_url?.trim());

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        compact ? "p-3" : "p-5 md:p-6",
        className,
      )}
      style={style}
      data-placement={placement}
    >
      <div
        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className={cn("relative", compact ? "pl-2" : "pl-3")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {a.icon && (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
                  compact ? "h-9 w-9" : "h-11 w-11",
                )}
                style={{ backgroundColor: accent }}
              >
                <AnnouncementIcon name={a.icon} className={compact ? "h-4 w-4" : "h-5 w-5"} />
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <h3
                className={cn(
                  "font-semibold leading-snug text-foreground",
                  compact ? "text-sm" : "text-base md:text-lg",
                )}
              >
                {a.title}
              </h3>
              {a.severity && a.severity !== "info" && (
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: `${accent}18`,
                    color: accent,
                  }}
                >
                  {a.severity}
                </span>
              )}
            </div>
          </div>
          {onDismiss && a.dismissible && (
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {hasImage && (
          <div
            className={cn(
              "mt-4 overflow-hidden rounded-xl border bg-muted/30",
              compact ? "aspect-[2/1]" : "aspect-[16/10] max-h-52",
            )}
          >
            <img
              src={a.image_url!}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        )}

        {a.body?.trim() && (
          <AnnouncementBody
            html={a.body}
            className={cn(
              "mt-3 text-muted-foreground leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0",
              compact ? "text-xs line-clamp-3" : "text-sm",
            )}
          />
        )}

        {(a.primary_cta_label || a.secondary_cta_label) && (
          <div
            className={cn(
              "mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center",
              compact && "mt-3 pt-3",
            )}
          >
            {a.primary_cta_label && a.primary_cta_url && (
              <CardCta
                url={a.primary_cta_url}
                variant="primary"
                accent={accent}
                onClick={() => onCta?.("primary")}
              >
                {a.primary_cta_label}
                <ArrowRight className="h-3.5 w-3.5" />
              </CardCta>
            )}
            {a.secondary_cta_label && a.secondary_cta_url && (
              <CardCta
                url={a.secondary_cta_url}
                variant="secondary"
                accent={accent}
                onClick={() => onCta?.("secondary")}
              >
                {a.secondary_cta_label}
              </CardCta>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function CardCta({
  url,
  children,
  variant,
  accent,
  onClick,
}: {
  url: string;
  children: React.ReactNode;
  variant: "primary" | "secondary";
  accent: string;
  onClick?: () => void;
}) {
  const isInternal = url.startsWith("/") || url.startsWith("#");
  const className =
    variant === "primary"
      ? "inline-flex items-center justify-center gap-1.5 font-semibold"
      : "inline-flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground";

  if (variant === "secondary") {
    const inner = <span className={className}>{children}</span>;
    return isInternal ? (
      <Link to={url} onClick={onClick} className="sm:ml-2">
        {inner}
      </Link>
    ) : (
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClick} className="sm:ml-2">
        {inner}
      </a>
    );
  }

  return (
    <Button
      asChild
      size="sm"
      className="w-full sm:w-auto shadow-sm"
      style={{ backgroundColor: accent }}
    >
      {isInternal ? (
        <Link to={url} onClick={onClick} className="inline-flex items-center gap-1.5">
          {children}
        </Link>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          className="inline-flex items-center gap-1.5"
        >
          {children}
        </a>
      )}
    </Button>
  );
}

