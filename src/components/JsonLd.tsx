import { businessInfo } from "@/data/siteData";

const JsonLd = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: businessInfo.name,
    description: "Trusted ISO Certified Diagnostic Lab in Sri Vijaya Puram offering comprehensive health tests, packages, and expert medical care.",
    telephone: businessInfo.phone,
    email: businessInfo.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sri Vijaya Puram",
      addressRegion: "Andaman & Nicobar Islands",
      addressCountry: "IN",
    },
    openingHours: "Mo-Su 06:00-19:00",
    url: window.location.origin,
    medicalSpecialty: "Pathology",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default JsonLd;
