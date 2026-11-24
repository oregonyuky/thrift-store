import type { Metadata, Viewport } from "next";
import { Footer, Header, MobileNav } from "@/components/SiteChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Thrift Brechó", template: "%s · Thrift Brechó" },
  description: "Peças únicas de brechó com curadoria feita à mão. Pagamento no Pix e sacolinha com frete único.",
};

export const viewport: Viewport = {
  themeColor: "#2a1f1e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-paper">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo">{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
