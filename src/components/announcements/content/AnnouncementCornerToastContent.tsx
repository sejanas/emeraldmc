import { Link } from "react-router-dom";
import { X } from "lucide-react";
import type { Announcement, Placement } from "@/lib/announcements";
import { AnnouncementBody, AnnouncementIcon, useResolvedTheme } from "../BaseRenderer";

export interface AnnouncementCornerToastContentProps {
  announcement: Announcement;
  placement?: Placement;
  onDismiss?: () => void;
  onCta?: (which: "primary" | "secondary") => void;
  showDismiss?: boolean;
}

export function AnnouncementCornerToastContent({
  announcement: a,
  onDismiss,
  onCta,
  showDismiss = true,
}: AnnouncementCornerToastContentProps) {
  const { accent } = useResolvedTheme(a);

  return (
    <div className="flex gap-3 p-4">
      {a.icon && (
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: accent }}
        >
          <AnnouncementIcon name={a.icon} className="h-4 w-4" />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{a.title}</p>
        <AnnouncementBody html={a.body ?? ""} className="mt-1 text-xs text-muted-foreground" />
        {a.primary_cta_label && a.primary_cta_url && (
          <div className="mt-2">
            <CtaLink url={a.primary_cta_url} onClick={() => onCta?.("primary")}>
              {a.primary_cta_label} →
            </CtaLink>
          </div>
        )}
      </div>
      {showDismiss && a.dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function CtaLink({ url, children, onClick }: { url: string; children: React.ReactNode; onClick?: () => void }) {
  const isInternal = url.startsWith("/") || url.startsWith("#");
  const cls = "text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-80";
  return isInternal ? (
    <Link to={url} className={cls} onClick={onClick}>{children}</Link>
  ) : (
    <a href={url} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>{children}</a>
  );
}
