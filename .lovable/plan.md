

# Full UI/UX Overhaul

## New Components to Create

### 1. `src/components/ScrollToTop.tsx`
Floating button (bottom-right) that appears after scrolling 300px. Uses framer-motion for fade in/out. Smooth scrolls to top on click. Emerald-themed with `ChevronUp` icon.

### 2. `src/components/WhatsAppButton.tsx`
Fixed bottom-left green WhatsApp button linking to `wa.me/917679348684`. Pulse animation on initial load, then settles. Uses MessageCircle icon styled green.

### 3. `src/components/PromoBanner.tsx`
Dismissible top banner: "Free Home Sample Collection for a Limited Time!" with a close button. Stores dismissed state in `localStorage` per session. Gradient emerald background.

### 4. `src/components/StatsCounter.tsx`
Animated count-up section with 4 stats: "500+ Patients", "50+ Tests", "10+ Years Experience", "3 Locations". Uses `useInView` from framer-motion + a simple counter animation with `useEffect`/`useState`.

### 5. `src/components/Testimonials.tsx`
3-4 static testimonial cards with star ratings, patient name, and quote. Uses the existing `embla-carousel-react` Carousel components for mobile swipe. Grid on desktop.

### 6. `src/components/Breadcrumbs.tsx`
Simple breadcrumb component using existing `breadcrumb.tsx` UI primitives. Takes `items: {label, href?}[]`. Used on all inner pages.

### 7. `src/components/MobileCTA.tsx`
Fixed bottom bar on mobile (hidden on `md+`) with "Book Appointment" button and phone icon. Appears after scrolling past 400px. Uses framer-motion slide-up.

---

## Files to Modify

### `src/components/SectionHeading.tsx`
- Add a small decorative emerald accent bar (4px tall, 48px wide) below the title
- Add subtle fade-in animation with framer-motion

### `src/components/Navbar.tsx`
- Wrap mobile menu in `AnimatePresence` + `motion.div` for slide-down animation
- Add nav link hover underline animation (bottom border transition)
- Add scroll-based shadow: track `scrollY > 10` to add stronger border/shadow

### `src/components/Layout.tsx`
- Add `ScrollToTop`, `WhatsAppButton`, `MobileCTA` components
- Add `PromoBanner` above `Navbar`

### `src/pages/Index.tsx`
- Add `StatsCounter` section between Features and Popular Tests
- Add trust badges row below hero (NABL Certified, ISO 9001:2015, Same Day Reports, Home Collection) as horizontal pill badges
- Add `Testimonials` section before CTA
- Consistent `py-20` spacing on all sections

### `src/pages/TestsPage.tsx`
- Add `Breadcrumbs` (Home > Tests)
- Add result count badge: "Showing X tests"
- Better empty state with illustration text

### `src/pages/PackagesPage.tsx`
- Add `Breadcrumbs` (Home > Health Packages)
- Add discount percentage badge on cards when `discounted_price` exists

### `src/pages/DoctorsPage.tsx`
- Add `Breadcrumbs` (Home > Doctors)
- Add experience years badge on cards

### `src/pages/GalleryPage.tsx`
- Add `Breadcrumbs` (Home > Gallery)
- Add lightbox: clicking image opens `Dialog` with full-size image + title
- Show title overlay on mobile always (not just hover)

### `src/pages/BookingPage.tsx`
- Add `Breadcrumbs` (Home > Book Appointment)
- Add visual step progress indicator at top (3 dots/steps: Details, Schedule, Confirm) — purely visual, single-page form

### `src/pages/ContactPage.tsx`
- Add `Breadcrumbs` (Home > Contact)

### `src/pages/FaqPage.tsx`
- Add `Breadcrumbs` (Home > FAQs)

### `src/components/Footer.tsx`
- Add social media icon placeholders (Facebook, Instagram)
- Slightly improved spacing and visual hierarchy

### `src/index.css`
- Add new utility classes: `.animate-count-up`, scroll-based utilities
- Add WhatsApp button pulse keyframe

---

## Technical Notes
- No new npm packages needed — everything uses existing framer-motion, embla-carousel, radix dialog, lucide-react
- All animations use `viewport={{ once: true }}` to avoid re-triggering
- Mobile CTA hides when user is already on `/book` page
- Testimonials are hardcoded static data (can be made dynamic later)
- WhatsApp number derived from `businessInfo.phone`

