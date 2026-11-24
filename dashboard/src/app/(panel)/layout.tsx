import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { PlusIcon } from "@/components/icons";
import { getOrders, getUnreadMessages, legacyUrl } from "@/lib/data";
import { requireSession } from "@/lib/session";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [orders, messages] = await Promise.all([getOrders(session).catch(() => []), getUnreadMessages(session)]);
  const toShip = orders.filter((o) => o.stage >= 1 && o.stage <= 3).length;

  const legacy = {
    customers: legacyUrl("/Customers/Customer"),
    messages: legacyUrl("/Messages/Message"),
    categories: legacyUrl("/Categories/Category"),
    drops: legacyUrl("/DropConfigs/DropConfig"),
    boxes: legacyUrl("/ShippingBoxes/ShippingBox"),
    site: legacyUrl("/Site/SiteSettings"),
    users: legacyUrl("/Users/UserList"),
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar name={session.name} legacy={legacy} badges={{ orders: toShip, messages }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-line bg-card px-5 py-3 md:px-8">
          {process.env.STOREFRONT_URL && (
            <a href={process.env.STOREFRONT_URL} target="_blank" rel="noreferrer" className="px-3 py-2.5 text-sm font-medium hover:text-terra">
              Ver loja
            </a>
          )}
          <Link href="/produtos?nova=1" className="btn-primary">
            <PlusIcon size={16} /> Nova peça
          </Link>
        </div>
        <main className="mx-auto w-full max-w-[1280px] px-5 pb-12 pt-7 md:px-8">{children}</main>
      </div>
    </div>
  );
}
