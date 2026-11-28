"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiRequest, apiUpload } from "@/lib/api";
import { getCustomers, getMyProfile } from "@/lib/painel/manage";
import { requireSession } from "@/lib/painel/session";

export interface FormResult {
  ok?: boolean;
  error?: string;
  message?: string;
  /** Extra data for the screen (Melhor Envio recharge returns a Pix). */
  data?: Record<string, string | undefined>;
}

const t = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const opt = (form: FormData, key: string) => t(form, key) || undefined;
const dec = (form: FormData, key: string) => {
  // "1.234,56" and "1234.56" both work.
  let raw = t(form, key);
  if (raw.includes(",")) raw = raw.replace(/\./g, "").replace(",", ".");
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};
const int = (form: FormData, key: string, fallback = 0) => {
  const n = Number.parseInt(t(form, key), 10);
  return Number.isFinite(n) ? n : fallback;
};
const on = (form: FormData, key: string) => form.get(key) === "on" || form.get(key) === "true";

function failed(error: unknown, fallback: string): FormResult {
  if (error instanceof ApiError) {
    if (error.status === 403) return { error: "Seu usuário não tem permissão para isso." };
    if (error.message) return { error: error.message };
  }
  console.error("[painel]", fallback, error);
  return { error: fallback };
}

async function call(path: string, init: { method?: "POST" | "PUT" | "DELETE"; body?: unknown }, revalidate: string, fallback: string, message: string): Promise<FormResult> {
  const session = await requireSession();
  try {
    await apiRequest(path, { method: init.method ?? "POST", body: init.body, token: session.token });
  } catch (error) {
    return failed(error, fallback);
  }
  revalidatePath(revalidate);
  return { ok: true, message };
}

/* ---------- Customers ---------- */

export async function saveCustomer(_: FormResult, form: FormData): Promise<FormResult> {
  const session = await requireSession();
  const id = t(form, "id");
  const name = t(form, "name");
  if (!name) return { error: "Informe o nome." };
  const existing = (await getCustomers(session).catch(() => [])).find((c) => c.id === id);
  if (!existing) return { error: "Cliente não encontrada." };
  return call(
    "api/Customer/UpdateCustomer",
    {
      body: {
        ...existing,
        id,
        name,
        emailAddress: opt(form, "emailAddress"),
        phoneNumber: opt(form, "phoneNumber"),
        cpf: opt(form, "cpf")?.replace(/\D/g, ""),
        instagram: opt(form, "instagram"),
        street: opt(form, "street"),
        number: opt(form, "number"),
        complement: opt(form, "complement"),
        neighborhood: opt(form, "neighborhood"),
        city: opt(form, "city"),
        state: opt(form, "state")?.toUpperCase(),
        postalCode: opt(form, "postalCode")?.replace(/\D/g, ""),
        description: opt(form, "description"),
        customerStatus: opt(form, "customerStatus") ?? existing.customerStatus ?? "Active",
      },
    },
    "/painel/clientes",
    "Não foi possível salvar a cliente.",
    "Cliente salva.",
  );
}

export async function deleteCustomer(id: string): Promise<FormResult> {
  return call("api/Customer/DeleteCustomer", { body: { id } }, "/painel/clientes", "Não foi possível excluir a cliente.", "Cliente excluída.");
}

/* ---------- Messages ---------- */

export async function markMessageRead(id: string): Promise<FormResult> {
  const result = await call(`api/contact-messages/${encodeURIComponent(id)}/read`, { method: "PUT" }, "/painel/mensagens", "Não foi possível marcar como lida.", "Marcada como lida.");
  revalidatePath("/painel", "layout");
  return result;
}

/* ---------- Categories ---------- */

export async function saveCategory(_: FormResult, form: FormData): Promise<FormResult> {
  const id = opt(form, "id");
  const name = t(form, "name");
  if (!name) return { error: "Informe o nome da categoria." };
  const body = {
    id,
    name,
    description: opt(form, "description"),
    isActive: on(form, "isActive"),
    packageOccupationPoints: int(form, "packageOccupationPoints"),
  };
  return call(id ? "api/Category/UpdateCategory" : "api/Category/CreateCategory", { body }, "/painel/categorias", "Não foi possível salvar a categoria.", id ? "Categoria salva." : "Categoria criada.");
}

