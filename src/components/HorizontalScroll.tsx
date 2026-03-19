import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
  loop?: boolean;
  forwardOnly?: boolean;
}

const HorizontalScroll = ({ children, className, loop, forwardOnly }: HorizontalScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
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
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full shadow-md bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
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
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full shadow-md bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default HorizontalScroll;
