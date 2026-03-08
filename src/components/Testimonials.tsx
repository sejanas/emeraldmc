import { motion } from "framer-motion";
import { Star } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const testimonials = [
  {
    name: "Rajesh Kumar",
    rating: 5,
    text: "Excellent service and accurate results. The staff was very professional and reports came on the same day. Highly recommend!",
  },
  {
    name: "Priya Sharma",
    rating: 5,
    text: "Very clean and well-maintained facility. The doctors are knowledgeable and patient. Best diagnostic lab in Sri Vijaya Puram.",
  },
  {
    name: "Anand Verma",
    rating: 5,
    text: "Very accurate reports and quick service. Home sample collection was very convenient. Will definitely visit again.",
  },
  {
    name: "Meena Devi",
    rating: 5,
    text: "Professional staff and clean laboratory. Got my health checkup package done here. Everything was smooth and well-organized.",
  },
];

const avgRating = (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1);

const Testimonials = () => (
  <section className="bg-section-gradient py-20">
    <div className="container">
      <SectionHeading title="What Our Patients Say" subtitle="Real feedback from our valued patients" />

      {/* Rating Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto mb-10 flex items-center justify-center gap-3"
      >
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, j) => (
            <Star key={j} className="h-5 w-5 fill-primary text-primary" />
          ))}
        </div>
        <span className="font-display text-2xl font-bold text-foreground">{avgRating} / 5</span>
        <span className="text-sm text-muted-foreground">• 120+ reviews</span>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="rounded-xl border border-border bg-card p-6 card-shadow"
          >
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star
                  key={j}
                  className={`h-4 w-4 ${j < t.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
            <p className="mt-4 text-sm font-semibold text-foreground">{t.name}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
