import type { Metadata } from "next";
import { saveMyPassword, saveMyProfile } from "@/app/painel/manage-actions";
import { Field, LoadError, PageHeader } from "@/components/painel/Fields";
import { FormShell } from "@/components/painel/FormShell";
import { getMyProfile } from "@/lib/painel/manage";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Meu perfil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireSession();
  const profile = await getMyProfile(session).catch(() => undefined);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Meu perfil" subtitle={`Você entrou como ${session.email ?? session.name}.`} />
      <LoadError show={profile === undefined} what="o seu perfil" />
      <div className="grid max-w-[1000px] items-start gap-5 lg:grid-cols-2">
        <section className="panel p-[22px]">
          <h2 className="mb-3.5 text-base font-bold">Dados</h2>
          <FormShell action={saveMyProfile} key={profile?.id ?? "perfil"}>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Nome" name="firstName" defaultValue={profile?.firstName} required autoComplete="given-name" />
              <Field label="Sobrenome" name="lastName" defaultValue={profile?.lastName} required autoComplete="family-name" />
            </div>
          </FormShell>
        </section>

        <section className="panel p-[22px]">
          <h2 className="mb-3.5 text-base font-bold">Trocar senha</h2>
          <FormShell action={saveMyPassword} submit="Trocar senha" pending="Trocando..." resetOnSuccess>
            <Field label="Senha atual" name="oldPassword" type="password" required autoComplete="current-password" />
            <Field label="Nova senha" name="newPassword" type="password" required minLength={6} autoComplete="new-password" />
            <Field label="Confirme a nova senha" name="confirmNewPassword" type="password" required minLength={6} autoComplete="new-password" />
            <p className="-mt-1.5 text-xs text-muted">Pelo menos 6 caracteres.</p>
          </FormShell>
        </section>
      </div>
    </div>
  );
}
