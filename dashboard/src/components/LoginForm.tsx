"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type ActionResult } from "@/app/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary !min-h-12 w-full">
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState<ActionResult, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <p role="alert" className="rounded-[10px] bg-bad-bg px-3.5 py-3 text-sm text-bad-fg">{state.error}</p>}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[13px] font-bold">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field !h-12" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[13px] font-bold">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field !h-12" />
      </div>
      <Submit />
    </form>
  );
}
