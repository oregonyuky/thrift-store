import type { Metadata } from "next";
import { PageHeader } from "@/components/painel/Fields";
import { HeroUpload } from "@/components/painel/HeroUpload";
import { getHeroImage } from "@/lib/painel/manage";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Site e banner" };
export const dynamic = "force-dynamic";

export default async function SitePage() {
  const session = await requireSession();
  const hero = await getHeroImage(session);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Site e banner" subtitle="O que aparece no topo da página inicial da loja." action={<a href="/" target="_blank" rel="noreferrer" className="btn-ghost">Ver a loja</a>} />
      <section className="panel p-6">
        <h2 className="mb-4 text-base font-bold">Imagem de destaque</h2>
        <HeroUpload current={hero} />
      </section>
    </div>
  );
}
