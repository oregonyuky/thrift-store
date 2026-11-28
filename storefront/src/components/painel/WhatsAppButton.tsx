import { ChatIcon } from "./icons";

/** wa.me link for a Brazilian number typed in any format; null when it is too short to dial. */
export function whatsAppUrl(phone?: string | null, text?: string) {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^0+/, "");
  const local = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length < 10 || local.length > 11) return null;
  return `https://wa.me/55${local}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function WhatsAppButton({ phone, label = "Conversar no WhatsApp", text, className = "" }: { phone?: string | null; label?: string; text?: string; className?: string }) {
  const href = whatsAppUrl(phone, text);
  if (!href) return null;
  return (
    <a className={`btn-primary !bg-sage hover:!bg-[#435c49] ${className}`} href={href} target="_blank" rel="noreferrer">
      <ChatIcon size={16} /> {label}
    </a>
  );
}
