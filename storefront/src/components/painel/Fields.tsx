import Link from "next/link";
import { CloseIcon } from "./icons";

const label = "text-[13px] font-bold";

export function Field({ label: text, name, className = "", ...rest }: { label: string; name: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={label}>{text}</label>
      <input id={id} name={name} className="field" {...rest} />
    </div>
  );
}

export function TextArea({ label: text, name, className = "", ...rest }: { label: string; name: string; className?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = `f-${name}`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={label}>{text}</label>
      <textarea id={id} name={name} rows={3} className="field !h-auto resize-y py-2.5" {...rest} />
    </div>
  );
}

export function Select({ label: text, name, options, className = "", ...rest }: { label: string; name: string; options: Array<[string, string]>; className?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = `f-${name}`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={label}>{text}</label>
      <select id={id} name={name} className="field" {...rest}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </div>
  );
}

export function Check({ label: text, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#4f6b55]" />
      {text}
    </label>
  );
}

/** Side panel used by every list screen for create / edit. */
export function SidePanel({ title, closeHref, children }: { title: string; closeHref: string; children: React.ReactNode }) {
  return (
    <aside data-detail aria-label={title} className="panel scroll-mt-4 flex flex-[1_1_340px] flex-col gap-4 p-[22px]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href={closeHref} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sand">
          <CloseIcon size={16} />
        </Link>
      </div>
      {children}
    </aside>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[34px] font-normal tracking-tight">{title}</h1>
        {subtitle && <span className="text-sm text-muted">{subtitle}</span>}
      </div>
      {action}
    </div>
  );
}

export function LoadError({ show, what }: { show: boolean; what: string }) {
  if (!show) return null;
  return <p role="alert" className="rounded-xl bg-bad-bg px-4 py-3 text-sm text-bad-fg">Não foi possível carregar {what} da API. Se o problema continuar, verifique se seu usuário tem acesso a esta área.</p>;
}

export const th = "px-2 py-3.5 font-medium";
export const td = "px-2 py-3";
export const rowCls = (selected: boolean) => `border-t border-sand ${selected ? "bg-[#fbf3ec]" : "hover:bg-[#faf6f0]"}`;
