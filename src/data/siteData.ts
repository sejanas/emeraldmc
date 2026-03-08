// Centralized site data - will be replaced by DB in Phase 2

export const businessInfo = {
  name: "Emerald Medical Care",
  shortName: "EMC",
  phone: "+91 7679348684",
  email: "shifasmainlandhealthcare@gmail.com",
  hours: "Everyday 6:00 AM – 7:00 PM",
  address: "Sri Vijaya Puram, Andaman & Nicobar Islands",
  mapUrl: "https://maps.app.goo.gl/vrTQeqAnwLRzwukD7",
  mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3907.123456!2d92.7365!3d11.6234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSri+Vijaya+Puram!5e0!3m2!1sen!2sin!4v1234567890",
};

export interface Test {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  fastingRequired: boolean;
  sampleType: string;
  reportTime: string;
}

export interface HealthPackage {
  id: string;
  name: string;
  price: number;
  tests: string[];
  popular: boolean;
  description: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  image: string;
  description: string;
}

export const testCategories = [
  "Hematology",
  "Biochemistry",
  "Thyroid",
  "Diabetes",
  "Lipid Profile",
  "Liver Function",
  "Kidney Function",
  "Vitamin & Hormone",
  "Infection Panels",
];

export const tests: Test[] = [
  { id: "t1", name: "Complete Blood Count (CBC)", category: "Hematology", price: 350, description: "Measures different components of blood including RBC, WBC, and platelets.", fastingRequired: false, sampleType: "Blood", reportTime: "Same Day" },
  { id: "t2", name: "Hemoglobin (Hb)", category: "Hematology", price: 150, description: "Measures the amount of hemoglobin in your blood.", fastingRequired: false, sampleType: "Blood", reportTime: "Same Day" },
  { id: "t3", name: "ESR", category: "Hematology", price: 200, description: "Erythrocyte sedimentation rate to detect inflammation.", fastingRequired: false, sampleType: "Blood", reportTime: "Same Day" },
  { id: "t4", name: "Blood Glucose Fasting", category: "Diabetes", price: 100, description: "Measures blood sugar levels after fasting.", fastingRequired: true, sampleType: "Blood", reportTime: "Same Day" },
  { id: "t5", name: "HbA1c", category: "Diabetes", price: 500, description: "Average blood sugar control over 2-3 months.", fastingRequired: false, sampleType: "Blood", reportTime: "Next Day" },
  { id: "t6", name: "TSH", category: "Thyroid", price: 350, description: "Thyroid stimulating hormone test.", fastingRequired: false, sampleType: "Blood", reportTime: "Next Day" },
  { id: "t7", name: "T3 & T4", category: "Thyroid", price: 500, description: "Measures thyroid hormone levels.", fastingRequired: false, sampleType: "Blood", reportTime: "Next Day" },
  { id: "t8", name: "Lipid Profile", category: "Lipid Profile", price: 600, description: "Cholesterol, triglycerides, HDL, LDL levels.", fastingRequired: true, sampleType: "Blood", reportTime: "Same Day" },
  { id: "t9", name: "Liver Function Test (LFT)", category: "Liver Function", price: 700, description: "Assesses liver health with multiple markers.", fastingRequired: true, sampleType: "Blood", reportTime: "Same Day" },
  { id: "t10", name: "Kidney Function Test (KFT)", category: "Kidney Function", price: 700, description: "Evaluates kidney health including creatinine and urea.", fastingRequired: false, sampleType: "Blood", reportTime: "Same Day" },
  { id: "t11", name: "Vitamin D", category: "Vitamin & Hormone", price: 800, description: "Measures vitamin D levels in the blood.", fastingRequired: false, sampleType: "Blood", reportTime: "2 Days" },
  { id: "t12", name: "Vitamin B12", category: "Vitamin & Hormone", price: 750, description: "Checks vitamin B12 deficiency.", fastingRequired: false, sampleType: "Blood", reportTime: "2 Days" },
  { id: "t13", name: "Blood Urea", category: "Biochemistry", price: 200, description: "Measures urea nitrogen in blood.", fastingRequired: false, sampleType: "Blood", reportTime: "Same Day" },
  { id: "t14", name: "Serum Creatinine", category: "Biochemistry", price: 250, description: "Kidney function marker.", fastingRequired: false, sampleType: "Blood", reportTime: "Same Day" },
  { id: "t15", name: "Dengue NS1", category: "Infection Panels", price: 600, description: "Detects dengue virus early in infection.", fastingRequired: false, sampleType: "Blood", reportTime: "Same Day" },
  { id: "t16", name: "Malaria Antigen", category: "Infection Panels", price: 400, description: "Rapid test for malaria infection.", fastingRequired: false, sampleType: "Blood", reportTime: "Same Day" },
];

export const healthPackages: HealthPackage[] = [
  {
    id: "p1",
    name: "Basic Health Checkup",
    price: 999,
    popular: false,
    description: "Essential tests for routine health screening.",
    tests: ["Complete Blood Count (CBC)", "Blood Glucose Fasting", "Lipid Profile"],
  },
  {
    id: "p2",
    name: "Comprehensive Health Package",
    price: 2499,
    popular: true,
    description: "Complete health evaluation with all major tests.",
    tests: ["Complete Blood Count (CBC)", "Blood Glucose Fasting", "HbA1c", "Lipid Profile", "Liver Function Test (LFT)", "Kidney Function Test (KFT)", "TSH"],
  },
  {
    id: "p3",
    name: "Diabetes Care Package",
    price: 1499,
    popular: false,
    description: "Focused package for diabetes monitoring.",
    tests: ["Blood Glucose Fasting", "HbA1c", "Kidney Function Test (KFT)", "Lipid Profile"],
  },
  {
    id: "p4",
    name: "Thyroid Profile Package",
    price: 999,
    popular: false,
    description: "Complete thyroid function assessment.",
    tests: ["TSH", "T3 & T4", "Complete Blood Count (CBC)"],
  },
];

export const bookingSlots = (() => {
  const slots: string[] = [];
  for (let h = 6; h <= 18; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    if (h < 18) {
      slots.push(`${h.toString().padStart(2, "0")}:30`);
    } else {
      slots.push("18:30");
    }
  }
  return slots;
})();
