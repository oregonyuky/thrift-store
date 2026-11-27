import type { Metadata } from "next";
import Link from "next/link";
import { createUser, deleteUser, resetUserPassword, setUserRole, updateUser } from "@/app/painel/manage-actions";
import { Check, Field, LoadError, PageHeader, rowCls, SidePanel, td, th } from "@/components/painel/Fields";
import { ActionButton, FormShell, ToggleAction } from "@/components/painel/FormShell";
import { PlusIcon } from "@/components/painel/icons";
import { shortDate } from "@/lib/painel/format";
import { getRoles, getUserRoles, getUsers } from "@/lib/painel/manage";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Usuários e acesso" };
export const dynamic = "force-dynamic";

/** Friendly names for the access roles the API seeds (one per area of the panel). */
const roleNames: Record<string, string> = {
  Orders: "Pedidos",
  Bags: "Sacolinhas",
  Customers: "Clientes",
  Messages: "Mensagens",
  Products: "Produtos",
  Categories: "Categorias",
  DropConfigs: "Drops",
  ShippingBoxes: "Caixas de envio",
  PackageCategories: "Categorias de embalagem",
  Site: "Site e banner",
  Users: "Usuários",
  Roles: "Perfis de acesso",
  Companies: "Minha empresa",
  PaymentTypes: "Formas de pagamento",
  Profiles: "Meu perfil",
  Dashboards: "Visão geral",
};

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ id?: string; novo?: string }> }) {
  const session = await requireSession();
  const { id, novo } = await searchParams;
  const [users, roles] = await Promise.all([getUsers(session).catch(() => null), getRoles(session).catch(() => [])]);
  const selected = id ? (users ?? []).find((u) => u.id === id) : undefined;
  const granted = selected ? await getUserRoles(session, selected.id).catch(() => [] as string[]) : [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Usuários e acesso" subtitle="Quem da equipe entra no painel e o que cada pessoa pode ver." action={<Link href="/painel/usuarios?novo=1" className="btn-primary"><PlusIcon size={16} /> Novo usuário</Link>} />
      <LoadError show={!users} what="os usuários" />
      <div className="flex flex-wrap items-start gap-5">
        <section className="panel min-w-0 flex-[999_1_480px] overflow-x-auto">
          <table className="rtable w-full md:min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted">
                <th className="px-5 py-3.5 font-medium">Pessoa</th>
                <th className={th}>Situação</th>
                <th className="px-5 py-3.5 font-medium">Desde</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => (
                <tr key={u.id} className={rowCls(u.id === selected?.id)}>
                  <td className="px-5 py-3">
                    <Link href={`/painel/usuarios?id=${u.id}`} className="font-medium hover:text-terra">
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                      {u.id === session.userId && <span className="ml-2 text-xs font-normal text-muted">(você)</span>}
                    </Link>
                    <span className="block text-xs text-muted">{u.email}</span>
                  </td>
                  <td className={td}>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.isBlocked ? "bg-bad-bg text-bad-fg" : "bg-ok-bg text-ok-fg"}`}>{u.isBlocked ? "Bloqueado" : "Ativo"}</span>
                  </td>
                  <td className="num px-5 py-3 text-muted">{shortDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {novo && !selected && (
          <SidePanel title="Novo usuário" closeHref="/painel/usuarios">
            <FormShell action={createUser} submit="Criar usuário" pending="Criando..." resetOnSuccess>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome" name="firstName" required />
                <Field label="Sobrenome" name="lastName" />
              </div>
              <Field label="E-mail" name="email" type="email" required autoComplete="off" />
              <Field label="Senha inicial" name="password" type="password" minLength={6} required autoComplete="new-password" />
              <p className="-mt-1.5 text-xs text-muted">Depois de criar, abra o usuário na lista para escolher as áreas que ele acessa.</p>
            </FormShell>
          </SidePanel>
        )}

        {selected && (
          <SidePanel title={[selected.firstName, selected.lastName].filter(Boolean).join(" ") || selected.email || "Usuário"} closeHref="/painel/usuarios">
            <FormShell action={updateUser} key={`u-${selected.id}`}>
              <input type="hidden" name="userId" value={selected.id} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome" name="firstName" defaultValue={selected.firstName} />
                <Field label="Sobrenome" name="lastName" defaultValue={selected.lastName} />
              </div>
              <Check label="Bloquear acesso ao painel" name="isBlocked" defaultChecked={selected.isBlocked} />
            </FormShell>

            {roles.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-sand pt-4">
                <span className="text-[13px] font-bold">Áreas que pode acessar</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {roles.map((role) => (
                    <ToggleAction key={`${selected.id}-${role}`} label={roleNames[role] ?? role} checked={granted.includes(role)} action={setUserRole.bind(null, selected.id, role)} />
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-sand pt-4">
              <FormShell action={resetUserPassword} submit="Trocar senha" pending="Trocando..." key={`p-${selected.id}`} resetOnSuccess>
                <input type="hidden" name="userId" value={selected.id} />
                <Field label="Nova senha" name="newPassword" type="password" minLength={6} autoComplete="new-password" />
              </FormShell>
            </div>

            {selected.id !== session.userId && (
              <div className="border-t border-sand pt-3">
                <ActionButton action={deleteUser.bind(null, selected.id)} label="Excluir usuário" pendingLabel="Excluindo..." confirm={`Excluir o acesso de ${selected.email}?`} className="text-sm font-medium text-bad-fg hover:underline" />
              </div>
            )}
          </SidePanel>
        )}
      </div>
    </div>
  );
}
