import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel Thrift" },
  robots: { index: false, follow: false },
};

// Staff panel. ".admin" scopes the denser control styles in admin.css to these pages.
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin min-h-screen bg-[#f4efe8] text-ink">{children}</div>;
}
