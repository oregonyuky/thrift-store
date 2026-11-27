"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import type { FormResult } from "@/app/painel/manage-actions";

type FormAction = (state: FormResult, form: FormData) => Promise<FormResult>;

function Submit({ label, pending }: { label: string; pending: string }) {
  const status = useFormStatus();
  return (
    <button type="submit" disabled={status.pending} className="btn-primary !min-h-11">
      {status.pending ? pending : label}
    </button>
  );
}

/** A form bound to a server action, with the result shown under it. Fields come in as children. */
export function FormShell({
  action,
  children,
  submit = "Salvar",
  pending = "Salvando...",
  resetOnSuccess = false,
  extra,
  className = "flex flex-col gap-3.5",
}: {
  action: FormAction;
  children: React.ReactNode;
  submit?: string;
  pending?: string;
  resetOnSuccess?: boolean;
  extra?: (result: FormResult) => React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState<FormResult, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <div aria-live="polite">
        {state.error && <p role="alert" className="rounded-[10px] bg-bad-bg px-3.5 py-2.5 text-sm text-bad-fg">{state.error}</p>}
        {state.message && <p role="status" className="rounded-[10px] bg-ok-bg px-3.5 py-2.5 text-sm text-ok-fg">{state.message}</p>}
      </div>
      {extra?.(state)}
      <div className="flex gap-2.5">
        <Submit label={submit} pending={pending} />
      </div>
    </form>
  );
}

/** A single-click server action (delete, mark as read...), optionally confirmed first. */
export function ActionButton({
  action,
  label,
  pendingLabel,
  confirm,
  className = "btn-ghost",
}: {
  action: () => Promise<FormResult>;
  label: string;
  pendingLabel?: string;
  confirm?: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<FormResult | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        className={className}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => setResult(await action()));
        }}
      >
        {pending ? pendingLabel ?? "Aguarde..." : label}
      </button>
      {result?.error && <span role="alert" className="text-xs text-bad-fg">{result.error}</span>}
    </span>
  );
}

/** Checkbox that calls a server action as soon as it changes (user roles). */
export function ToggleAction({ label, checked, action }: { label: string; checked: boolean; action: (value: boolean) => Promise<FormResult> }) {
  const [value, setValue] = useState(checked);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <label className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 py-2 text-sm ${value ? "border-sage bg-ok-bg" : "border-line bg-card"} ${pending ? "opacity-60" : ""}`}>
      <input
        type="checkbox"
        checked={value}
        disabled={pending}
        className="h-4 w-4 accent-[#4f6b55]"
        onChange={(e) => {
          const next = e.target.checked;
          setValue(next);
          setError(null);
          start(async () => {
            const result = await action(next);
            if (result.error) {
              setValue(!next);
              setError(result.error);
            }
          });
        }}
      />
      <span className="flex-1">{label}</span>
      {error && <span role="alert" className="text-xs text-bad-fg">{error}</span>}
    </label>
  );
}
