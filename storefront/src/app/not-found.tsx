import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-5 pb-24 pt-16 text-center">
      <Logo />
      <span className="eyebrow mt-6">Página não encontrada</span>
      <h1 className="font-display text-[44px] font-normal leading-tight tracking-tight">Essa peça já foi <em className="text-terra">garimpada</em>.</h1>
      <p className="text-[15px] text-muted">O endereço não existe mais ou a peça saiu da vitrine.</p>
      <Link href="/#pecas" className="btn-primary">Ver peças disponíveis</Link>
    </div>
  );
}
