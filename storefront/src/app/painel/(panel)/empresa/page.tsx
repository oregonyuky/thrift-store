import type { Metadata } from "next";
import { saveCompany } from "@/app/painel/manage-actions";
import { Field, LoadError, PageHeader, TextArea } from "@/components/painel/Fields";
import { FormShell } from "@/components/painel/FormShell";
import { getCompany } from "@/lib/painel/manage";
import { requireSession } from "@/lib/painel/session";

export const metadata: Metadata = { title: "Minha empresa" };
export const dynamic = "force-dynamic";

export default async function CompanyPage() {
  const session = await requireSession();
  const company = await getCompany(session).catch(() => undefined);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Minha empresa" subtitle="Dados da loja. O nome, o endereço, o CEP e o telefone saem como remetente nas etiquetas do Melhor Envio." />
      <LoadError show={company === undefined} what="os dados da empresa" />
      {company === null && <p className="panel p-6 text-sm text-muted">Nenhum cadastro de empresa encontrado na API.</p>}
      {company && (
        <section className="panel max-w-[760px] p-[22px]">
          <FormShell action={saveCompany}>
            <input type="hidden" name="id" value={company.id} />
            <input type="hidden" name="currency" value={company.currency ?? "BRL"} />
            <input type="hidden" name="faxNumber" value={company.faxNumber ?? ""} />
            <h2 className="text-base font-bold">Loja</h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Nome da loja" name="name" defaultValue={company.name} required />
              <Field label="E-mail" name="emailAddress" type="email" defaultValue={company.emailAddress} required />
              <Field label="Telefone" name="phoneNumber" type="tel" defaultValue={company.phoneNumber} required placeholder="(19) 99999-0000" />
              <Field label="Site (opcional)" name="website" defaultValue={company.website} placeholder="https://" />
            </div>
            <TextArea label="Descrição (opcional)" name="description" defaultValue={company.description} />

            <h2 className="mt-3 border-t border-sand pt-4 text-base font-bold">Endereço de remetente</h2>
            <Field label="Endereço" name="street" defaultValue={company.street} required placeholder="Rua, número e bairro" />
            <div className="grid gap-3.5 sm:grid-cols-[1fr_110px_150px]">
              <Field label="Cidade" name="city" defaultValue={company.city} required />
              <Field label="Estado" name="state" defaultValue={company.state} required maxLength={2} placeholder="SP" />
              <Field label="CEP" name="zipCode" defaultValue={company.zipCode} required inputMode="numeric" placeholder="13010-000" />
            </div>
            <Field label="País" name="country" defaultValue={company.country ?? "Brasil"} />
          </FormShell>
        </section>
      )}
    </div>
  );
}
