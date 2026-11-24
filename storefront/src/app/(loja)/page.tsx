import Link from "next/link";
import { CatalogGrid } from "@/components/CatalogGrid";
import { Countdown } from "@/components/Countdown";
import { CheckIcon, InstagramIcon } from "@/components/icons";
import { getInstagramPosts } from "@/lib/instagram";
import { getActiveDrop, getAvailableProducts, getCategories, getHeroImage, type Product } from "@/lib/store";

export const dynamic = "force-dynamic";

const steps = [
  ["Garimpe", "Escolha sua peça. Ela é única, então não espere muito."],
  ["Pague no Pix", "Pagou, é sua. Na opção sacolinha, a peça fica guardada para você."],
  ["Junte mais peças", "Até o prazo da sacolinha, tudo vai junto, com um frete só."],
  ["Receba e arrase", "Embalagem caprichada e carta da Thrift. Agora a história é sua."],
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ categoryId?: string }> }) {
  const { categoryId } = await searchParams;
  const [productsResult, categories, heroImage, drop, posts] = await Promise.all([
    getAvailableProducts().then(
      (p) => ({ ok: true as const, products: p }),
      () => ({ ok: false as const, products: [] as Product[] }),
    ),
    getCategories(),
    getHeroImage(),
    getActiveDrop(),
    getInstagramPosts(),
  ]);
  const { products } = productsResult;
  const dropUpcoming = drop && new Date(drop.dataLiberacaoUtc).getTime() > Date.now();
  const instagramUrl = process.env.INSTAGRAM_URL;

  return (
    <>
      <section className="mx-auto max-w-[1280px] px-5 pb-16 pt-10 md:px-8 md:pb-20 md:pt-14">
        <div className="grid items-center gap-12 md:grid-cols-[1.05fr_1fr] md:gap-14">
          <div className="flex flex-col gap-7">
            <span className="eyebrow">{drop && !dropUpcoming ? `${drop.titulo} · já no ar` : "Curadoria feita à mão"}</span>
            <h1 className="font-display text-[46px] font-normal leading-[0.98] tracking-[-0.03em] md:text-[76px]">
              Peças únicas,
              <br />
              <em className="text-terra">histórias</em> que continuam.
            </h1>
            <p className="max-w-[460px] text-lg leading-relaxed text-muted">
              Garimpo com curadoria feita à mão. Só existe uma de cada — quando ela vai, não volta.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="#pecas" className="btn-primary">Explorar peças</Link>
              <Link href="#como" className="btn-ghost">Como funciona a sacolinha</Link>
            </div>
            <ul className="flex flex-wrap gap-x-7 gap-y-2 border-t border-line pt-3 text-sm text-muted">
              {["Pagamento no Pix", "Frete único na sacolinha", "Carta da Thrift em cada envio"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckIcon size={18} className="text-sage" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative h-[420px] md:h-[600px]">
            <div className="absolute right-0 top-0 h-[88%] w-[78%] overflow-hidden rounded-t-[280px] rounded-b-2xl bg-[#e6d3c6]">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImage} alt="Destaque da coleção Thrift Brechó" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-end justify-center pb-7 font-display text-[120px] italic text-[#c9a99b]" aria-hidden="true">T</div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 h-[46%] w-[42%] overflow-hidden rounded-2xl border-8 border-paper bg-[#d6ddd0]">
              {products[1]?.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={products[1].imageUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            {products.length > 0 && (
              <div className="absolute bottom-12 right-6 flex flex-col gap-0.5 rounded-[14px] bg-card px-[18px] py-3.5 shadow-[0_10px_30px_rgba(42,31,30,0.12)]">
                <span className="text-xs text-muted">Disponíveis agora</span>
                <span className="num font-display text-[28px] font-medium">{products.length} {products.length === 1 ? "peça" : "peças"}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="pecas" className="scroll-mt-4 border-y border-line bg-card">
        <div className="mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-[72px]">
          {productsResult.ok ? (
            <CatalogGrid products={products} categories={categories} initialCategory={categoryId} />
          ) : (
            <p role="alert" className="rounded-2xl bg-bad-bg px-6 py-10 text-center text-bad-fg">
              Não foi possível carregar as peças agora. Atualize a página em instantes.
            </p>
          )}
        </div>
      </section>

      <section id="como" className="mx-auto flex max-w-[1280px] scroll-mt-4 flex-col gap-10 px-5 py-20 md:px-8 md:py-[88px]">
        <div className="flex max-w-[640px] flex-col gap-2.5">
          <span className="eyebrow">Como funciona</span>
          <h2 className="font-display text-[38px] font-normal leading-[1.05] tracking-tight md:text-5xl">
            A sacolinha junta suas compras num <em className="text-terra">envio só</em>.
          </h2>
        </div>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, body], i) => (
            <li key={title} className="flex flex-col gap-3 rounded-[18px] border border-line bg-card p-7">
              <span className="font-display text-[40px] italic text-terra">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {drop && dropUpcoming && (
        <section id="drop" className="scroll-mt-4 bg-ink text-paper">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-12 px-5 py-20 md:px-8">
            <div className="flex max-w-[520px] flex-col gap-4">
              <span className="eyebrow !text-blush">Próximo drop</span>
              <h2 className="font-display text-[44px] font-normal leading-none tracking-tight md:text-[56px]">{drop.titulo}</h2>
              <p className="text-[17px] leading-relaxed text-[#d9ccc2]">
                {drop.subtitulo || "Quantidades bem limitadas. Fique de olho para garantir a sua."}
              </p>
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="btn-primary mt-2 self-start">
                  <InstagramIcon size={18} /> Acompanhar no Instagram
                </a>
              )}
            </div>
            <Countdown date={drop.dataLiberacaoUtc} />
          </div>
        </section>
      )}

      {(posts.length > 0 || instagramUrl) && (
        <section className="mx-auto flex max-w-[1280px] flex-col gap-7 px-5 py-20 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[40px] font-normal tracking-tight">
              No <em className="text-terra">Instagram</em>
            </h2>
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noreferrer" className="text-[15px] font-medium underline underline-offset-4 hover:text-terra">
                Seguir a Thrift
              </a>
            )}
          </div>
          {posts.length > 0 && (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {posts.map((post) => (
                <a key={post.id} href={post.permalink} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-xl bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.imageUrl} alt={post.caption?.slice(0, 120) || "Post da Thrift no Instagram"} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                </a>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
