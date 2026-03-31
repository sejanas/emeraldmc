import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import { ThemeProvider } from "@/hooks/useTheme";

import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"

import AdminRoute from "@/components/AdminRoute";
import Layout from "@/components/Layout";
import Index from "./pages/Index";

// Lazy-loaded public pages
const TestsPage = lazy(() => import("./pages/TestsPage"));
const TestDetailPage = lazy(() => import("./pages/TestDetailPage"));
const PackagesPage = lazy(() => import("./pages/PackagesPage"));
const DoctorsPage = lazy(() => import("./pages/DoctorsPage"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogArticlePage = lazy(() => import("./pages/BlogArticlePage"));
const CertificationsPage = lazy(() => import("./pages/CertificationsPage"));
const LocationTestPage = lazy(() => import("./pages/LocationTestPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LogoutPage = lazy(() => import("./pages/LogoutPage"));

// Lazy-loaded admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminSignup = lazy(() => import("./pages/admin/AdminSignup"));
const AdminForgotPassword = lazy(() => import("./pages/admin/AdminForgotPassword"));
const AdminResetPassword = lazy(() => import("./pages/admin/AdminResetPassword"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminTests = lazy(() => import("./pages/admin/AdminTests"));
const AdminPackages = lazy(() => import("./pages/admin/AdminPackages"));
const AdminDoctors = lazy(() => import("./pages/admin/AdminDoctors"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminFaqs = lazy(() => import("./pages/admin/AdminFaqs"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminCertifications = lazy(() => import("./pages/admin/AdminCertifications"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminActivityLogs = lazy(() => import("./pages/admin/AdminActivityLogs"));
const AdminVisitors = lazy(() => import("./pages/admin/AdminVisitors"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminThemeSettings = lazy(() => import("./pages/admin/AdminThemeSettings"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminHomepageSections = lazy(() => import("./pages/admin/AdminHomepageSections"));
const AdminStatistics = lazy(() => import("./pages/admin/AdminStatistics"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminFeatures = lazy(() => import("./pages/admin/AdminFeatures"));
const PreviewHome = lazy(() => import("./pages/PreviewHome"));

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <ThemeProvider>
    <TooltipProvider>
        <AuthProvider>
          <ConfirmProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/tests" element={<TestsPage />} />
                  <Route path="/tests/:slug" element={<TestDetailPage />} />
                  <Route path="/packages" element={<PackagesPage />} />
                  <Route path="/doctors" element={<DoctorsPage />} />
                  <Route path="/book" element={<BookingPage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogArticlePage />} />
                  <Route path="/certifications" element={<CertificationsPage />} />
                  <Route path="/preview/home" element={<AdminRoute><PreviewHome /></AdminRoute>} />
                  <Route path="/:slug" element={<LocationTestPage />} />
                </Route>
                <Route path="/logout" element={<LogoutPage />} />
                <Route path="/admin/logout" element={<LogoutPage />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/signup" element={<AdminSignup />} />
                <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
                <Route path="/admin/reset-password" element={<AdminResetPassword />} />
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="tests" element={<AdminTests />} />
                  <Route path="packages" element={<AdminPackages />} />
                  <Route path="doctors" element={<AdminDoctors />} />
                  <Route path="gallery" element={<AdminGallery />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="faqs" element={<AdminFaqs />} />
                  <Route path="blog" element={<AdminBlog />} />
                  <Route path="certifications" element={<AdminCertifications />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="visitors" element={<AdminVisitors />} />
                  <Route path="activity-logs" element={<AdminActivityLogs />} />
                  <Route path="profile" element={<AdminProfile />} />
                  <Route path="theme" element={<AdminThemeSettings />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="homepage" element={<AdminHomepageSections />} />
                  <Route path="statistics" element={<AdminStatistics />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="features" element={<AdminFeatures />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </ConfirmProvider>
        </AuthProvider>
    </TooltipProvider>

    {/* Vercel Monitoring */}
    <Analytics />
    <SpeedInsights />
  </ThemeProvider>
);

export default App;
