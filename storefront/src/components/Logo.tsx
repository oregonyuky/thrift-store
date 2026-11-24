import Link from "next/link";

export function Logo({ size = "md" }: { size?: "md" | "sm" }) {
  return (
    <Link href="/" className="flex items-baseline gap-2 text-ink no-underline" aria-label="Thrift Brechó, início">
      <span className={`font-display italic font-medium tracking-tight ${size === "md" ? "text-[34px]" : "text-[28px]"}`}>Thrift</span>
      <span className="text-[12px] font-bold uppercase tracking-[0.28em] text-terra">Brechó</span>
    </Link>
  );
}
