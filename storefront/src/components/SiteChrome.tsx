import Link from "next/link";
import { getCartIds, getSession } from "@/lib/session";
import { Logo } from "./Logo";
import { BagIcon, HelpIcon, HomeIcon, UserIcon } from "./icons";

export async function Header() {
  const [session, cart] = await Promise.all([getSession(), getCartIds()]);
  const count = cart.length;

  return (
    <>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 bg-ink px-6 py-2.5 text-[13px] tracking-[0.04em] text-paper">
        <span>Frete grátis acima de R$ 150</span>
        <span className="hidden text-blush sm:inline" aria-hidden="true">·</span>
        <span className="hidden sm:inline">Troca em 7 dias</span>
        <span className="hidden text-blush sm:inline" aria-hidden="true">·</span>
        <span className="hidden sm:inline">Cada peça é única</span>
      </div>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-5 py-4 md:px-8">
          <Logo />
          <nav aria-label="Principal" className="hidden gap-8 text-[15px] font-medium md:flex">
            <Link className="hover:text-terra" href="/#pecas">Novidades</Link>
            <Link className="hover:text-terra" href="/#drop">Drop</Link>
            <Link className="hover:text-terra" href="/#como">Como funciona</Link>
            <Link className="hover:text-terra" href="/ajuda">Ajuda</Link>
          </nav>
          <div className="flex items-center gap-1">
            <Link
              href={session ? "/conta" : "/entrar"}
              aria-label={session ? `Minha conta, ${session.name}` : "Entrar na conta"}
              className="hidden h-11 items-center gap-2 rounded-full px-3 text-sm font-medium hover:bg-sand md:flex"
            >
              <UserIcon />
              <span className="max-w-[140px] truncate">{session ? session.name.split(" ")[0] : "Entrar"}</span>
            </Link>
            <Link
              href="/carrinho"
              aria-label={`Carrinho, ${count} ${count === 1 ? "peça" : "peças"}`}
              className="flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium hover:bg-sand"
            >
              <BagIcon />
              {count > 0 && <span className="rounded-full bg-terra px-[7px] py-[2px] text-xs font-bold text-card">{count}</span>}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

export async function MobileNav() {
  const session = await getSession();
  const item = "flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted hover:text-terra";
  return (
    <nav
      aria-label="Atalhos"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-card px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-1 md:hidden"
    >
      <Link href="/" className={item}><HomeIcon size={22} />Início</Link>
      <Link href="/carrinho" className={item}><BagIcon size={22} />Carrinho</Link>
      <Link href="/ajuda" className={item}><HelpIcon size={22} />Ajuda</Link>
      <Link href={session ? "/conta" : "/entrar"} className={item}><UserIcon size={22} />Conta</Link>
    </nav>
  );
}

export function Footer() {
  const instagram = process.env.INSTAGRAM_URL;
  return (
    <footer className="border-t border-line bg-sand pb-20 md:pb-0">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 pb-8 pt-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div className="flex flex-col gap-3">
          <span className="font-display text-[32px] font-medium italic">Thrift</span>
          <p className="max-w-[300px] text-sm leading-relaxed text-muted">
            Moda circular com curadoria. Cada peça tem uma história — e agora ela continua com você.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 text-sm">
          <span className="font-bold">Loja</span>
          <Link href="/#pecas" className="hover:text-terra">Novidades</Link>
          <Link href="/#drop" className="hover:text-terra">Drop</Link>
          <Link href="/#como" className="hover:text-terra">Como funciona</Link>
        </div>
        <div className="flex flex-col gap-2.5 text-sm">
          <span className="font-bold">Ajuda</span>
          <Link href="/ajuda" className="hover:text-terra">Dúvidas frequentes</Link>
          <Link href="/fale-conosco" className="hover:text-terra">Fale conosco</Link>
          {instagram && <a href={instagram} target="_blank" rel="noreferrer" className="hover:text-terra">Instagram</a>}
        </div>
        <div className="flex flex-col gap-2.5 text-sm">
          <span className="font-bold">Minha conta</span>
          <Link href="/conta" className="hover:text-terra">Minha conta</Link>
          <Link href="/minhas-compras" className="hover:text-terra">Minhas compras</Link>
          <Link href="/carrinho" className="hover:text-terra">Carrinho e sacolinha</Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-3 border-t border-[#dccfbf] px-5 pb-8 pt-5 text-[13px] text-muted md:px-8">
        <span>© Thrift Brechó</span>
        <span>Pagamentos via Pix</span>
      </div>
    </footer>
  );
}
