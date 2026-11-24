import Image from "next/image";
import Link from "next/link";
import { CatalogGrid } from "@/components/CatalogGrid";
import { Countdown } from "@/components/Countdown";
import { CheckIcon, InstagramIcon } from "@/components/icons";
import { Marquee, Parallax } from "@/components/Motion";
import { media } from "@/lib/media";
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
  // Small card over the hero: the picture uploaded in /painel/site, else the newest piece with a photo.
  const featured = products.find((p) => p.imageUrl);
  const spotlight = heroImage
    ? { image: heroImage, alt: "Destaque da coleção Thrift Brechó", label: "Destaque da semana", href: "#pecas" }
    : featured
      ? { image: featured.imageUrl!, alt: featured.altText || featured.name, label: featured.name, href: `/produto/${featured.id}` }
      : null;

  return (
    <>
      <section className="mx-auto max-w-[1280px] px-5 pt-5 md:px-8 md:pt-8">
        <div className="relative isolate h-[78svh] max-h-[780px] min-h-[540px] overflow-hidden rounded-[18px] bg-ink text-paper">
          <Parallax speed={0.18} className="absolute inset-x-0 -bottom-[12%] -top-[12%] -z-10">
            <Image src={media.hero.src} alt={media.hero.alt} fill priority sizes="(min-width: 1280px) 1216px, 100vw" className="kenburns object-cover" />
          </Parallax>
          {/* Scrim: keeps the headline legible over the photo (functional, not decorative). */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(42,31,30,0.88)_0%,rgba(42,31,30,0.45)_45%,rgba(42,31,30,0.1)_100%)] md:bg-[linear-gradient(90deg,rgba(42,31,30,0.86)_0%,rgba(42,31,30,0.5)_42%,rgba(42,31,30,0)_72%)]" />

          <div className="flex h-full max-w-[640px] flex-col justify-end gap-6 p-6 pb-10 md:justify-center md:p-14">
            <span className="eyebrow rise !text-blush" style={{ "--d": "0ms" } as React.CSSProperties}>
              {drop && !dropUpcoming ? `${drop.titulo} · já no ar` : "Curadoria feita à mão"}
            </span>
            <h1 className="font-display text-[44px] font-normal leading-[0.98] tracking-[-0.03em] md:text-[76px]">
              <span className="rise" style={{ "--d": "120ms" } as React.CSSProperties}>Peças únicas,</span>
              <span className="rise" style={{ "--d": "240ms" } as React.CSSProperties}>
                <em className="text-blush">histórias</em> que
              </span>
              <span className="rise" style={{ "--d": "360ms" } as React.CSSProperties}>continuam.</span>
            </h1>
            <p className="rise max-w-[440px] text-lg leading-relaxed text-[#e9ded5]" style={{ "--d": "480ms" } as React.CSSProperties}>
              Garimpo com curadoria feita à mão. Só existe uma de cada — quando ela vai, não volta.
            </p>
            <div className="rise flex flex-wrap gap-3" style={{ "--d": "600ms" } as React.CSSProperties}>
              <Link href="#pecas" className="btn-primary">Explorar peças</Link>
              <Link href="#como" className="btn-ghost !border-paper !text-paper hover:!bg-paper hover:!text-ink">
                Como funciona a sacolinha
              </Link>
            </div>
          </div>

          {products.length > 0 && (
            <div className="float absolute right-5 top-5 flex flex-col gap-0.5 rounded-[14px] bg-card px-[18px] py-3.5 text-ink shadow-[0_10px_30px_rgba(42,31,30,0.25)] md:right-8 md:top-8">
              <span className="text-xs text-muted">Disponíveis agora</span>
              <span className="num font-display text-[28px] font-medium">{products.length} {products.length === 1 ? "peça" : "peças"}</span>
            </div>
          )}

          {spotlight && (
            <Link
              href={spotlight.href}
              className="float-slow absolute bottom-10 right-10 hidden w-[200px] flex-col gap-2 rounded-[14px] bg-card p-2.5 pb-3 text-ink shadow-[0_18px_40px_rgba(42,31,30,0.35)] lg:flex"
              style={{ "--r": "-4deg" } as React.CSSProperties}
            >
              <span className="block aspect-[4/5] overflow-hidden rounded-[10px] bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={spotlight.image} alt={spotlight.alt} className="h-full w-full object-cover" />
              </span>
              <span className="px-1 text-[13px] font-medium leading-snug">{spotlight.label}</span>
            </Link>
          )}
        </div>
      </section>

      <section aria-label="Por que comprar na Thrift" className="mt-10 bg-ink py-5 text-paper md:mt-14">
        <Marquee items={["Peça única", "Pagamento no Pix", "Frete único na sacolinha", "Carta da Thrift em cada envio", "Curadoria feita à mão", "Garimpo novo toda semana"]} />
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

      <section id="drop" className="scroll-mt-4 overflow-hidden bg-ink text-paper">
        <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 py-20 md:grid-cols-[0.85fr_1.15fr] md:gap-16 md:px-8 md:py-[88px]">
          <div data-reveal className="relative mx-auto w-full max-w-[440px]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-b-[18px] rounded-t-[220px] bg-ink-2">
              <Image src={media.lookbook.src} alt={media.lookbook.alt} fill sizes="(min-width: 768px) 440px, 90vw" className="pan-y object-cover" />
            </div>
            <span className="float absolute -left-3 bottom-10 rounded-full bg-card px-5 py-3 text-sm font-bold text-ink shadow-[0_10px_30px_rgba(0,0,0,0.3)] md:-left-8" style={{ "--r": "-3deg" } as React.CSSProperties}>
              Garimpo novo toda semana
            </span>
          </div>

          <div data-reveal className="flex max-w-[560px] flex-col gap-5" style={{ "--d": "150ms" } as React.CSSProperties}>
            {drop && dropUpcoming ? (
              <>
                <span className="eyebrow !text-blush">Próximo drop</span>
                <h2 className="font-display text-[44px] font-normal leading-none tracking-tight md:text-[60px]">{drop.titulo}</h2>
                <p className="text-[17px] leading-relaxed text-[#d9ccc2]">
                  {drop.subtitulo || "Quantidades bem limitadas. Fique de olho para garantir a sua."}
                </p>
                <Countdown date={drop.dataLiberacaoUtc} />
              </>
            ) : (
              <>
                <span className="eyebrow !text-blush">Lookbook</span>
                <h2 className="font-display text-[44px] font-normal leading-[1.02] tracking-tight md:text-[60px]">
                  Vintage com <em className="text-blush">atitude</em> de agora.
                </h2>
                <p className="text-[17px] leading-relaxed text-[#d9ccc2]">
                  Jaquetas, alfaiataria, jeans e achados que não se repetem. A gente garimpa, lava, ajusta e fotografa cada peça antes de ela chegar até você.
                </p>
              </>
            )}
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="#pecas" className="btn-primary">Ver as peças</Link>
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="btn-ghost !border-paper !text-paper hover:!bg-paper hover:!text-ink">
                  <InstagramIcon size={18} /> Acompanhar no Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="como" className="mx-auto grid max-w-[1280px] scroll-mt-4 items-center gap-12 px-5 py-20 md:px-8 md:py-[88px] lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <div data-reveal className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-sand">
            <Image src={media.envio.src} alt={media.envio.alt} fill sizes="(min-width: 1024px) 580px, 100vw" className="kenburns object-cover" />
          </div>
          <div className="float-slow absolute -bottom-6 right-4 flex items-center gap-3 rounded-[14px] bg-card px-4 py-3 shadow-[0_10px_30px_rgba(42,31,30,0.16)] md:right-8">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ok-bg text-sage">
              <CheckIcon size={20} />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-bold">Embalagem caprichada</span>
              <span className="text-[13px] text-muted">Carta da Thrift em cada envio</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-9">
          <div data-reveal className="flex max-w-[560px] flex-col gap-2.5">
            <span className="eyebrow">Como funciona</span>
            <h2 className="font-display text-[38px] font-normal leading-[1.05] tracking-tight md:text-5xl">
              A sacolinha junta suas compras num <em className="text-terra">envio só</em>.
            </h2>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {steps.map(([title, body], i) => (
              <li
                key={title}
                data-reveal
                style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
                className="group flex flex-col gap-2.5 rounded-[18px] border border-line bg-card p-6 transition-colors hover:border-terra"
              >
                <span className="font-display text-[36px] italic leading-none text-terra transition-transform duration-300 group-hover:translate-x-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {(posts.length > 0 || instagramUrl) && (
        <section className="mx-auto flex max-w-[1280px] flex-col gap-7 border-t border-line px-5 py-20 md:px-8">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[40px] font-normal tracking-tight">
              No <em className="text-terra">Instagram</em>
            </h2>
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noreferrer" className="link-grow text-[15px] font-medium hover:text-terra">
                Seguir a Thrift
              </a>
            )}
          </div>
          {posts.length > 0 && (
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {posts.map((post, i) => (
                <a key={post.id} data-reveal style={{ "--d": `${i * 70}ms` } as React.CSSProperties} href={post.permalink} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-xl bg-sand">
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
