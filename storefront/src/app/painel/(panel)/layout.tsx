import Link from "next/link";
import { Suspense } from "react";
import { Sidebar } from "@/components/painel/Sidebar";
import { DetailScroll } from "@/components/painel/DetailScroll";
import { TableLabels } from "@/components/painel/TableLabels";
import { PlusIcon } from "@/components/painel/icons";
import { getOrders, getUnreadMessages } from "@/lib/painel/data";
import { requireSession } from "@/lib/painel/session";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [orders, messages] = await Promise.all([getOrders(session).catch(() => []), getUnreadMessages(session)]);
  const toShip = orders.filter((o) => o.stage >= 1 && o.stage <= 3).length;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar name={session.name} roles={session.roles} badges={{ orders: toShip, messages }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-line bg-card px-5 py-3 md:px-8">
          <a href="/" target="_blank" rel="noreferrer" className="px-3 py-2.5 text-sm font-medium hover:text-terra">
            Ver loja
          </a>
          <Link href="/painel/produtos?nova=1" className="btn-primary">
            <PlusIcon size={16} /> Nova peça
          </Link>
        </div>
        <main className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-6 md:px-8 md:pt-7">{children}</main>
        <TableLabels />
        <Suspense fallback={null}>
          <DetailScroll />
        </Suspense>
      </div>
    </div>
  );
}
