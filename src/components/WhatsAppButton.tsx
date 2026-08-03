"use client";

import { MessageCircle } from "lucide-react";
import { siteSettings } from "@/lib/settings";

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${siteSettings.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring fixed bottom-5 rtl:left-5 ltr:right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={26} />
    </a>
  );
}
