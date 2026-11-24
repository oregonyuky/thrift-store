"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveProduct, type ActionResult } from "@/app/painel/actions";
import { CloseIcon, ImageIcon } from "./icons";

export interface ProductFormValues {
  id?: string;
  name?: string;
  categoryId?: string;
  dropConfigId?: string;
  unitPrice?: number;
  oldPrice?: number;
  unitWeight?: number;
  size?: string;
  bust?: number;
  sleeve?: number;
  length?: number;
  shortDescription?: string;
  longDescription?: string;
  altText?: string;
  available?: boolean;
  photos: Array<{ name: string; url: string | null }>;
}

const MAX_PHOTOS = 5;

function Buttons({ isNew, available }: { isNew: boolean; available?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex gap-2.5">
      <button type="submit" name="publish" value="0" disabled={pending} className="btn-ghost flex-1 !min-h-11">
        {pending ? "Salvando..." : isNew ? "Salvar rascunho" : "Salvar"}
      </button>
      {(isNew || !available) && (
        <button type="submit" name="publish" value="1" disabled={pending} className="btn-primary flex-1 !min-h-11">
          {pending ? "Publicando..." : "Publicar na loja"}
        </button>
      )}
    </div>
  );
}

const money = (v?: number | null) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(2).replace(".", ",") : "");

export function ProductForm({ values, categories, drops, closeHref }: { values: ProductFormValues; categories: Array<{ id: string; name: string }>; drops: Array<{ id: string; name: string }>; closeHref: string }) {
  const [state, action] = useActionState<ActionResult, FormData>(saveProduct, {});
  const [kept, setKept] = useState(values.photos);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isNew = !values.id;

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    // Keep the real file input in sync so the files are submitted with the form.
    if (inputRef.current) {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      inputRef.current.files = dt.files;
    }
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const room = MAX_PHOTOS - kept.length;
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const images = Array.from(list).filter((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type));
    setFiles((current) => [...current, ...images].slice(0, Math.max(room, 0)));
  };

  const label = "text-[13px] font-bold";
  return (
    <aside aria-label={isNew ? "Nova peça" : "Editar peça"} className="panel flex flex-[1_1_360px] flex-col gap-4 p-[22px]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{isNew ? "Nova peça" : "Editar peça"}</h2>
        <Link href={closeHref} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sand">
          <CloseIcon size={16} />
        </Link>
      </div>

      <form action={action} className="flex flex-col gap-4">
        {values.id && <input type="hidden" name="id" value={values.id} />}
        {kept.map((p) => (
          <input key={p.name} type="hidden" name="keepPhoto" value={p.name} />
        ))}

        <div className="flex flex-col gap-2.5">
          {(kept.length > 0 || previews.length > 0) && (
            <ul className="grid grid-cols-5 gap-2" aria-label="Fotos da peça">
              {kept.map((p, i) => (
                <li key={p.name} className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sand">
                  {p.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                  )}
                  {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-ink/80 px-1 text-[10px] font-bold text-card">capa</span>}
                  <button type="button" aria-label={`Remover foto ${i + 1}`} onClick={() => setKept((k) => k.filter((x) => x.name !== p.name))} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-card/90 text-ink">
                    <CloseIcon size={12} />
                  </button>
                </li>
              ))}
              {previews.map((url, i) => (
                <li key={url} className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  {kept.length === 0 && i === 0 && <span className="absolute bottom-1 left-1 rounded bg-ink/80 px-1 text-[10px] font-bold text-card">capa</span>}
                  <button type="button" aria-label={`Remover foto nova ${i + 1}`} onClick={() => setFiles((f) => f.filter((_, j) => j !== i))} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-card/90 text-ink">
                    <CloseIcon size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {kept.length + files.length < MAX_PHOTOS && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed p-5 text-center ${dragging ? "border-terra bg-[#f6ebe5]" : "border-[#d9b8ac] bg-[#fbf6f1]"}`}
            >
              <ImageIcon size={26} className="text-terra" />
              <span className="text-sm font-bold">Arraste as fotos aqui</span>
              <span className="text-xs text-muted">A primeira vira a capa · até {MAX_PHOTOS} fotos · JPEG, PNG ou WebP até 5 MB</span>
              <label className="mt-1 cursor-pointer rounded-lg border border-line bg-card px-3.5 py-2 text-[13px] font-medium hover:bg-sand">
                Escolher do computador
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
              </label>
            </div>
          )}
          <input ref={inputRef} type="file" name="photos" multiple className="hidden" tabIndex={-1} aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="p-name" className={label}>Nome</label>
          <input id="p-name" name="name" defaultValue={values.name} required placeholder="Ex.: Vestido midi floral" className="field" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="p-cat" className={label}>Categoria</label>
            <select id="p-cat" name="categoryId" defaultValue={values.categoryId ?? ""} className="field">
              <option value="">Sem categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="p-size" className={label}>Tamanho</label>
            <input id="p-size" name="size" defaultValue={values.size} placeholder="M" className="field" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="p-price" className={label}>Preço (R$)</label>
            <input id="p-price" name="unitPrice" inputMode="decimal" defaultValue={money(values.unitPrice)} required placeholder="0,00" className="field" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="p-old" className={label}>Preço antigo (R$)</label>
            <input id="p-old" name="oldPrice" inputMode="decimal" defaultValue={money(values.oldPrice)} placeholder="opcional" className="field" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="p-weight" className={label}>Peso (kg)</label>
            <input id="p-weight" name="unitWeight" inputMode="decimal" defaultValue={values.unitWeight?.toString().replace(".", ",")} placeholder="0,35" className="field" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="p-drop" className={label}>Drop</label>
            <select id="p-drop" name="dropConfigId" defaultValue={values.dropConfigId ?? ""} className="field">
              <option value="">Nenhum</option>
              {drops.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <fieldset className="grid grid-cols-3 gap-3">
          <legend className={`${label} mb-1.5`}>Medidas (cm, opcional)</legend>
          <input aria-label="Busto (cm)" name="bust" inputMode="decimal" defaultValue={values.bust} placeholder="Busto" className="field" />
          <input aria-label="Cintura ou manga (cm)" name="sleeve" inputMode="decimal" defaultValue={values.sleeve} placeholder="Manga" className="field" />
          <input aria-label="Comprimento (cm)" name="length" inputMode="decimal" defaultValue={values.length} placeholder="Compr." className="field" />
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="p-short" className={label}>Descrição curta</label>
          <input id="p-short" name="shortDescription" defaultValue={values.shortDescription} placeholder="Aparece no card da vitrine" className="field" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="p-long" className={label}>Descrição</label>
          <textarea id="p-long" name="longDescription" rows={3} defaultValue={values.longDescription} placeholder="Tecido, caimento e detalhes" className="field !h-auto resize-y py-2.5" />
        </div>
        <input type="hidden" name="altText" value={values.altText ?? ""} />

        {state.error && <p role="alert" className="rounded-[10px] bg-bad-bg px-3.5 py-3 text-sm text-bad-fg">{state.error}</p>}
        <Buttons isNew={isNew} available={values.available} />
      </form>
    </aside>
  );
}
