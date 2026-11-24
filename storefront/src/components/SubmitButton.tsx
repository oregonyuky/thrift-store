"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pending, className = "btn-primary" }: { children: React.ReactNode; pending?: string; className?: string }) {
  const status = useFormStatus();
  return (
    <button type="submit" disabled={status.pending} className={className} aria-busy={status.pending}>
      {status.pending ? pending ?? "Aguarde..." : children}
    </button>
  );
}
