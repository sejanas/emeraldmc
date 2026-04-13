export const VISITING_DOCTOR_EVENT = {
  name: "Dr. Rukkayal Ashik",
  credentials: "MS OG, MRCOG (UK), FRM, FMAS, F ART",
  role: "Gynaecologist & Fertility Specialist",
  organisation: "The Hive Fertility & Women's Centre, Chennai",
  specialties: ["IVF & ICSI", "PCOD / PCOS", "Endometriosis", "Recurrent IVF Failures", "Fertility Preservation", "Laparoscopic Surgery"],
  experience: "10+ years",
  bio: "Gold medallist in MBBS and MS from Dr. M.G.R. Medical University. Member of RCOG London, Indian Fertility Society (IFS), and ISAR. Has helped 1000+ couples achieve parenthood through advanced ART.",
  imageUrl: "https://www.thehivefertility.in/wp-content/uploads/2023/07/4-web.webp",
  sourceUrl: "https://www.thehivefertility.in/fertility-doctor-rukkayal-ashik/",
  brandLogoUrl: "https://www.thehivefertility.in/wp-content/uploads/2023/07/logo-web.webp",
  visitStart: "2026-04-25",
  visitEnd: "2026-04-26",
  visitLabel: "Apr 25 – 26, 2026",
  isFree: true,
} as const;

/** Returns true while the event is still running (inclusive of end date). */
export function isVisitActive(): boolean {
  // Expires at midnight on Apr 27 (i.e. after Apr 26 is over)
  return new Date() < new Date("2026-04-27T00:00:00");
}
