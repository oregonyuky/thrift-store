"use client";

import { usePathname } from "next/navigation";

/** Renders its children except on the given paths (e.g. the phone tab bar on /checkout). */
export function HideOn({ paths, children }: { paths: string[]; children: React.ReactNode }) {
  const pathname = usePathname();
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ? null : <>{children}</>;
}
