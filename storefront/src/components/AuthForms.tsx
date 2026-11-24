"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, sendContact, type FormState } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

function Input({ label, name, error, ...rest }: { label: string; name: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-bold">{label}</label>
      <input id={id} name={name} className="field" aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...rest} />
      {error && <span id={`${id}-err`} className="text-[13px] text-bad-fg">{error}</span>}
    </div>
  );
}

function Alert({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-bad-bg px-4 py-3 text-sm text-bad-fg">{state.error}</p>;
  if (state.success) return <p role="status" className="rounded-xl bg-ok-bg px-4 py-3 text-sm text-ok-fg">{state.success}</p>;
  return null;
}

export function LoginForm({ returnUrl, notice }: { returnUrl: string; notice?: string }) {
  const [state, action] = useActionState(login, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {notice && <p role="status" className="rounded-xl bg-ok-bg px-4 py-3 text-sm text-ok-fg">{notice}</p>}
      <Alert state={state} />
      <input type="hidden" name="returnUrl" value={returnUrl} />
      <Input label="E-mail" name="email" type="email" autoComplete="email" required />
      <Input label="Senha" name="password" type="password" autoComplete="current-password" required />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 accent-[#a9493a]" /> Manter conectada
      </label>
      <SubmitButton pending="Entrando...">Entrar</SubmitButton>
      <p className="text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href={`/cadastro?returnUrl=${encodeURIComponent(returnUrl)}`} className="font-bold text-ink underline underline-offset-4">Criar conta</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ returnUrl }: { returnUrl: string }) {
  const [state, action] = useActionState(register, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Alert state={state} />
      <input type="hidden" name="returnUrl" value={returnUrl} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome" name="firstName" autoComplete="given-name" error={fe.firstName} required />
        <Input label="Sobrenome" name="lastName" autoComplete="family-name" error={fe.lastName} required />
      </div>
      <Input label="E-mail" name="email" type="email" autoComplete="email" error={fe.email} required />
      <Input label="Instagram (opcional)" name="instagram" placeholder="@seuperfil" error={fe.instagram} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Senha" name="password" type="password" autoComplete="new-password" minLength={6} error={fe.password} required />
        <Input label="Confirmar senha" name="confirmPassword" type="password" autoComplete="new-password" error={fe.confirmPassword} required />
      </div>
      <SubmitButton pending="Criando conta...">Criar conta</SubmitButton>
      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href={`/entrar?returnUrl=${encodeURIComponent(returnUrl)}`} className="font-bold text-ink underline underline-offset-4">Entrar</Link>
      </p>
    </form>
  );
}

export function ContactForm() {
  const [state, action] = useActionState(sendContact, {});
  const fe = state.fieldErrors ?? {};
  if (state.success) return <Alert state={state} />;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Alert state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome" name="name" autoComplete="name" error={fe.name} required />
        <Input label="E-mail" name="email" type="email" autoComplete="email" error={fe.email} required />
        <Input label="Telefone" name="phone" type="tel" autoComplete="tel" error={fe.phone} required />
        <Input label="Assunto" name="subject" placeholder="Ex.: troca do pedido" error={fe.subject} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-message" className="text-[13px] font-bold">Mensagem</label>
        <textarea id="f-message" name="message" rows={6} className="field !h-auto py-3" aria-invalid={!!fe.message} required />
        {fe.message && <span className="text-[13px] text-bad-fg">{fe.message}</span>}
      </div>
      <SubmitButton pending="Enviando...">Enviar mensagem</SubmitButton>
    </form>
  );
}
