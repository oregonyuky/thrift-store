import type { Metadata } from "next";
import Link from "next/link";
import { deleteMessage, markMessageRead } from "@/app/painel/manage-actions";
import { LoadError, PageHeader, SidePanel } from "@/components/painel/Fields";
import { ActionButton } from "@/components/painel/FormShell";
import { WhatsAppButton } from "@/components/painel/WhatsAppButton";
import { dateTime, relative } from "@/lib/painel/format";
import { getMessages } from "@/lib/painel/manage";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Mensagens" };
export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ id?: string; filtro?: string }> }) {
  const session = await requireSession();
  const { id, filtro } = await searchParams;
  const messages = await getMessages(session).catch(() => null);
  const unreadOnly = filtro === "novas";
  const rows = (messages ?? []).filter((m) => !unreadOnly || !m.isRead);
  const selected = id ? (messages ?? []).find((m) => m.id === id) : undefined;
  const unread = (messages ?? []).filter((m) => !m.isRead).length;
  const href = (extra: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ filtro: unreadOnly ? "novas" : undefined, ...extra })) if (v) sp.set(k, v);
    return `/painel/mensagens${sp.size ? `?${sp}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Mensagens" subtitle={messages ? `${unread} ${unread === 1 ? "nova" : "novas"} · recebidas pelo Fale conosco` : undefined} />
      <nav aria-label="Filtro" className="flex gap-1.5 border-b border-line">
        {[
          [false, "Todas", messages?.length ?? 0],
          [true, "Não lidas", unread],
        ].map(([onlyNew, text, count]) => {
          const active = onlyNew === unreadOnly;
          return (
            <Link
              key={String(text)}
              href={onlyNew ? "/painel/mensagens?filtro=novas" : "/painel/mensagens"}
              aria-current={active ? "page" : undefined}
              className={`-mb-px flex h-11 items-center gap-2 border-b-2 px-3.5 text-sm ${active ? "border-terra font-bold" : "border-transparent font-medium text-muted hover:text-ink"}`}
            >
              {text}
              <span className={`rounded-full px-2 py-px text-xs ${active ? "bg-terra text-card" : "bg-sand text-muted"}`}>{count as number}</span>
            </Link>
          );
        })}
      </nav>
      <LoadError show={!messages} what="as mensagens" />

      <div className="flex flex-wrap items-start gap-5">
        <section className="panel min-w-0 flex-[999_1_480px] overflow-hidden">
          <ul>
            {rows.map((m) => (
              <li key={m.id} className={`border-t border-sand first:border-t-0 ${m.id === selected?.id ? "bg-[#fbf3ec]" : "hover:bg-[#faf6f0]"}`}>
                <Link href={href({ id: m.id })} className="flex items-start gap-3 px-5 py-3.5">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${m.isRead ? "bg-transparent" : "bg-terra"}`} aria-label={m.isRead ? "Lida" : "Não lida"} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex justify-between gap-3 text-sm">
                      <span className={m.isRead ? "" : "font-bold"}>{m.name ?? m.email}</span>
                      <span className="shrink-0 text-xs text-muted">{relative(m.receivedAt)}</span>
                    </span>
                    <span className={`truncate text-sm ${m.isRead ? "text-muted" : "font-medium"}`}>{m.subject}</span>
                    <span className="truncate text-[13px] text-muted">{m.message}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {messages && rows.length === 0 && <p className="p-10 text-center text-sm text-muted">Nenhuma mensagem por aqui.</p>}
        </section>

        {selected && (
          <SidePanel title={selected.subject ?? "Mensagem"} closeHref={href({})}>
            <div className="flex flex-col gap-1 text-sm">
              <strong>{selected.name}</strong>
              <span className="text-muted">{[selected.email, selected.phone].filter(Boolean).join(" · ")}</span>
              <span className="text-xs text-muted">Recebida em {dateTime(selected.receivedAt)}</span>
            </div>
            <p className="whitespace-pre-line rounded-xl bg-[#f4efe8] p-4 text-[15px] leading-relaxed">{selected.message}</p>
            <div className="flex flex-wrap gap-2.5">
              {selected.email && (
                <a className="btn-primary" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject ?? "Thrift Brechó"}`)}`}>
                  Responder por e-mail
                </a>
              )}
              <WhatsAppButton phone={selected.phone} label="Responder no WhatsApp" text={`Oi, ${selected.name ?? ""}! Aqui é da Thrift Brechó, sobre a sua mensagem${selected.subject ? ` "${selected.subject}"` : ""}.`} />
              {!selected.isRead && <ActionButton action={markMessageRead.bind(null, selected.id)} label="Marcar como lida" pendingLabel="Marcando..." />}
            </div>
            <div className="border-t border-sand pt-3">
              <ActionButton
                action={deleteMessage.bind(null, selected.id)}
                label="Excluir mensagem"
                pendingLabel="Excluindo..."
                confirm={`Excluir a mensagem de ${selected.name ?? "contato"}? Ela sai da lista.`}
                className="text-sm font-medium text-bad-fg hover:underline"
              />
            </div>
          </SidePanel>
        )}
      </div>
    </div>
  );
}
