"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Query keys that open a detail or edit panel (not filters like etapa or periodo).
const OPENERS = ["id", "editar", "caixa", "categoria", "nova", "novo", "config", "recarga"];

/**
 * Below 1024px the detail panel stacks under the list, out of sight. When a row
 * or a "new" button opens one, scroll it into view so the tap visibly does something.
 */
export function DetailScroll() {
  const params = useSearchParams();
  const key = OPENERS.map((k) => params.get(k) ?? "").join("|");

  useEffect(() => {
    if (!key.replace(/\|/g, "") || window.innerWidth >= 1024) return;
    const detail = document.querySelector<HTMLElement>("main [data-detail]");
    if (!detail) return;
    if (detail.getBoundingClientRect().top < 80) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    detail.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [key]);

  return null;
}