export async function deleteCategory(id: string): Promise<FormResult> {
  return call("api/Category/DeleteCategory", { body: { id } }, "/painel/categorias", "Não foi possível excluir a categoria.", "Categoria excluída.");
}

/* ---------- Drops ---------- */

export async function saveDrop(_: FormResult, form: FormData): Promise<FormResult> {
  const id = opt(form, "id");
  const titulo = t(form, "titulo");
  const data = t(form, "dataLiberacao");
  if (!titulo) return { error: "Informe o título do drop." };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(data)) return { error: "Informe a data e a hora de liberação." };
  const body = { titulo, subtitulo: opt(form, "subtitulo"), dataLiberacaoBrasilia: `${data}:00`, ativo: on(form, "ativo") };
  return id
    ? call(`api/drop-config/${encodeURIComponent(id)}`, { method: "PUT", body: { id, ...body } }, "/painel/drops", "Não foi possível salvar o drop.", "Drop salvo.")
    : call("api/drop-config", { body }, "/painel/drops", "Não foi possível criar o drop.", "Drop criado.");
}

export async function deleteDrop(id: string): Promise<FormResult> {
  return call(`api/drop-config/${encodeURIComponent(id)}`, { method: "DELETE" }, "/painel/drops", "Não foi possível excluir o drop.", "Drop excluído.");
}

/* ---------- Shipping boxes ---------- */

export async function saveShippingBox(_: FormResult, form: FormData): Promise<FormResult> {
  const id = opt(form, "id");
  const name = t(form, "name");
  if (!name) return { error: "Informe o nome da caixa." };
  if (!opt(form, "packageCategoryId")) return { error: "Escolha a categoria de embalagem." };
  const body = {
    id,
    name,
    width: dec(form, "width"),
    length: dec(form, "length"),
    height: dec(form, "height"),
    weight: dec(form, "weight"),
    maxWeight: dec(form, "maxWeight"),
    insuranceValue: dec(form, "insuranceValue"),
    isActive: on(form, "isActive"),
    packageCategoryId: opt(form, "packageCategoryId"),
    stockQuantity: int(form, "stockQuantity"),
  };
  return call(id ? "api/ShippingBox/UpdateShippingBox" : "api/ShippingBox/CreateShippingBox", { body }, "/painel/envio", "Não foi possível salvar a caixa.", id ? "Caixa salva." : "Caixa criada.");
}

export async function deleteShippingBox(id: string): Promise<FormResult> {
  return call("api/ShippingBox/DeleteShippingBox", { body: { id } }, "/painel/envio", "Não foi possível excluir a caixa.", "Caixa excluída.");
}

export async function savePackageCategory(_: FormResult, form: FormData): Promise<FormResult> {
  const id = opt(form, "id");
  const name = t(form, "name");
  if (!name) return { error: "Informe o nome da categoria de embalagem." };
  const body = { id, name, capacityPoints: int(form, "capacityPoints"), description: opt(form, "description"), isActive: on(form, "isActive") };
  return call(
    id ? "api/PackageCategory/UpdatePackageCategory" : "api/PackageCategory/CreatePackageCategory",
    { body },
    "/painel/envio",
    "Não foi possível salvar a categoria de embalagem.",
    id ? "Categoria de embalagem salva." : "Categoria de embalagem criada.",
  );
}

export async function deactivatePackageCategory(id: string): Promise<FormResult> {
  return call("api/PackageCategory/DeactivatePackageCategory", { body: { id } }, "/painel/envio", "Não foi possível desativar.", "Categoria de embalagem desativada.");
}

/* ---------- Site ---------- */

