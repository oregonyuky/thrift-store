import Link from "next/link";
import type { Product } from "@/lib/store";
import { discountPercent, money } from "@/lib/format";

const tones = ["#e6d3c6", "#d6ddd0", "#eaddcf", "#dccbc3", "#e1e3d3", "#e9d6cc", "#d9d2c7", "#e4d9c9"];

export function ProductImage({ product, index = 0, className = "" }: { product: Pick<Product, "imageUrl" | "name" | "altText">; index?: number; className?: string }) {
  if (product.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.imageUrl} alt={product.altText || product.name} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div className={`@container flex h-full w-full items-end justify-center px-3 pb-4 text-center text-xs uppercase tracking-[0.1em] text-[#7d6a62] ${className}`} style={{ background: tones[index % tones.length] }}>
      {/* The name only fits on large cards; thumbnails show the tone alone. */}
      <span className="hidden @[140px]:block">{product.name}</span>
    </div>
  );
}

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const off = discountPercent(product.price, product.oldPrice);
  const size = product.sizes[0]?.size;
  return (
    <article data-reveal style={{ "--d": `${(index % 4) * 80}ms` } as React.CSSProperties} className="group flex flex-col gap-3.5">
      <Link href={`/produto/${product.id}`} className="relative block aspect-[4/5] overflow-hidden rounded-[14px] bg-sand">
        <ProductImage product={product} index={index} className="transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
        {off > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-terra px-2.5 py-1 text-xs font-bold text-card">-{off}%</span>
        )}
      </Link>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium leading-snug">
          <Link href={`/produto/${product.id}`} className="hover:text-terra">{product.name}</Link>
        </h3>
        {size && <span className="text-[13px] text-muted">Tam. {size}</span>}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="num text-lg font-bold">{money(product.price)}</span>
          {off > 0 && <span className="num text-sm text-muted line-through">{money(product.oldPrice)}</span>}
        </div>
      </div>
    </article>
  );
}
