"use client";

import { useEffect, useRef } from "react";

/**
 * Reveals every [data-reveal] element as it scrolls into view (adds data-shown).
 * Mounted once per page. Elements already on screen are shown before the hiding
 * class goes on, so nothing above the fold flickers; elements added later
 * (e.g. after filtering the catalog) are picked up by a MutationObserver.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    if (!("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-shown", "");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const track = (el: Element) => {
      if (el.hasAttribute("data-shown")) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0 && !root.classList.contains("reveal-on")) {
        el.setAttribute("data-shown", "");
        return;
      }
      io.observe(el);
    };

    document.querySelectorAll("[data-reveal]").forEach(track);
    root.classList.add("reveal-on");

    const mo = new MutationObserver((records) => {
      for (const rec of records) {
        rec.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.hasAttribute("data-reveal")) track(node);
          node.querySelectorAll?.("[data-reveal]").forEach(track);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove("reveal-on");
    };
  }, []);

  return null;
}

/** Moves its child slowly against the scroll, for a light parallax. */
export function Parallax({ children, speed = 0.12, className = "" }: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.parentElement?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) return;
      // Never move further than the bleed the wrapper has (about 10% of the frame).
      const limit = rect.height * 0.1;
      const raw = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
      const offset = Math.max(-limit, Math.min(limit, raw));
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}

/** An endless horizontal band of short phrases. */
export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul className="marquee-row" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <li key={`${t}-${i}`} className="flex items-center gap-8">
          <span>{t}</span>
          <span aria-hidden="true" className="text-blush">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
