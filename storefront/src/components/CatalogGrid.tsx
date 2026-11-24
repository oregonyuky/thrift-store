"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/store";
import { ProductCard } from "./ProductCard";

export function CatalogGrid({ products, categories, initialCategory }: { products: Product[]; categories: Category[]; initialCategory?: string }) {
  const [selected, setSelected] = useState<string | null>(
    initialCategory && categories.some((c) => c.id === initialCategory) ? initialCategory : null,
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) if (p.categoryId) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    return map;
  }, [products]);

  const visibleCategories = categories.filter((c) => (counts.get(c.id) ?? 0) > 0);
  const list = selected ? products.filter((p) => p.categoryId === selected) : products;

  const chip = (active: boolean) =>
    `h-11 rounded-full border-[1.5px] px-[18px] text-sm font-medium transition-colors ${
      active ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink hover:border-ink"
    }`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <span className="eyebrow">Garimpo da semana</span>
          <h2 className="font-display text-[40px] font-normal tracking-tight md:text-5xl">
            Peças <em className="text-terra">amadas</em>
          </h2>
        </div>
        <span className="text-sm text-muted" aria-live="polite">
          {list.length} {list.length === 1 ? "peça" : "peças"}
        </span>
      </div>

      {visibleCategories.length > 0 && (
        <div role="group" aria-label="Filtrar por categoria" className="flex flex-wrap gap-2.5">
          <button type="button" aria-pressed={selected === null} onClick={() => setSelected(null)} className={chip(selected === null)}>
            Todas <span className="ml-1 opacity-65">{products.length}</span>
          </button>
          {visibleCategories.map((c) => (
            <button key={c.id} type="button" aria-pressed={selected === c.id} onClick={() => setSelected(c.id)} className={chip(selected === c.id)}>
              {c.name} <span className="ml-1 opacity-65">{counts.get(c.id)}</span>
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-14 text-center text-muted">
          Nenhuma peça disponível agora. Volte em breve — sempre chega garimpo novo.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
