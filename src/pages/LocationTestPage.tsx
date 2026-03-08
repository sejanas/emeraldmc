import { useParams, Link } from "react-router-dom";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageMeta from "@/components/PageMeta";
import JsonLd from "@/components/JsonLd";
import { businessInfo } from "@/data/siteData";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, MapPin, CheckCircle } from "lucide-react";
import NotFound from "./NotFound";

const locationPages: Record<string, { testName: string; slug: string; description: string }> = {
  "blood-test-port-blair": {
    testName: "Blood Test",
    slug: "blood-test-port-blair",
    description: "Book affordable blood tests in Port Blair at Emerald Medical Care. ISO certified diagnostic lab with same-day reports and free home sample collection.",
  },
  "cbc-test-port-blair": {
    testName: "CBC Test",
    slug: "cbc-test-port-blair",
    description: "Get a Complete Blood Count (CBC) test in Port Blair at Emerald Medical Care. ISO certified lab with same-day reports starting at ₹350.",
  },
  "thyroid-test-port-blair": {
    testName: "Thyroid Test",
    slug: "thyroid-test-port-blair",
    description: "Book TSH, T3, T4 thyroid function tests in Port Blair at Emerald Medical Care. ISO certified diagnostic lab with expert pathologists.",
  },
  "diabetes-test-port-blair": {
    testName: "Diabetes Test",
    slug: "diabetes-test-port-blair",
    description: "Blood sugar and HbA1c diabetes tests in Port Blair at Emerald Medical Care. Fasting glucose from ₹100 with same-day reports.",
  },
};

const LocationTestPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? locationPages[slug] : undefined;

  if (!page) return <NotFound />;

  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: businessInfo.name,
    description: page.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sri Vijaya Puram",
      addressLocality: "Port Blair",
      addressRegion: "Andaman & Nicobar Islands",
      addressCountry: "IN",
    },
    areaServed: { "@type": "City", name: "Port Blair" },
    medicalSpecialty: "Pathology",
  };

  return (
    <article className="container py-12 max-w-3xl mx-auto">
      <PageMeta
        title={`${page.testName} in Port Blair – Emerald Medical Care`}
        description={page.description}
        canonical={`https://emeraldmedicalcare.com/${page.slug}`}
      />
      <JsonLd schema={schema} />

      <Breadcrumbs items={[{ label: `${page.testName} in Port Blair` }]} />

      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          {page.testName} in Port Blair
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{page.description}</p>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-3">Why Choose Emerald Medical Care?</h2>
        <ul className="space-y-3">
          {[
            "ISO Certified Diagnostic Laboratory",
            "Same-day reports for most tests",
            "Free home sample collection in Port Blair",
            "Experienced pathologists and modern equipment",
            "Affordable and transparent pricing",
            "Serving Port Blair, Wimberlygunj, Bambooflat, and Ferrargunj",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-3">Where to Get a {page.testName} in Port Blair</h2>
        <p className="text-muted-foreground leading-relaxed">
          {page.testName}s are available at {businessInfo.name}, located in Sri Vijaya Puram, Port Blair,
          Andaman and Nicobar Islands. Our ISO certified laboratory provides accurate results with same-day
          report delivery for most tests. We also offer free home sample collection across Port Blair and
          surrounding areas.
        </p>
        <div className="mt-4 flex items-start gap-2 text-muted-foreground">
          <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <span>{businessInfo.address}</span>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-3">How to Book a {page.testName}</h2>
        <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
          <li>Book your test online or call us at {businessInfo.phone}</li>
          <li>Visit our lab in Sri Vijaya Puram or schedule free home sample collection</li>
          <li>Sample is analyzed in our ISO certified laboratory</li>
          <li>Download your report the same day</li>
        </ol>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 mt-10">
        <Button asChild size="lg">
          <Link to="/book">Book {page.testName} <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href={`tel:${businessInfo.phone}`}><Phone className="mr-2 h-4 w-4" /> Call to Book</a>
        </Button>
      </div>
    </article>
  );
};

export default LocationTestPage;
