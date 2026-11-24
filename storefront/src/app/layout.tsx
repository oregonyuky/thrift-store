import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Thrift Brechó", template: "%s · Thrift Brechó" },
  description: "Peças únicas de brechó com curadoria feita à mão. Pagamento no Pix e sacolinha com frete único.",
};

export const viewport: Viewport = {
  themeColor: "#2a1f1e",
};

// The store chrome lives in (loja)/layout.tsx and the staff panel in painel/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-paper">{children}</body>
    </html>
  );
}
