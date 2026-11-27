"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, apiRequest, apiUpload } from "@/lib/api";
import { loginFailure } from "@/lib/login-errors";
import { getBags, getBagSettings, getProduct, type ProductFull } from "@/lib/painel/data";
import { sessionFromTokens } from "@/lib/painel/seal";
import { requireSession, setSession } from "@/lib/painel/session";

export interface ActionResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

const fail = (error: unknown, fallback: string): ActionResult => ({
  error: error instanceof ApiError && error.message ? error.message : fallback,
});

/* ---------- Auth ---------- */

/** Staff "forgot password": the API e-mails a temporary password plus a link to /painel/recuperar. */
export async function requestPasswordReset(_: ActionResult, form: FormData): Promise<ActionResult> {
  const email = String(form.get("email") ?? "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Informe um e-mail válido." };
  const sent: ActionResult = {
    ok: true,
    message: "Se esse e-mail for de alguém da equipe, enviamos uma senha temporária e um link para ativá-la. Confira também o spam.",
  };
  try {
    await apiRequest("api/Security/ForgotPassword", { method: "POST", body: { email } });
    return sent;
  } catch (error) {
    // Unknown e-mail: answer the same way, so the form does not reveal who is on the team.
    if (error instanceof ApiError && /unable to load user/i.test(`${error.message} ${error.detail ?? ""}`)) return sent;
    console.error("[painel] forgot password", error);
    return { error: "Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos, ou peça a um administrador para redefinir sua senha em Usuários e acesso." };
  }
}

export async function login(_: ActionResult, form: FormData): Promise<ActionResult> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha." };
  try {
    const data = await apiRequest<Parameters<typeof sessionFromTokens>[0]>("api/Security/Login", {
      method: "POST",
      body: { email, password },
    });
    const session = sessionFromTokens(data, email);
    if (!session) return { error: "E-mail ou senha inválidos. Conta de cliente? Entre pela loja." };
    if (session.roles.length > 0 && session.roles.every((r) => r.toLowerCase() === "customer")) {
      return { error: "Esta conta não tem acesso ao painel." };
    }
    await setSession(session);
  } catch (error) {
    return { error: loginFailure(error, "painel") };
  }
  redirect("/painel");
}

/* ---------- Shipping labels (Melhor Envio) ---------- */

async function orderAction(path: string, orderId: string, fallback: string, success: string): Promise<ActionResult> {
  const session = await requireSession();
  try {
    await apiRequest(path, { method: "POST", token: session.token, body: { orderId } });
  } catch (error) {
    return fail(error, fallback);
  }
  revalidatePath("/painel", "layout");
  return { ok: true, message: success };
}

export async function addLabelToCart(orderId: string) {
  return orderAction("api/Order/GenerateShippingLabel", orderId, "Não foi possível adicionar o frete ao carrinho do Melhor Envio.", "Frete adicionado ao carrinho do Melhor Envio.");
}

export async function payLabel(orderId: string) {
  return orderAction("api/Order/BuyShippingCart", orderId, "Não foi possível pagar a etiqueta com o saldo do Melhor Envio.", "Etiqueta paga com o saldo do Melhor Envio.");
}

export async function printLabel(orderId: string) {
  return orderAction("api/Order/GeneratePurchasedShippingLabel", orderId, "Não foi possível gerar a etiqueta.", "Etiqueta gerada. Já dá para baixar o PDF.");
}

/* ---------- Bags ---------- */

export async function extendBag(bagId: string): Promise<ActionResult> {
  const session = await requireSession();
  const settings = await getBagSettings(session);
  try {
    await apiRequest("api/Bag/UpdateBagExpiration", {
      method: "POST",
      token: session.token,
      body: {
        bagId,
        addValue: settings?.extensionDurationValue ?? 7,
        addUnit: settings?.extensionDurationUnit ?? "days",
        note: "Prorrogada pelo painel",
      },
    });
  } catch (error) {
    return fail(error, "Não foi possível prorrogar a sacolinha.");
  }
  revalidatePath("/painel", "layout");
  return { ok: true, message: "Prazo prorrogado." };
}

export async function closeBag(bagId: string): Promise<ActionResult> {
  const session = await requireSession();
  const bags = await getBags(session).catch(() => []);
  if (!bags.some((b) => b.id === bagId)) return { error: "Sacolinha não encontrada." };
  try {
    await apiRequest("api/Bag/FinalizeBag", { method: "POST", token: session.token, body: { bagId } });
  } catch (error) {
    return fail(error, "Não foi possível fechar a sacolinha.");
  }
  revalidatePath("/painel", "layout");
  return { ok: true, message: "Sacolinha fechada para envio." };
}

/* ---------- Products ---------- */

