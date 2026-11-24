"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BagIcon,
  BoxIcon,
  ChatIcon,
  CloseIcon,
  ExternalIcon,
  GridIcon,
  LockIcon,
  MenuIcon,
  OrderIcon,
  PeopleIcon,
  ShirtIcon,
  SparkIcon,
  TagIcon,
  WindowIcon,
} from "./icons";

interface Item {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: number;
  external?: boolean;
}

export function Sidebar({ name, legacy, badges }: { name: string; legacy: Record<string, string>; badges: { orders?: number; messages?: number | null } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groups: Array<[string | null, Item[]]> = [
    [null, [{ href: "/", label: "Visão geral", icon: GridIcon }]],
    [
      "Vendas",
      [
        { href: "/pedidos", label: "Pedidos", icon: OrderIcon, badge: badges.orders },
        { href: "/sacolinhas", label: "Sacolinhas", icon: BagIcon },
        { href: legacy.customers, label: "Clientes", icon: PeopleIcon, external: true },
        { href: legacy.messages, label: "Mensagens", icon: ChatIcon, badge: badges.messages ?? undefined, external: true },
      ],
    ],
    [
      "Catálogo",
      [
        { href: "/produtos", label: "Produtos", icon: ShirtIcon },
        { href: legacy.categories, label: "Categorias", icon: TagIcon, external: true },
        { href: legacy.drops, label: "Drops", icon: SparkIcon, external: true },
      ],
    ],
    ["Envio", [{ href: legacy.boxes, label: "Caixas e embalagens", icon: BoxIcon, external: true }]],
    [
      "Configurações",
      [
        { href: legacy.site, label: "Site e banner", icon: WindowIcon, external: true },
        { href: legacy.users, label: "Usuários e acesso", icon: LockIcon, external: true },
      ],
    ],
  ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <div className="flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <span className="flex items-baseline gap-2">
          <span className="font-display text-2xl italic text-card">Thrift</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blush">admin</span>
        </span>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="sidebar" aria-label={open ? "Fechar menu" : "Abrir menu"} className="flex h-11 w-11 items-center justify-center rounded-lg text-card">
          {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>
      <aside
        id="sidebar"
        className={`${open ? "flex" : "hidden"} w-full shrink-0 flex-col gap-0.5 bg-ink px-3.5 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[248px] lg:overflow-y-auto`}
      >
        <div className="hidden items-baseline gap-2 px-3 pb-[18px] pt-1 lg:flex">
          <span className="font-display text-[28px] italic text-card">Thrift</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blush">admin</span>
        </div>
        <nav aria-label="Menu do painel" className="flex flex-col gap-0.5">
          {groups.map(([title, items], gi) => (
            <div key={gi} className="flex flex-col gap-0.5">
              {title && <span className="px-3 pb-1.5 pt-4 text-[11px] uppercase tracking-[0.16em] text-[#a3948a]">{title}</span>}
              {items.map((item) => {
                const active = !item.external && isActive(item.href);
                const cls = `flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm ${active ? "bg-ink-2 font-bold text-card" : "text-[#d9ccc2] hover:bg-ink-2 hover:text-card"}`;
                const content = (
                  <>
                    <item.icon />
                    {item.label}
                    {item.external && <ExternalIcon size={13} className="opacity-50" />}
                    {!!item.badge && (
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold text-card ${item.href === "/pedidos" ? "bg-terra" : "bg-[#4a3b38]"}`}>{item.badge}</span>
                    )}
                  </>
                );
                return item.external ? (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={cls} title="Abre no painel completo">
                    {content}
                  </a>
                ) : (
                  <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={cls} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="mt-6 flex items-center gap-2.5 border-t border-ink-2 px-3 pt-4 lg:mt-auto">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blush text-sm font-bold text-ink">{name.charAt(0).toUpperCase()}</span>
          <span className="flex min-w-0 flex-1 flex-col text-[13px] text-card">
            <span className="truncate">{name}</span>
            <form action="/logout" method="post">
              <button type="submit" className="text-[#a3948a] hover:text-card">Sair</button>
            </form>
          </span>
        </div>
      </aside>
    </>
  );
}
