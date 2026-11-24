import type { Metadata } from "next";
import { ContactForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Fale conosco" };

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-7 px-5 pb-24 pt-14">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Central de ajuda</span>
        <h1 className="font-display text-[40px] font-normal tracking-tight">Fale <em className="text-terra">conosco</em></h1>
        <p className="text-[15px] text-muted">Dúvida sobre um pedido, troca ou peça? Mande sua mensagem — se for sobre um pedido, informe o número.</p>
      </div>
      <div className="rounded-[18px] border border-line bg-card p-6">
        <ContactForm />
      </div>
    </div>
  );
}
