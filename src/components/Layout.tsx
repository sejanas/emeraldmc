import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import ScrollToTop from "@/components/ScrollToTop";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileCTA from "@/components/MobileCTA";
import { Outlet } from "react-router-dom";

const Layout = () => (
  <div className="flex min-h-screen flex-col">
    <PromoBanner />
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <ScrollToTop />
    <WhatsAppButton />
    <MobileCTA />
  </div>
);

export default Layout;
