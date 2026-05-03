"use client";

import { MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const WHATSAPP_URL = "https://wa.me/224622112233";

export function WhatsAppButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Commander via WhatsApp"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 hover:bg-[#20BD5A] hover:shadow-xl active:scale-95"
        >
          <MessageCircle className="size-7" />
        </a>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={8}>
        Commander via WhatsApp
      </TooltipContent>
    </Tooltip>
  );
}
