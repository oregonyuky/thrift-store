import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Thrift admin", template: "%s · Thrift admin" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#f4efe8] text-ink">{children}</body>
    </html>
  );
}
