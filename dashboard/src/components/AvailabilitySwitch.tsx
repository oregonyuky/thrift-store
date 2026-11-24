"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setAvailability } from "@/app/actions";

export function AvailabilitySwitch({ productId, name, available, disabled }: { productId: string; name: string; available: boolean; disabled?: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(available);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        aria-label={`À venda: ${name}`}
        disabled={disabled || pending}
        onClick={() =>
          start(async () => {
            setError(null);
            setOptimistic(!optimistic);
            const result = await setAvailability(productId, !optimistic);
            if (result.error) setError(result.error);
          })
        }
        className={`flex h-[26px] w-11 items-center rounded-full p-[3px] transition-colors disabled:opacity-50 ${optimistic ? "justify-end bg-sage" : "justify-start bg-[#cfc3b6]"}`}
      >
        <span className="h-5 w-5 rounded-full bg-card shadow-[0_1px_3px_rgba(0,0,0,0.2)]" />
      </button>
      {error && <span role="alert" className="max-w-[160px] text-[11px] text-bad-fg">{error}</span>}
    </div>
  );
}
