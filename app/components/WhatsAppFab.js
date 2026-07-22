import WhatsAppIcon from "./WhatsAppIcon";
import { SUPPORT_WHATSAPP, SUPPORT_WHATSAPP_DISPLAY, whatsappHref } from "@/lib/config";

// Persistent bottom-right "chat with us" button, mounted once in the root
// layout so it rides along on every page. Styling lives in globals.css
// (.wa-fab*) next to the other fixed chrome so its z-index sits below modals
// and toasts but above page content. Renders nothing if no number is set.
export default function WhatsAppFab() {
  if (!SUPPORT_WHATSAPP) return null;

  return (
    <a
      className="wa-fab"
      href={whatsappHref("Hi Elvoria, I need help with my account.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with Elvoria support on WhatsApp (${SUPPORT_WHATSAPP_DISPLAY})`}
      title="Chat with us on WhatsApp"
    >
      <span className="wa-fab-icon">
        <WhatsAppIcon size={30} />
      </span>
      <span className="wa-fab-label">Chat with us</span>
    </a>
  );
}
