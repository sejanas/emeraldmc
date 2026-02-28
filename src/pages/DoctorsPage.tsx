import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import drAshok from "@/assets/doctor-ashok.png";
import drPriya from "@/assets/doctor-priya.png";
import drRakesh from "@/assets/doctor-rakesh.png";

const doctors = [
  { name: "Dr. Ashok Menon", spec: "MD Pathology", img: drAshok, desc: "Expert pathologist with extensive experience in clinical diagnostics and laboratory medicine." },
  { name: "Dr. Priya Sharma", spec: "MD Biochemistry", img: drPriya, desc: "Specialist in biochemistry with a focus on metabolic disorders and nutritional diagnostics." },
  { name: "Dr. Rakesh Kumar", spec: "MD General Medicine", img: drRakesh, desc: "Experienced physician providing comprehensive healthcare and preventive medicine services." },
];

const DoctorsPage = () => (
  <div className="container py-12">
    <SectionHeading
      title="Our Expert Doctors"
      subtitle="Meet the qualified healthcare professionals at Emerald Medical Care"
    />
    <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
      {doctors.map((d, i) => (
        <motion.div
          key={d.name}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 0.5 }}
          className="overflow-hidden rounded-xl border border-border bg-card card-shadow text-center"
        >
          <img src={d.img} alt={d.name} className="aspect-square w-full object-cover" loading="lazy" />
          <div className="p-5">
            <h3 className="font-display text-xl font-semibold text-foreground">{d.name}</h3>
            <p className="text-sm font-medium text-primary">{d.spec}</p>
            <p className="mt-2 text-sm text-muted-foreground">{d.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default DoctorsPage;
