interface Props {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

const SectionHeading = ({ title, subtitle, centered = true }: Props) => (
  <div className={`mb-10 ${centered ? "text-center" : ""}`}>
    <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">{title}</h2>
    {subtitle && <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
  </div>
);

export default SectionHeading;
