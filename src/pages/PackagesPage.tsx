import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/SectionHeading";
import { healthPackages } from "@/data/siteData";

const fadeUp = {
  hidden: { opacity: 0, y: 20 } as const,
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const PackagesPage = () => (
  <div className="container py-12">
    <SectionHeading
      title="Health Packages"
      subtitle="Choose from our curated health checkup packages designed for comprehensive care"
    />
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {healthPackages.map((pkg, i) => (
        <motion.div
          key={pkg.id}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={i}
          className={`relative flex flex-col rounded-xl border p-6 transition-shadow hover:card-shadow-hover ${
            pkg.popular ? "border-primary bg-accent/50" : "border-border bg-card"
          }`}
        >
          {pkg.popular && (
            <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              <Star className="h-3 w-3" /> Most Popular
            </span>
          )}
          <h3 className="font-display text-xl font-semibold text-foreground">{pkg.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
          <p className="mt-4 font-display text-4xl font-bold text-primary">₹{pkg.price}</p>
          <ul className="mt-5 flex-1 space-y-2">
            {pkg.tests.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" /> {t}
              </li>
            ))}
          </ul>
          <Button asChild className="mt-6 w-full" variant={pkg.popular ? "default" : "outline"}>
            <Link to="/book">Book Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </motion.div>
      ))}
    </div>
  </div>
);

export default PackagesPage;
