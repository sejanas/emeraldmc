import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Announcement } from "@/lib/announcements";
import { AnnouncementBody, AnnouncementIcon, useResolvedTheme } from "../BaseRenderer";

export interface AnnouncementPopupContentProps {
  announcement: Announcement;
  onCta?: (which: "primary" | "secondary") => void;
  onPrimaryAction?: () => void;
}

export function AnnouncementPopupContent({
  announcement: a,
  onCta,
  onPrimaryAction,
}: AnnouncementPopupContentProps) {
  const { accent } = useResolvedTheme(a);

  return (
    <>
      {a.image_url ? (
        <div className="aspect-video w-full overflow-hidden">
          <img src={a.image_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          {a.icon && (
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: accent }}
            >
              <AnnouncementIcon name={a.icon} className="h-4 w-4" />
            </span>
          )}
          <h2 className="text-xl font-bold">{a.title}</h2>
        </div>
        <AnnouncementBody html={a.body ?? ""} className="text-sm text-muted-foreground leading-relaxed" />
        <div className="flex flex-col gap-2 pt-2">
          {a.primary_cta_label && a.primary_cta_url && (
            <CtaButton
              url={a.primary_cta_url}
              onClick={() => {
                onCta?.("primary");
                onPrimaryAction?.();
              }}
            >
              {a.primary_cta_label}
            </CtaButton>
          )}
          {a.secondary_cta_label && a.secondary_cta_url && (
            <SecondaryLink url={a.secondary_cta_url} onClick={() => onCta?.("secondary")}>
              {a.secondary_cta_label}
            </SecondaryLink>
          )}
        </div>
      </div>
    </>
  );
}

function CtaButton({ url, onClick, children }: { url: string; onClick?: () => void; children: React.ReactNode }) {
  const isInternal = url.startsWith("/") || url.startsWith("#");
  if (isInternal) {
    return (
      <Button asChild className="w-full font-semibold">
        <Link to={url} onClick={onClick}>{children}</Link>
      </Button>
    );
  }
  return (
    <Button asChild className="w-full font-semibold">
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClick}>{children}</a>
    </Button>
  );
}

function SecondaryLink({ url, onClick, children }: { url: string; onClick?: () => void; children: React.ReactNode }) {
  const isInternal = url.startsWith("/") || url.startsWith("#");
  const cls = "flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1";
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
