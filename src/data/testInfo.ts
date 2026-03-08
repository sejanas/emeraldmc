// Rich medical content for AI-optimized test detail pages
export interface TestDetailInfo {
  slug: string;
  name: string;
  fullName: string;
  whatIs: string;
  whyDone: string;
  preparation: string;
  normalRanges: { parameter: string; range: string }[];
  faq: { question: string; answer: string }[];
}

export const testDetails: TestDetailInfo[] = [
  {
    slug: "cbc",
    name: "CBC",
    fullName: "Complete Blood Count (CBC)",
    whatIs: "A Complete Blood Count (CBC) is a blood test that measures different components of your blood including red blood cells (RBCs), white blood cells (WBCs), hemoglobin, hematocrit, and platelets. It is one of the most commonly ordered blood tests and provides valuable information about your overall health.",
    whyDone: "A CBC test is done to detect a wide range of disorders including anemia, infection, inflammation, bleeding disorders, and blood cancers like leukemia. Doctors often order a CBC as part of a routine health checkup or to investigate symptoms such as fatigue, weakness, fever, bruising, or bleeding.",
    preparation: "No special preparation is required for a CBC test. You do not need to fast before the test. The test requires a small blood sample drawn from a vein in your arm.",
    normalRanges: [
      { parameter: "RBC (Male)", range: "4.5–5.5 million cells/μL" },
      { parameter: "RBC (Female)", range: "4.0–5.0 million cells/μL" },
      { parameter: "WBC", range: "4,500–11,000 cells/μL" },
      { parameter: "Hemoglobin (Male)", range: "13.5–17.5 g/dL" },
      { parameter: "Hemoglobin (Female)", range: "12.0–15.5 g/dL" },
      { parameter: "Platelets", range: "150,000–400,000/μL" },
    ],
    faq: [
      { question: "Where can I get a CBC test in Port Blair?", answer: "CBC blood tests are available at Emerald Medical Care, an ISO certified diagnostic laboratory located in Sri Vijaya Puram, Port Blair, Andaman and Nicobar Islands. Same-day reports are available." },
      { question: "How much does a CBC test cost?", answer: "The CBC test at Emerald Medical Care costs ₹350. This includes a complete blood count analysis with same-day report delivery." },
      { question: "Do I need to fast for a CBC test?", answer: "No, fasting is not required for a CBC test. You can eat and drink normally before the test." },
    ],
  },
  {
    slug: "lipid-profile",
    name: "Lipid Profile",
    fullName: "Lipid Profile Test",
    whatIs: "A Lipid Profile test measures the levels of specific fats in your blood including total cholesterol, LDL cholesterol (bad cholesterol), HDL cholesterol (good cholesterol), and triglycerides. It helps assess your risk of cardiovascular disease and heart attack.",
    whyDone: "A lipid profile is done to evaluate the risk of coronary heart disease and to monitor the effectiveness of lipid-lowering therapy. It is recommended for adults over 20 years of age as part of routine health screening, and more frequently for those with risk factors such as family history, obesity, diabetes, or hypertension.",
    preparation: "Fasting for 9–12 hours before the test is required for accurate results. You should avoid eating food and drinking anything other than water during the fasting period. Continue taking prescribed medications unless your doctor advises otherwise.",
    normalRanges: [
      { parameter: "Total Cholesterol", range: "Less than 200 mg/dL (desirable)" },
      { parameter: "LDL Cholesterol", range: "Less than 100 mg/dL (optimal)" },
      { parameter: "HDL Cholesterol", range: "60 mg/dL or higher (protective)" },
      { parameter: "Triglycerides", range: "Less than 150 mg/dL (normal)" },
    ],
    faq: [
      { question: "Where can I get a lipid profile test in Port Blair?", answer: "Lipid profile tests are available at Emerald Medical Care in Sri Vijaya Puram, Port Blair. Results are typically available the same day." },
      { question: "How much does a lipid profile test cost?", answer: "The lipid profile test at Emerald Medical Care costs ₹600 and includes total cholesterol, LDL, HDL, and triglyceride measurements." },
      { question: "Do I need to fast for a lipid profile test?", answer: "Yes, you need to fast for 9–12 hours before a lipid profile test for accurate results. Drink only water during the fasting period." },
    ],
  },
  {
    slug: "thyroid",
    name: "Thyroid Profile",
    fullName: "Thyroid Function Test (TSH, T3, T4)",
    whatIs: "A thyroid function test measures the levels of thyroid hormones in your blood including TSH (Thyroid Stimulating Hormone), T3 (Triiodothyronine), and T4 (Thyroxine). These hormones regulate metabolism, energy, and body temperature.",
    whyDone: "Thyroid tests are done to diagnose thyroid disorders such as hypothyroidism (underactive thyroid) and hyperthyroidism (overactive thyroid). Symptoms that may prompt testing include unexplained weight changes, fatigue, hair loss, sensitivity to cold or heat, and irregular heartbeat.",
    preparation: "No special fasting is required for thyroid function tests. However, certain medications and supplements (especially biotin) may affect results. Inform your doctor about all medications you are taking before the test.",
    normalRanges: [
      { parameter: "TSH", range: "0.4–4.0 mIU/L" },
      { parameter: "Free T3", range: "2.3–4.1 pg/mL" },
      { parameter: "Free T4", range: "0.8–1.8 ng/dL" },
    ],
    faq: [
      { question: "Where can I get a thyroid test in Port Blair?", answer: "Thyroid function tests including TSH, T3, and T4 are available at Emerald Medical Care in Sri Vijaya Puram, Port Blair, Andaman and Nicobar Islands." },
      { question: "How much does a thyroid test cost?", answer: "TSH test costs ₹350 and the combined T3 & T4 test costs ₹500 at Emerald Medical Care." },
      { question: "Do I need to fast for a thyroid test?", answer: "No, fasting is not required for thyroid function tests. You can eat and drink normally before the test." },
    ],
  },
  {
    slug: "blood-sugar",
    name: "Blood Sugar",
    fullName: "Blood Glucose and HbA1c Test",
    whatIs: "Blood sugar tests measure the amount of glucose in your blood. The fasting blood glucose test measures sugar levels after an overnight fast, while HbA1c (glycated hemoglobin) provides an average blood sugar level over the past 2–3 months. These tests are essential for diagnosing and monitoring diabetes.",
    whyDone: "Blood sugar tests are done to screen for diabetes and prediabetes, monitor blood sugar control in diabetic patients, and assess the effectiveness of diabetes medications. They are recommended for adults over 45, overweight individuals, and those with a family history of diabetes.",
    preparation: "For fasting blood glucose, you need to fast for at least 8 hours (overnight fasting is recommended). Only water is allowed during the fasting period. HbA1c does not require fasting and can be done at any time of the day.",
    normalRanges: [
      { parameter: "Fasting Blood Glucose", range: "70–100 mg/dL (normal)" },
      { parameter: "Prediabetes", range: "100–125 mg/dL" },
      { parameter: "Diabetes", range: "126 mg/dL or higher" },
      { parameter: "HbA1c Normal", range: "Below 5.7%" },
      { parameter: "HbA1c Prediabetes", range: "5.7%–6.4%" },
      { parameter: "HbA1c Diabetes", range: "6.5% or higher" },
    ],
    faq: [
      { question: "Where can I get a blood sugar test in Port Blair?", answer: "Blood sugar tests including fasting glucose and HbA1c are available at Emerald Medical Care in Sri Vijaya Puram, Port Blair." },
      { question: "How much does a blood sugar test cost?", answer: "Fasting blood glucose costs ₹100 and HbA1c costs ₹500 at Emerald Medical Care." },
      { question: "Do I need to fast for a blood sugar test?", answer: "Fasting blood glucose requires 8 hours of fasting. HbA1c does not require fasting." },
    ],
  },
];
