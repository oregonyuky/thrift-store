"use client";

import { useState } from "react";
import { PixPanel, type PixData } from "./PixPanel";

export function PendingPix({ data }: { data: PixData }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary min-h-11 self-start !px-5 text-sm">
        Ver Pix para pagar
      </button>
    );
  }
  return (
    <div className="rounded-2xl bg-paper p-5">
      <PixPanel data={data} />
    </div>
  );
}
