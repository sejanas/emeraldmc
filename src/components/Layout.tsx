import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileCTA from "@/components/MobileCTA";
import JsonLd, { websiteSchema, organizationSchema, siteNavigationSchema } from "@/components/JsonLd";
import { Outlet } from "react-router-dom";
import { AnnouncementProvider } from "@/components/announcements/AnnouncementProvider";
import AnnouncementTopBar from "@/components/announcements/placements/AnnouncementTopBar";
import AnnouncementPopup from "@/components/announcements/placements/AnnouncementPopup";
import AnnouncementCornerToast from "@/components/announcements/placements/AnnouncementCornerToast";
import AnnouncementInline from "@/components/announcements/placements/AnnouncementInline";

const Layout = () => (
  <AnnouncementProvider>
    <div className="flex min-h-screen flex-col">
      <JsonLd schema={websiteSchema} />
      <JsonLd schema={organizationSchema} />
      <JsonLd schema={siteNavigationSchema} />
      <AnnouncementTopBar />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <AnnouncementInline />
      <Footer />
      <ScrollToTop />
      <WhatsAppButton />
      <MobileCTA />
      <AnnouncementPopup />
      <AnnouncementCornerToast />
    </div>
  </AnnouncementProvider>
);

export default Layout;
