import { MessageCircle } from "lucide-react";
import { businessInfo } from "@/data/siteData";

const WhatsAppButton = () => {
  const phone = businessInfo.phone.replace(/[^0-9]/g, "");
  const url = `https://wa.me/${phone}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 animate-whatsapp-pulse"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
};

export default WhatsAppButton;
