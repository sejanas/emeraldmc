import { motion } from "framer-motion";

interface Props {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

const SectionHeading = ({ title, subtitle, centered = true }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={`mb-10 ${centered ? "text-center" : ""}`}
  >
    <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">{title}</h2>
    <div className={`mt-3 h-1 w-12 rounded-full bg-primary ${centered ? "mx-auto" : ""}`} />
    {subtitle && <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
  </motion.div>
);

export default SectionHeading;
