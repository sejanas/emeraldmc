import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, Award } from "lucide-react";
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

const textVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const imageVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60, scale: 0.97 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60, scale: 0.97 }),
};

const HeroCarousel = ({ slides, fallbackImage }: HeroCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const count = slides.length;

  const goTo = useCallback(
    (idx: number) => {
      setDirection(idx > current ? 1 : -1);
      setCurrent(idx);
    },
    [current],
  );

  // Auto-advance
  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % count);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [paused, count]);

  // Preload next image
  useEffect(() => {
    if (count <= 1) return;
    const nextIdx = (current + 1) % count;
    const img = new Image();
    img.src = slides[nextIdx].image_url;
  }, [current, count, slides]);

  const slide = slides[current];
  if (!slide) return null;

  // Split heading to style the last two words with gradient
  const words = slide.heading.split(" ");
  const mainWords = words.slice(0, -2).join(" ");
  const accentWords = words.slice(-2).join(" ");

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

          {/* Animated heading */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.h1
              key={`heading-${slide.id}`}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mt-4 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl"
            >
              {mainWords}{" "}
              <span className="text-gradient-emerald">{accentWords}</span>
            </motion.h1>
          </AnimatePresence>

          {/* Animated subtitle */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.p
              key={`subtitle-${slide.id}`}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
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

          {/* Dot indicators */}
          {count > 1 && (
            <div className="mt-8 flex items-center gap-2">
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
          )}
        </div>

        {/* Right — Image */}
        <div className="relative overflow-hidden rounded-2xl aspect-[16/9]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.img
              key={`image-${slide.id}`}
              src={slide.image_url}
              alt={slide.heading}
              variants={imageVariants}
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl card-shadow"
              loading={current === 0 ? "eager" : "lazy"}
              fetchPriority={current === 0 ? "high" : undefined}
            />
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
