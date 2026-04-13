import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSlide {
  id: string;
  heading: string;
  subtitle: string;
  image_url: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  fallbackImage: string;
}

const INTERVAL = 6000;

// Stagger container — triggers children one by one
const headingContainerVariants = {
  enter: {},
  center: { transition: { staggerChildren: 0.06 } },
  exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};

const wordVariants = {
  enter: { opacity: 0, y: 22 },
  center: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.25, ease: "easeIn" } },
};

const subtitleVariants = {
  enter: { opacity: 0, y: 16 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

// Image wrapper — slides in/out; inner img does Ken Burns independently
const imageWrapVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 56 : -56 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -56 : 56 }),
};

const HeroCarousel = ({ slides, fallbackImage }: HeroCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const dragStartX = useRef<number | null>(null);

  const count = slides.length;

  const goTo = useCallback(
    (idx: number) => {
      setDirection(idx > current ? 1 : -1);
      setCurrent(idx);
    },
    [current],
  );

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + count) % count);
  }, [count]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % count);
  }, [count]);

  // Auto-advance — timeout resets on every slide change so timer stays in sync with progress bar
  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setTimeout(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % count);
    }, INTERVAL);
    return () => clearTimeout(timer);
  }, [current, paused, count]);

  // Preload next image
  useEffect(() => {
    if (count <= 1) return;
    const nextIdx = (current + 1) % count;
    const img = new Image();
    img.src = slides[nextIdx].image_url;
  }, [current, count, slides]);

  // Swipe / drag support
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 40) delta < 0 ? goNext() : goPrev();
    dragStartX.current = null;
  };

  const slide = slides[current];
  if (!slide) return null;

  // Split heading: last 2 words get accent colour
  const words = slide.heading.split(" ");
  const mainWords = words.slice(0, -2);
  const accentWords = words.slice(-2);

  return (
    <section
      className="relative overflow-hidden bg-section-gradient"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container grid items-center gap-8 py-20 md:grid-cols-2 md:py-28">
        {/* Left — Text content */}
        <div>
          {/* Static badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-primary">
              <Shield className="h-3 w-3" /> ISO Certified Lab
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-primary ml-2">
              <Award className="h-3 w-3" /> NABL Certified
            </span>
          </motion.div>

          {/* Animated heading — staggered word entrance */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.h1
              key={`heading-${slide.id}`}
              variants={headingContainerVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="mt-4 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl"
            >
              {mainWords.map((word, i) => (
                <motion.span key={i} variants={wordVariants} className="inline-block mr-[0.25em]">
                  {word}
                </motion.span>
              ))}
              {accentWords.map((word, i) => (
                <motion.span
                  key={`a${i}`}
                  variants={wordVariants}
                  className="inline-block mr-[0.25em] text-gradient-emerald"
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>
          </AnimatePresence>

          {/* Animated subtitle */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.p
              key={`subtitle-${slide.id}`}
              variants={subtitleVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
              className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-lg"
            >
              {slide.subtitle}
            </motion.p>
          </AnimatePresence>

          {/* Static CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap gap-3"
          >
            <Button asChild size="lg">
              <Link to="/book">
                Book Health Test <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/packages">View Packages</Link>
            </Button>
          </motion.div>

          {/* Dots + slide counter */}
          {count > 1 && (
            <div className="mt-8 flex items-center gap-3">
              <div className="flex items-center gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className="group relative h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{ width: i === current ? 32 : 10 }}
                  >
                    <span
                      className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                        i === current
                          ? "bg-primary"
                          : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                      }`}
                    />
                    {i === current && !paused && (
                      <motion.span
                        className="absolute inset-0 rounded-full bg-primary/40"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: INTERVAL / 1000, ease: "linear" }}
                        style={{ transformOrigin: "left" }}
                      />
                    )}
                  </button>
                ))}
              </div>


            </div>
          )}
        </div>

        {/* Right — Image with Ken Burns + swipe */}
        <div
          className="group relative overflow-hidden rounded-2xl aspect-[16/9]"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {/* mode="sync" lets old slide exit at the same time as new slide enters (cross-fade slide) */}
          <AnimatePresence mode="sync" custom={direction}>
            <motion.div
              key={`image-${slide.id}`}
              className="absolute inset-0 overflow-hidden rounded-2xl"
              variants={imageWrapVariants}
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              {/* Ken Burns: slowly zooms in while the slide is active */}
              <motion.img
                src={slide.image_url || fallbackImage}
                alt={slide.heading}
                animate={{ scale: [1, 1.07] }}
                transition={{ duration: INTERVAL / 1000, ease: "linear" }}
                className="w-full h-full object-cover card-shadow"
                loading={current === 0 ? "eager" : "lazy"}
                fetchPriority={current === 0 ? "high" : undefined}
              />
            </motion.div>
          </AnimatePresence>

          {/* Progress bar — bottom of image, resets on every slide change via key */}
          {count > 1 && (
            <motion.div
              key={`progress-${current}`}
              className="absolute bottom-0 left-0 h-1 bg-primary z-10 rounded-b-2xl"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: INTERVAL / 1000, ease: "linear" }}
            />
          )}

          {/* Arrow navigation — visible on hover */}
          {count > 1 && (
            <>
              <button
                onClick={goPrev}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goNext}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
