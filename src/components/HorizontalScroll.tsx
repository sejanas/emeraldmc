import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
  loop?: boolean;
  forwardOnly?: boolean;
  /** Enable continuous auto-scrolling (marquee). Speed in px/frame, default 0.5 */
  autoScroll?: boolean | number;
}

const HorizontalScroll = ({ children, className, loop, forwardOnly, autoScroll }: HorizontalScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const pausedRef = useRef(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  // Prevent horizontal scroll container from trapping vertical wheel events
  const handleWheel = useCallback((e: WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    // If scrolling is primarily vertical, redirect to page scroll
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      window.scrollBy({ top: e.deltaY, left: 0 });
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    el.addEventListener("wheel", handleWheel, { passive: false });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      el.removeEventListener("wheel", handleWheel);
      ro.disconnect();
    };
  }, [handleWheel]);

  // Auto-scroll (marquee) effect
  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (!el) return;
    const speed = typeof autoScroll === "number" ? autoScroll : 0.5;
    let animId: number;

    const step = () => {
      if (!pausedRef.current && el) {
        el.scrollLeft += speed;
        // Loop back when reaching end
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    const pause = () => { pausedRef.current = true; };
    const resume = () => { pausedRef.current = false; };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [autoScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    // Pause autoscroll for 1.2s so the smooth scroll is not overridden
    pausedRef.current = true;
    setTimeout(() => { pausedRef.current = false; }, 1200);
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
    const atStart = el.scrollLeft <= 2;
    if ((loop || forwardOnly) && dir === "right" && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (loop && dir === "left" && atStart) {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      return;
    }
    const distance = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -distance : distance, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      {!forwardOnly && (canScrollLeft || loop) && (
        <Button
          variant="outline"
          size="icon"
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-md bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none pb-2",
          "-mx-1 px-1",
          className
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
      {(canScrollRight || loop || forwardOnly) && (
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-md bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default HorizontalScroll;
