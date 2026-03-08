export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  content: string; // HTML content
  datePublished: string;
  author: string;
  authorCredentials: string;
  category: string;
  readTime: string;
}

export const blogArticles: BlogArticle[] = [
  {
    slug: "what-does-cbc-test-detect",
    title: "What Does a CBC Test Detect? A Complete Guide",
    description: "Learn what a Complete Blood Count (CBC) test detects, why it is important, and what abnormal CBC results mean for your health.",
    datePublished: "2025-01-15",
    author: "Dr. Ashok Menon",
    authorCredentials: "MD Pathology, 15+ Years Experience",
    category: "Blood Tests",
    readTime: "5 min read",
    content: `
      <h2>What is a CBC Test?</h2>
      <p>A Complete Blood Count (CBC) is one of the most commonly ordered blood tests. It measures several components of your blood including red blood cells, white blood cells, hemoglobin, hematocrit, and platelets.</p>

      <h2>What Conditions Can a CBC Detect?</h2>
      <p>A CBC test can help detect the following conditions:</p>
      <ul>
        <li><strong>Anemia</strong> — Low red blood cell count or hemoglobin indicates anemia, which can cause fatigue and weakness.</li>
        <li><strong>Infections</strong> — Elevated white blood cell count may indicate bacterial or viral infections.</li>
        <li><strong>Blood Cancers</strong> — Abnormal WBC counts may suggest leukemia or lymphoma.</li>
        <li><strong>Bleeding Disorders</strong> — Low platelet count can indicate clotting problems.</li>
        <li><strong>Immune Deficiencies</strong> — Low WBC may signal immune system weakness.</li>
      </ul>

      <h2>When Should You Get a CBC Test?</h2>
      <p>Doctors recommend a CBC test during routine health checkups, when you have symptoms like fatigue, fever, bruising, or unexplained weight loss, and before surgeries.</p>

      <h2>Getting a CBC Test in Port Blair</h2>
      <p>CBC tests are available at Emerald Medical Care, an ISO certified diagnostic laboratory in Sri Vijaya Puram, Port Blair. Same-day reports are provided with free home sample collection available across Port Blair, Wimberlygunj, Bambooflat, and Ferrargunj.</p>
    `,
  },
  {
    slug: "symptoms-of-thyroid-disorder",
    title: "Symptoms of Thyroid Disorder: When to Get Tested",
    description: "Understand the common symptoms of thyroid disorders including hypothyroidism and hyperthyroidism, and when you should get a thyroid test.",
    datePublished: "2025-02-01",
    author: "Dr. Ashok Menon",
    authorCredentials: "MD Pathology, 15+ Years Experience",
    category: "Thyroid",
    readTime: "6 min read",
    content: `
      <h2>What is Thyroid Disorder?</h2>
      <p>The thyroid is a butterfly-shaped gland in the neck that produces hormones regulating metabolism, energy, and body temperature. Thyroid disorders occur when the gland produces too much or too little hormone.</p>

      <h2>Symptoms of Hypothyroidism (Underactive Thyroid)</h2>
      <ul>
        <li>Unexplained weight gain</li>
        <li>Fatigue and tiredness</li>
        <li>Sensitivity to cold</li>
        <li>Dry skin and hair loss</li>
        <li>Constipation</li>
        <li>Depression and mood changes</li>
        <li>Irregular or heavy periods</li>
      </ul>

      <h2>Symptoms of Hyperthyroidism (Overactive Thyroid)</h2>
      <ul>
        <li>Unexplained weight loss</li>
        <li>Rapid or irregular heartbeat</li>
        <li>Nervousness and anxiety</li>
        <li>Tremors in hands</li>
        <li>Excessive sweating</li>
        <li>Difficulty sleeping</li>
      </ul>

      <h2>When to Get a Thyroid Test</h2>
      <p>If you experience any of these symptoms, a thyroid function test (TSH, T3, T4) can help diagnose the condition. Early detection leads to better treatment outcomes.</p>

      <h2>Thyroid Testing in Port Blair</h2>
      <p>Thyroid function tests are available at Emerald Medical Care in Sri Vijaya Puram, Port Blair. TSH testing costs ₹350 with next-day reports available.</p>
    `,
  },
  {
    slug: "early-signs-of-diabetes",
    title: "Early Signs of Diabetes: Don't Ignore These Symptoms",
    description: "Learn the early warning signs of diabetes and why regular blood sugar testing is important for early detection and prevention.",
    datePublished: "2025-02-15",
    author: "Dr. Ashok Menon",
    authorCredentials: "MD Pathology, 15+ Years Experience",
    category: "Diabetes",
    readTime: "5 min read",
    content: `
      <h2>What is Diabetes?</h2>
      <p>Diabetes is a chronic condition where the body cannot properly process blood sugar (glucose). Type 2 diabetes is the most common form and often develops gradually with subtle symptoms that can be missed.</p>

      <h2>Early Warning Signs of Diabetes</h2>
      <ul>
        <li><strong>Increased thirst</strong> — Feeling unusually thirsty throughout the day</li>
        <li><strong>Frequent urination</strong> — Needing to urinate more often, especially at night</li>
        <li><strong>Unexplained weight loss</strong> — Losing weight without trying</li>
        <li><strong>Fatigue</strong> — Feeling tired even after adequate rest</li>
        <li><strong>Blurred vision</strong> — Changes in eyesight</li>
        <li><strong>Slow healing</strong> — Cuts and wounds take longer to heal</li>
        <li><strong>Tingling in hands or feet</strong> — Numbness or tingling sensations</li>
      </ul>

      <h2>Recommended Tests for Diabetes Screening</h2>
      <p>If you notice these symptoms, the following tests can help diagnose diabetes:</p>
      <ul>
        <li><strong>Fasting Blood Glucose</strong> — Measures blood sugar after 8 hours of fasting</li>
        <li><strong>HbA1c</strong> — Provides average blood sugar levels over 2–3 months</li>
      </ul>

      <h2>Diabetes Testing in Port Blair</h2>
      <p>Blood sugar tests are available at Emerald Medical Care in Sri Vijaya Puram, Port Blair. Fasting glucose costs ₹100 and HbA1c costs ₹500 with same-day reports.</p>
    `,
  },
  {
    slug: "how-often-health-checkup",
    title: "How Often Should You Get a Health Checkup?",
    description: "Find out the recommended frequency for health checkups based on your age and risk factors. Learn which tests to include in your annual health screening.",
    datePublished: "2025-03-01",
    author: "Dr. Ashok Menon",
    authorCredentials: "MD Pathology, 15+ Years Experience",
    category: "Preventive Health",
    readTime: "4 min read",
    content: `
      <h2>Why Are Regular Health Checkups Important?</h2>
      <p>Regular health checkups help detect diseases early when they are most treatable. Many serious conditions like diabetes, thyroid disorders, and high cholesterol show no symptoms in early stages and can only be detected through blood tests.</p>

      <h2>Recommended Checkup Frequency by Age</h2>
      <ul>
        <li><strong>Ages 18–30</strong> — Every 2–3 years if healthy; annually if you have risk factors</li>
        <li><strong>Ages 30–45</strong> — Annually recommended, especially for diabetes and cholesterol screening</li>
        <li><strong>Ages 45–60</strong> — Every 6–12 months; include cardiac and kidney function tests</li>
        <li><strong>Above 60</strong> — Every 6 months with comprehensive blood work</li>
      </ul>

      <h2>Essential Tests to Include</h2>
      <ul>
        <li>Complete Blood Count (CBC)</li>
        <li>Blood Sugar (Fasting Glucose and HbA1c)</li>
        <li>Lipid Profile (Cholesterol)</li>
        <li>Thyroid Function (TSH)</li>
        <li>Liver Function Test (LFT)</li>
        <li>Kidney Function Test (KFT)</li>
        <li>Vitamin D and B12</li>
      </ul>

      <h2>Health Checkup Packages in Port Blair</h2>
      <p>Emerald Medical Care offers comprehensive health checkup packages starting from ₹999 in Sri Vijaya Puram, Port Blair. Packages include multiple tests at discounted prices with same-day reports and free home sample collection.</p>
    `,
  },
];
