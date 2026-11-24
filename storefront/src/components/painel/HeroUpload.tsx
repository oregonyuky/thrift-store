"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveHeroImage, type FormResult } from "@/app/painel/manage-actions";
import { ImageIcon } from "./icons";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="btn-primary !min-h-11 self-start">
      {pending ? "Enviando..." : "Usar esta imagem"}
    </button>
  );
}

export function HeroUpload({ current }: { current: string | null }) {
  const [state, action] = useActionState<FormResult, FormData>(saveHeroImage, {});
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview ?? current;
  return (
    <form action={action} className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative aspect-[4/5] max-h-[520px] overflow-hidden rounded-t-[200px] rounded-b-2xl bg-[#e6d3c6]">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Imagem de destaque da página inicial" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">Sem imagem definida</div>
        )}
        {preview && <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-card">Prévia — ainda não salva</span>}
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-muted">
          É a foto grande em arco no topo da página inicial da loja. Prefira uma foto vertical (proporção 4:5), com a peça centralizada.
        </p>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed border-[#d9b8ac] bg-[#fbf6f1] p-6 text-center">
          <ImageIcon size={26} className="text-terra" />
          <span className="text-sm font-bold">Escolher nova imagem</span>
          <span className="text-xs text-muted">JPEG, PNG ou WebP até 5 MB</span>
          <input
            type="file"
            name="hero"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
        </label>
        <div aria-live="polite">
          {state.error && <p role="alert" className="rounded-[10px] bg-bad-bg px-3.5 py-2.5 text-sm text-bad-fg">{state.error}</p>}
          {state.message && <p className="rounded-[10px] bg-ok-bg px-3.5 py-2.5 text-sm text-ok-fg">{state.message}</p>}
        </div>
        <Submit disabled={!preview} />
      </div>
    </form>
  );
}
