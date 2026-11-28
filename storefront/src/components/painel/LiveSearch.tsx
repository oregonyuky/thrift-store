"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

/**
 * A GET filter form that updates the list as you type (after a short pause) and as
 * soon as a select changes — no Enter or button needed. Enter still works.
 */
export function LiveSearch({ action, className = "", children }: { action: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const last = useRef<string | null>(null);
  const [pending, startTransition] = useTransition();

  const apply = () => {
    const form = ref.current;
    if (!form) return;
    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => {
      const v = String(value).trim();
      if (v) params.set(key, v);
    });
    const qs = params.toString();
    if (qs === last.current) return;
    last.current = qs;
    startTransition(() => router.replace(qs ? `${action}?${qs}` : action, { scroll: false }));
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <form
      ref={ref}
      action={action}
      role="search"
      aria-busy={pending}
      className={`${className} transition-opacity ${pending ? "opacity-70" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        clearTimeout(timer.current);
        apply();
      }}
      onInput={(e) => {
        clearTimeout(timer.current);
        const isText = e.target instanceof HTMLInputElement && (e.target.type === "search" || e.target.type === "text");
        if (isText) timer.current = setTimeout(apply, 300);
        else apply();
      }}
      onChange={(e) => {
        if (e.target instanceof HTMLSelectElement) {
          clearTimeout(timer.current);
          apply();
        }
      }}
    >
      {children}
    </form>
  );
}
