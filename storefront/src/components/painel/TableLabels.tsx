"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * On phones the panel tables (.rtable) turn each row into a card (see admin.css).
 * Each cell then needs its column name, which this copies from the header into
 * data-label. Header cells that only carry screen-reader text (the actions
 * column) get an empty label, so their buttons sit at the foot of the card.
 */
function label(root: ParentNode) {
  root.querySelectorAll<HTMLTableElement>("table.rtable").forEach((table) => {
    const heads = Array.from(table.querySelectorAll("thead th")).map((th) => {
      const visible = Array.from(th.childNodes).some(
        (n) => (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) || (n instanceof HTMLElement && !n.classList.contains("sr-only") && n.textContent?.trim()),
      );
      return visible ? (th.textContent ?? "").trim() : "";
    });
    table.querySelectorAll("tbody tr").forEach((tr) => {
      Array.from(tr.children).forEach((cell, i) => {
        const text = heads[i] ?? "";
        if (cell.getAttribute("data-label") !== text) cell.setAttribute("data-label", text);
      });
    });
  });
}

export function TableLabels() {
  const pathname = usePathname();

  useEffect(() => {
    label(document);
    const observer = new MutationObserver(() => label(document));
    const main = document.querySelector("main") ?? document.body;
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
