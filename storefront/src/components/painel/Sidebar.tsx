"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BagIcon,
  BoxIcon,
  CardIcon,
  ChatIcon,
  CloseIcon,
  GridIcon,
  LockIcon,
  MenuIcon,
  OrderIcon,
  PeopleIcon,
  ShirtIcon,
  SparkIcon,
  StoreIcon,
  TagIcon,
  WindowIcon,
} from "./icons";

interface Item {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: number;
}

export function Sidebar({ name, roles, badges }: { name: string; roles: string[]; badges: { orders?: number; messages?: number | null } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Same rule as the legacy panel: each area is a role named after it. No roles at all = show everything.
  const isAdmin = roles.some((r) => r.toLowerCase() === "admin" || r.toLowerCase() === "administrator");
  const allowed = (role?: string) => !role || roles.length === 0 || isAdmin || roles.includes(role);

  const groups: Array<[string | null, Array<Item & { role?: string }>]> = [
    [null, [{ href: "/painel", label: "Visão geral", icon: GridIcon }]],
    [
      "Vendas",
      [
        { href: "/painel/pedidos", label: "Pedidos", icon: OrderIcon, badge: badges.orders, role: "Orders" },
        { href: "/painel/sacolinhas", label: "Sacolinhas", icon: BagIcon, role: "Bags" },
        { href: "/painel/clientes", label: "Clientes", icon: PeopleIcon, role: "Customers" },
        { href: "/painel/mensagens", label: "Mensagens", icon: ChatIcon, badge: badges.messages ?? undefined, role: "Messages" },
      ],
    ],
    [
      "Catálogo",
      [
        { href: "/painel/produtos", label: "Produtos", icon: ShirtIcon, role: "Products" },
        { href: "/painel/categorias", label: "Categorias", icon: TagIcon, role: "Categories" },
        { href: "/painel/drops", label: "Drops", icon: SparkIcon, role: "DropConfigs" },
      ],
    ],
    ["Envio", [{ href: "/painel/envio", label: "Caixas e embalagens", icon: BoxIcon, role: "ShippingBoxes" }]],
    [
      "Configurações",
      [
        { href: "/painel/site", label: "Site e banner", icon: WindowIcon, role: "Site" },
        { href: "/painel/empresa", label: "Minha empresa", icon: StoreIcon, role: "Companies" },
        { href: "/painel/pagamentos", label: "Formas de pagamento", icon: CardIcon, role: "PaymentTypes" },
        { href: "/painel/usuarios", label: "Usuários e acesso", icon: LockIcon, role: "Users" },
      ],
    ],
  ].map(([title, items]) => [title, (items as Array<Item & { role?: string }>).filter((i) => allowed(i.role))] as [string | null, Array<Item & { role?: string }>]).filter(([, items]) => items.length > 0);

  const isActive = (href: string) => (href === "/painel" ? pathname === "/painel" : pathname.startsWith(href));

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
                const active = isActive(item.href);
                const cls = `flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm ${active ? "bg-ink-2 font-bold text-card" : "text-[#d9ccc2] hover:bg-ink-2 hover:text-card"}`;
                const content = (
                  <>
                    <item.icon />
                    {item.label}
                    {!!item.badge && (
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold text-card ${item.href === "/painel/pedidos" ? "bg-terra" : "bg-[#4a3b38]"}`}>{item.badge}</span>
                    )}
                  </>
                );
                return (
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
            <form action="/painel/logout" method="post">
              <span className="flex gap-3 text-[#a3948a]">
                <Link href="/painel/perfil" onClick={() => setOpen(false)} className="hover:text-card">Meu perfil</Link>
                <button type="submit" className="hover:text-card">Sair</button>
              </span>
            </form>
          </span>
        </div>
      </aside>
    </>
  );
}
