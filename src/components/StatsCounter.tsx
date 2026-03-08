import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, FlaskConical, CalendarCheck, Award } from "lucide-react";

const stats = [
  { icon: FlaskConical, value: 10000, suffix: "+", label: "Tests Completed" },
  { icon: Users, value: 5000, suffix: "+", label: "Happy Patients" },
  { icon: Award, value: 50, suffix: "+", label: "Diagnostic Tests" },
  { icon: CalendarCheck, value: 10, suffix: "+", label: "Years Experience" },
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

const StatsCounter = () => (
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

export default StatsCounter;
