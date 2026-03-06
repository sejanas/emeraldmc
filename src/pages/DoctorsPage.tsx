import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import { supabase } from "@/integrations/supabase/client";

interface Doctor {
  id: string; name: string; specialization: string; qualification: string | null;
  bio: string | null; profile_image: string | null; experience_years: number | null;
}

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    supabase.from("doctors").select("*").order("display_order").then(({ data }) => {
      if (data) setDoctors(data);
    });
  }, []);

  return (
    <div className="container py-12">
      <SectionHeading title="Our Expert Doctors" subtitle="Meet the qualified healthcare professionals at Emerald Medical Care" />
      <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
        {doctors.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }}
            className="overflow-hidden rounded-xl border border-border bg-card card-shadow text-center">
            {d.profile_image && <img src={d.profile_image} alt={d.name} className="aspect-square w-full object-cover" loading="lazy" />}
            <div className="p-5">
              <h3 className="font-display text-xl font-semibold text-foreground">{d.name}</h3>
              <p className="text-sm font-medium text-primary">{d.specialization}</p>
              {d.qualification && <p className="text-xs text-muted-foreground mt-1">{d.qualification}</p>}
              {d.bio && <p className="mt-2 text-sm text-muted-foreground">{d.bio}</p>}
            </div>
          </motion.div>
        ))}
      </div>
      {doctors.length === 0 && <p className="py-12 text-center text-muted-foreground">No doctors listed yet.</p>}
    </div>
  );
};

export default DoctorsPage;
