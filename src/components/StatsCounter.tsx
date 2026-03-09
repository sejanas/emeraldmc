import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, FlaskConical, CalendarCheck, Award } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const defaultStats = [
  { icon: FlaskConical, key: "tests_completed", suffix: "+", label: "Tests Completed", fallback: 10000 },
  { icon: Users, key: "happy_patients", suffix: "+", label: "Happy Patients", fallback: 5000 },
  { icon: Award, key: "diagnostic_tests", suffix: "+", label: "Diagnostic Tests", fallback: 50 },
  { icon: CalendarCheck, key: "years_experience", suffix: "+", label: "Years Experience", fallback: 10 },
];

const Counter = ({ target, suffix }: { target: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref} className="font-display text-4xl font-bold text-primary md:text-5xl">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const StatsCounter = () => {
  const { data: statsData } = useSiteSettings("stats");
  const configValues = statsData?.value;

  // Build stats array, filtering out any with value 0
  const stats = defaultStats
    .map((s) => ({
      ...s,
      value: configValues?.[s.key] ?? s.fallback,
    }))
    .filter((s) => s.value > 0);

  if (stats.length === 0) return null;

  return (
    <section className="container py-20">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <s.icon className="h-7 w-7 text-primary" />
            </div>
            <Counter target={s.value} suffix={s.suffix} />
            <p className="mt-1 text-sm font-medium text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default StatsCounter;
