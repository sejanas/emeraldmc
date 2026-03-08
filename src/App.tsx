import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import AdminRoute from "@/components/AdminRoute";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import TestsPage from "./pages/TestsPage";
import PackagesPage from "./pages/PackagesPage";
import DoctorsPage from "./pages/DoctorsPage";
import BookingPage from "./pages/BookingPage";
import GalleryPage from "./pages/GalleryPage";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminSignup from "./pages/admin/AdminSignup";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminTests from "./pages/admin/AdminTests";
import AdminPackages from "./pages/admin/AdminPackages";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminActivityLogs from "./pages/admin/AdminActivityLogs";
import AdminProfile from "./pages/admin/AdminProfile";
import LogoutPage from "./pages/LogoutPage";

const App = () => (
  <TooltipProvider>
      <AuthProvider>
        <ConfirmProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/tests" element={<TestsPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/book" element={<BookingPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="/admin/logout" element={<LogoutPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="tests" element={<AdminTests />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="doctors" element={<AdminDoctors />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="activity-logs" element={<AdminActivityLogs />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </ConfirmProvider>
      </AuthProvider>
  </TooltipProvider>
);

export default App;
