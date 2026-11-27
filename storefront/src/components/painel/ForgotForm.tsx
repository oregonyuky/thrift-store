"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset, type ActionResult } from "@/app/painel/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary !min-h-12 w-full">
      {pending ? "Enviando..." : "Enviar senha temporária"}
    </button>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState<ActionResult, FormData>(requestPasswordReset, {});
  if (state.ok) {
    return <p role="status" className="rounded-[10px] bg-ok-bg px-3.5 py-3 text-sm text-ok-fg">{state.message}</p>;
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <p role="alert" className="rounded-[10px] bg-bad-bg px-3.5 py-3 text-sm text-bad-fg">{state.error}</p>}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[13px] font-bold">E-mail da sua conta</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field !h-12" />
      </div>
      <Submit />
    </form>
  );
}