export async function saveHeroImage(_: FormResult, form: FormData): Promise<FormResult> {
  const session = await requireSession();
  const file = form.get("hero");
  if (!(file instanceof File) || file.size === 0) return { error: "Escolha uma imagem." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { error: "Use JPEG, PNG ou WebP." };
  if (file.size > 5 * 1024 * 1024) return { error: "A imagem passa de 5 MB." };
  try {
    const body = new FormData();
    body.append("file", file, file.name);
    const uploaded = await apiUpload<{ imageName?: string }>("api/FileImage/UploadImage", body, session.token);
    if (!uploaded?.imageName) return { error: "A API não devolveu o nome da imagem." };
    await apiRequest("api/SiteSettings", { method: "POST", token: session.token, body: { heroImageName: uploaded.imageName } });
  } catch (error) {
    return failed(error, "Não foi possível trocar a imagem.");
  }
  revalidatePath("/painel/site");
  revalidatePath("/");
  return { ok: true, message: "Imagem da página inicial trocada." };
}

/* ---------- Users ---------- */

export async function createUser(_: FormResult, form: FormData): Promise<FormResult> {
  const email = t(form, "email");
  const password = String(form.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Informe um e-mail válido." };
  if (password.length < 6) return { error: "A senha precisa de pelo menos 6 caracteres." };
  const session = await requireSession();
  return call(
    "api/Security/CreateUser",
    {
      body: {
        email,
        password,
        confirmPassword: password,
        firstName: t(form, "firstName"),
        lastName: t(form, "lastName"),
        emailConfirmed: true,
        isBlocked: false,
        isDeleted: false,
        createdById: session.userId,
      },
    },
    "/painel/usuarios",
    "Não foi possível criar o usuário.",
    "Usuário criado. Agora marque as áreas que ele pode acessar.",
  );
}

export async function updateUser(_: FormResult, form: FormData): Promise<FormResult> {
  const session = await requireSession();
  const userId = t(form, "userId");
  if (userId === session.userId && on(form, "isBlocked")) return { error: "Você não pode bloquear o seu próprio usuário." };
  return call(
    "api/Security/UpdateUser",
    {
      body: {
        userId,
        firstName: t(form, "firstName"),
        lastName: t(form, "lastName"),
        emailConfirmed: true,
        isBlocked: on(form, "isBlocked"),
        isDeleted: false,
        updatedById: session.userId,
      },
    },
    "/painel/usuarios",
    "Não foi possível salvar o usuário.",
    "Usuário salvo.",
  );
}

export async function resetUserPassword(_: FormResult, form: FormData): Promise<FormResult> {
  const password = String(form.get("newPassword") ?? "");
  if (password.length < 6) return { error: "A senha precisa de pelo menos 6 caracteres." };
  return call("api/Security/UpdatePasswordUser", { body: { userId: t(form, "userId"), newPassword: password } }, "/painel/usuarios", "Não foi possível trocar a senha.", "Senha trocada.");
}

export async function setUserRole(userId: string, roleName: string, accessGranted: boolean): Promise<FormResult> {
  return call("api/Security/UpdateUserRole", { body: { userId, roleName, accessGranted } }, "/painel/usuarios", "Não foi possível mudar o acesso.", "Acesso atualizado.");
}

export async function deleteUser(userId: string): Promise<FormResult> {
  const session = await requireSession();
  if (userId === session.userId) return { error: "Você não pode excluir o seu próprio usuário." };
  return call("api/Security/DeleteUser", { body: { userId, deletedById: session.userId } }, "/painel/usuarios", "Não foi possível excluir o usuário.", "Usuário excluído.");
}

/* ---------- Orders ---------- */

export async function setOrderStatus(_: FormResult, form: FormData): Promise<FormResult> {
  const session = await requireSession();
  const id = t(form, "id");
  const status = t(form, "status");
  if (!["Pending", "Paid", "Dispatched", "Shipped", "Delivered", "Cancelled"].includes(status)) return { error: "Status inválido." };
  // UpdateOrder replaces the whole order, so send everything back exactly as the legacy screen does.
  const raw = await apiRequest<Record<string, unknown>>(`api/Order/GetOrderSingle?id=${encodeURIComponent(id)}`, { token: session.token }).catch(() => null);
  if (!raw?.id) return { error: "Pedido não encontrado." };
  const payment = (raw.payment ?? {}) as Record<string, unknown>;
  const detail = (payment.paymentDetail ?? {}) as Record<string, unknown>;
  const shipping = (raw.shippingDetail ?? {}) as Record<string, unknown>;
  const items = Array.isArray(raw.orderDetails) ? (raw.orderDetails as Array<Record<string, unknown>>) : [];
  const body = {
    id,
    customerId: raw.customerId,
    status,
    discount: raw.discount,
    taxes: raw.taxes,
    shippingCost: raw.shippingCost,
    totalAmount: raw.totalAmount,
    notes: raw.notes,
    shippingBoxId: raw.shippingBoxId ?? null,
    payment: {
      id: payment.id,
      name: payment.name,
      description: payment.description,
      status: payment.status,
      paymentDateTime: payment.paymentDateTime ?? null,
      amount: payment.amount,
      paymentTypeId: payment.paymentTypeId ?? null,
      paymentMethod: detail.paymentMethod,
      transactionId: detail.transactionId,
      authorizationCode: detail.authorizationCode,
      referenceNumber: detail.referenceNumber,
      cardHolderName: detail.cardHolderName,
      cardLast4: detail.cardLast4,
    },
    shippingDetail: {
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      email: shipping.email,
      phoneNumber: shipping.phoneNumber,
      street: shipping.street,
      number: shipping.number,
      neighborhood: shipping.neighborhood,
      complement: shipping.complement,
      city: shipping.city,
      state: shipping.state,
      postCode: shipping.postCode,
    },
    orderDetails: items.map((i) => ({ id: i.id, productId: i.productId, quantity: Number(i.quantity ?? 1), unitPrice: Number(i.unitPrice ?? 0) })),
  };
  const result = await call("api/Order/UpdateOrder", { body }, "/painel/pedidos", "Não foi possível mudar o status.", "Status atualizado.");
  revalidatePath("/painel", "layout");
  return result;
}

/* ---------- Melhor Envio balance ---------- */

export async function rechargeBalance(_: FormResult, form: FormData): Promise<FormResult> {
  const session = await requireSession();
  const value = dec(form, "value");
  const slug = t(form, "slug") === "boleto" ? "boleto" : "pix";
  if (!value || value <= 0) return { error: "Informe um valor maior que zero." };
  try {
    const result = await apiRequest<Record<string, string | undefined>>("api/Order/InsertMelhorEnvioBalance", { method: "POST", token: session.token, body: { value, slug } });
    const pixQr = result?.pixQrCode;
    const isImage = !!pixQr && (pixQr.startsWith("data:") || /^https?:\/\//.test(pixQr));
    revalidatePath("/painel", "layout");
    return {
      ok: true,
      message: "Recarga solicitada ao Melhor Envio.",
      data: {
        paymentUrl: result?.paymentUrl,
        pixImage: isImage ? pixQr : undefined,
        pixCode: result?.pixCopyPaste || (!isImage ? pixQr : undefined),
      },
    };
  } catch (error) {
    return failed(error, "Não foi possível solicitar a recarga.");
  }
}

/* ---------- Bag settings ---------- */

export async function saveBagSettings(_: FormResult, form: FormData): Promise<FormResult> {
  const unit = (key: string) => (["minutes", "hours", "days", "weeks", "months"].includes(t(form, key)) ? t(form, key) : "days");
  return call(
    "api/Bag/UpdateBagSettings",
    {
      body: {
        defaultDurationValue: int(form, "defaultDurationValue", 60),
        defaultDurationUnit: unit("defaultDurationUnit"),
        extensionDurationValue: int(form, "extensionDurationValue", 7),
        extensionDurationUnit: unit("extensionDurationUnit"),
        extensionResponseDeadlineValue: int(form, "extensionResponseDeadlineValue", 7),
        extensionResponseDeadlineUnit: unit("extensionResponseDeadlineUnit"),
      },
    },
    "/painel/sacolinhas",
    "Não foi possível salvar os prazos.",
    "Prazos salvos.",
  );
}

/* ---------- Company (sender address used on the shipping labels) ---------- */

export async function saveCompany(_: FormResult, form: FormData): Promise<FormResult> {
  const session = await requireSession();
  const id = t(form, "id");
  if (!id) return { error: "Cadastro da empresa não encontrado." };
  const required: Array<[string, string]> = [
    ["name", "o nome da loja"],
    ["rua", "a rua"],
    ["numero", "o número"],
    ["bairro", "o bairro"],
    ["city", "a cidade"],
    ["state", "o estado"],
    ["zipCode", "o CEP"],
    ["phoneNumber", "o telefone"],
    ["emailAddress", "o e-mail"],
  ];
  // Older form posts (or no JS) send the whole line in "street" instead of its parts.
  const hasParts = form.has("rua");
  const missing = required.filter(([key]) => hasParts || !["rua", "numero", "bairro"].includes(key)).find(([key]) => !t(form, key));
  if (missing) return { error: `Informe ${missing[1]}.` };
  if (!t(form, "street")) return { error: "Informe o endereço." };
  const phoneDigits = t(form, "phoneNumber").replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 11) return { error: "Informe o telefone com DDD, ex.: (19) 99999-0000." };
  const zip = t(form, "zipCode").replace(/\D/g, "");
  if (zip.length !== 8) return { error: "Informe um CEP com 8 números." };
  const state = t(form, "state").toUpperCase();
  if (!/^[A-Z]{2}$/.test(state)) return { error: "Informe a sigla do estado com 2 letras (ex.: SP)." };
  const body = {
    id,
    name: t(form, "name"),
    description: opt(form, "description"),
    currency: opt(form, "currency") ?? "BRL",
    street: t(form, "street"),
    city: t(form, "city"),
    state,
    zipCode: `${zip.slice(0, 5)}-${zip.slice(5)}`,
    country: opt(form, "country") ?? "Brasil",
    phoneNumber: t(form, "phoneNumber"),
    faxNumber: opt(form, "faxNumber"),
    emailAddress: t(form, "emailAddress"),
    website: opt(form, "website"),
    updatedById: session.userId,
  };
  return call("api/Company/UpdateCompany", { body }, "/painel/empresa", "Não foi possível salvar os dados da empresa.", "Dados da empresa salvos.");
}

/* ---------- Payment types ---------- */

export async function savePaymentType(_: FormResult, form: FormData): Promise<FormResult> {
  const id = opt(form, "id");
  const typeName = t(form, "typeName");
  if (!typeName) return { error: "Informe o nome da forma de pagamento." };
  const body = { id, typeName, description: opt(form, "description"), isActive: on(form, "isActive") };
  return call(
    id ? "api/PaymentType/UpdatePaymentType" : "api/PaymentType/CreatePaymentType",
    { body },
    "/painel/pagamentos",
    "Não foi possível salvar a forma de pagamento.",
    id ? "Forma de pagamento salva." : "Forma de pagamento criada.",
  );
}

export async function deletePaymentType(id: string): Promise<FormResult> {
  return call("api/PaymentType/DeletePaymentType", { body: { id } }, "/painel/pagamentos", "Não foi possível excluir a forma de pagamento.", "Forma de pagamento excluída.");
}

/* ---------- My profile ---------- */

export async function saveMyProfile(_: FormResult, form: FormData): Promise<FormResult> {
  const session = await requireSession();
  const firstName = t(form, "firstName");
  const lastName = t(form, "lastName");
  if (!firstName || !lastName) return { error: "Informe nome e sobrenome." };
  // Company and CEP are no longer on this screen: keep whatever the account already has.
  const current = await getMyProfile(session).catch(() => null);
  const postCode = current?.postCode && /^\d{5}-?\d{3}$/.test(current.postCode) ? current.postCode : undefined;
  return call(
    "api/Security/UpdateMyProfile",
    { body: { userId: session.userId, firstName, lastName, companyName: current?.companyName, postCode } },
    "/painel/perfil",
    "Não foi possível salvar o perfil.",
    "Perfil salvo. O nome no menu muda no próximo login.",
  );
}

export async function saveMyPassword(_: FormResult, form: FormData): Promise<FormResult> {
  const session = await requireSession();
  const oldPassword = String(form.get("oldPassword") ?? "");
  const newPassword = String(form.get("newPassword") ?? "");
  const confirmNewPassword = String(form.get("confirmNewPassword") ?? "");
  if (!oldPassword || !newPassword) return { error: "Preencha a senha atual e a nova senha." };
  if (newPassword.length < 6) return { error: "A nova senha precisa ter pelo menos 6 caracteres." };
  if (newPassword !== confirmNewPassword) return { error: "A confirmação não é igual à nova senha." };
  const result = await call(
    "api/Security/UpdateMyProfilePassword",
    { body: { userId: session.userId, oldPassword, newPassword, confirmNewPassword } },
    "/painel/perfil",
    "Não foi possível trocar a senha. Confira a senha atual.",
    "Senha trocada.",
  );
  return result.error && /incorrect|mismatch|invalid/i.test(result.error) ? { error: "A senha atual não confere." } : result;
}