function toUpdatePayload(p: ProductFull) {
  return {
    id: p.id,
    name: p.name,
    categoryID: p.categoryID,
    dropConfigId: p.dropConfigId,
    unitPrice: p.unitPrice,
    oldPrice: p.oldPrice,
    unitWeight: p.unitWeight,
    discountPercent: p.discountPercent,
    productAvailable: p.productAvailable,
    mainImageURL: p.mainImageURL,
    altText: p.altText,
    addBadge: p.addBadge,
    shortDescription: p.shortDescription,
    longDescription: p.longDescription,
    picture1: p.picture1,
    picture2: p.picture2,
    picture3: p.picture3,
    picture4: p.picture4,
    note: p.note,
    sizes: (p.sizes ?? []).map((s) => ({ size: s.size, bust: s.bust, sleeve: s.sleeve, length: s.length, stockQuantity: s.stockQuantity })),
  };
}

export async function setAvailability(productId: string, available: boolean): Promise<ActionResult> {
  const session = await requireSession();
  try {
    // UpdateProduct replaces every field, so send the full current product back.
    const product = await getProduct(session, productId);
    if (!product) return { error: "Peça não encontrada." };
    await apiRequest("api/Product/UpdateProduct", {
      method: "POST",
      token: session.token,
      body: { ...toUpdatePayload(product), productAvailable: available },
    });
  } catch (error) {
    return fail(error, "Não foi possível atualizar a peça.");
  }
  revalidatePath("/painel/produtos");
  return { ok: true };
}

const money = (value: FormDataEntryValue | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const n = Number(raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};
const decimal = (value: FormDataEntryValue | null) => {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};
const textOf = (value: FormDataEntryValue | null) => String(value ?? "").trim() || undefined;

export async function saveProduct(_: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const id = textOf(form.get("id"));
  const name = textOf(form.get("name"));
  const unitPrice = money(form.get("unitPrice"));
  if (!name) return { error: "Dê um nome para a peça." };
  if (unitPrice === undefined || unitPrice <= 0) return { error: "Informe o preço." };

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { error: `“${file.name}” não é JPEG, PNG ou WebP.` };
    if (file.size > 5 * 1024 * 1024) return { error: `“${file.name}” passa de 5 MB.` };
  }

  try {
    const existing = id ? await getProduct(session, id) : null;
    if (id && !existing) return { error: "Peça não encontrada." };

    // Photos kept from the current product, in order, plus the new uploads.
    const kept = form.getAll("keepPhoto").map(String).filter(Boolean);
    const uploaded: string[] = [];
    for (const file of files) {
      const body = new FormData();
      body.append("file", file, file.name);
      const result = await apiUpload<{ imageName?: string }>("api/FileImage/UploadImage", body, session.token);
      if (result?.imageName) uploaded.push(result.imageName);
    }
    const photos = [...kept, ...uploaded].slice(0, 5);

    const size = textOf(form.get("size"));
    const sizeEntry = size || decimal(form.get("bust")) || decimal(form.get("length")) || decimal(form.get("sleeve"))
      ? [{ size, bust: decimal(form.get("bust")), sleeve: decimal(form.get("sleeve")), length: decimal(form.get("length")), stockQuantity: 1 }]
      : [];

    const fields: ProductFull = {
      ...(existing ?? {}),
      name,
      categoryID: textOf(form.get("categoryId")),
      dropConfigId: textOf(form.get("dropConfigId")),
      unitPrice,
      oldPrice: money(form.get("oldPrice")),
      unitWeight: decimal(form.get("unitWeight")),
      productAvailable: form.get("publish") === "1" ? true : existing ? existing.productAvailable : false,
      mainImageURL: photos[0],
      altText: textOf(form.get("altText")) ?? name,
      shortDescription: textOf(form.get("shortDescription")),
      longDescription: textOf(form.get("longDescription")),
      picture1: photos[1],
      picture2: photos[2],
      picture3: photos[3],
      picture4: photos[4],
      sizes: sizeEntry.length ? sizeEntry : existing?.sizes ?? [],
    };
    if (fields.oldPrice && fields.oldPrice > unitPrice) {
      fields.discountPercent = Math.round((1 - unitPrice / fields.oldPrice) * 100);
    } else {
      fields.oldPrice = undefined;
      fields.discountPercent = undefined;
    }

    if (existing) {
      await apiRequest("api/Product/UpdateProduct", { method: "POST", token: session.token, body: toUpdatePayload({ ...fields, id }) });
    } else {
      const { picture1, picture2, picture3, picture4, ...createFields } = fields;
      const created = await apiRequest<{ id?: string }>("api/Product/CreateProduct", {
        method: "POST",
        token: session.token,
        body: toUpdatePayload(createFields),
      });
      // CreateProduct has no extra-photo fields: attach them with an update.
      if (created?.id && (picture1 || picture2 || picture3 || picture4)) {
        await apiRequest("api/Product/UpdateProduct", {
          method: "POST",
          token: session.token,
          body: toUpdatePayload({ ...fields, id: created.id }),
        });
      }
    }
  } catch (error) {
    return fail(error, "Não foi possível salvar a peça.");
  }
  revalidatePath("/painel/produtos");
  redirect("/painel/produtos?salvo=1");
}
