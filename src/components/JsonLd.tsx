import { businessInfo } from "@/data/siteData";

interface JsonLdProps {
  schema?: Record<string, any>;
}

const defaultSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: businessInfo.name,
  description: "ISO Certified Diagnostic Laboratory in Sri Vijaya Puram, Port Blair offering CBC, thyroid, diabetes, lipid profile tests and comprehensive health packages with same-day reports.",
  telephone: businessInfo.phone,
  email: businessInfo.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Sri Vijaya Puram",
    addressLocality: "Port Blair",
    addressRegion: "Andaman & Nicobar Islands",
    postalCode: "744101",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "11.6234",
    longitude: "92.7365",
  },
  openingHours: "Mo-Su 06:00-19:00",
  url: typeof window !== "undefined" ? window.location.origin : "https://emeraldmc.lovable.app",
  medicalSpecialty: ["Pathology", "Clinical Laboratory"],
  priceRange: "₹100 - ₹5000",
  areaServed: [
    { "@type": "City", name: "Port Blair" },
    { "@type": "Place", name: "Sri Vijaya Puram" },
    { "@type": "Place", name: "Wimberlygunj" },
    { "@type": "Place", name: "Bambooflat" },
    { "@type": "Place", name: "Ferrargunj" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Diagnostic Tests",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "MedicalTest", name: "Complete Blood Count (CBC)" } },
      { "@type": "Offer", itemOffered: { "@type": "MedicalTest", name: "Thyroid Profile (TSH, T3, T4)" } },
      { "@type": "Offer", itemOffered: { "@type": "MedicalTest", name: "Lipid Profile" } },
      { "@type": "Offer", itemOffered: { "@type": "MedicalTest", name: "Blood Glucose / HbA1c" } },
      { "@type": "Offer", itemOffered: { "@type": "MedicalTest", name: "Liver Function Test" } },
      { "@type": "Offer", itemOffered: { "@type": "MedicalTest", name: "Kidney Function Test" } },
    ],
  },
};

const JsonLd = ({ schema }: JsonLdProps) => {
  const data = schema ?? defaultSchema;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

export default JsonLd;

// Helper to create FAQPage schema from FAQ data
export function createFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer.replace(/<[^>]*>/g, ""), // strip HTML
      },
    })),
  };
}

// Helper to create MedicalWebPage schema for test detail pages
export function createTestPageSchema(test: {
  name: string;
  description: string;
  price: number;
  sample_type: string;
  report_time: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: `${test.name} in Port Blair`,
    description: test.description,
    mainEntity: {
      "@type": "MedicalTest",
      name: test.name,
      description: test.description,
      usesDevice: { "@type": "MedicalDevice", name: "Clinical Laboratory Equipment" },
    },
    provider: {
      "@type": "MedicalBusiness",
      name: businessInfo.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Port Blair",
        addressRegion: "Andaman & Nicobar Islands",
        addressCountry: "IN",
      },
    },
    offers: {
      "@type": "Offer",
      price: test.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
  };
}

// Helper for Article/Blog schema
export function createArticleSchema(article: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  author: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: { "@type": "Person", name: article.author },
    publisher: { "@type": "Organization", name: businessInfo.name },
    datePublished: article.datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${typeof window !== "undefined" ? window.location.origin : ""}/blog/${article.slug}`,
    },
  };
}
