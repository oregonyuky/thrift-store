"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApiError, apiRequest } from "@/lib/api";
import { loginFailure } from "@/lib/login-errors";
import { clearSession, getCartIds, getSession, jwtExpiry, saveCartIds, setSession } from "@/lib/session";
import { getActiveBag, getAvailableProducts, getCustomer, qrImage } from "@/lib/store";

export interface FormState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const digits = (value: string) => value.replace(/\D/g, "");
const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) return error.message;
  return fallback;
}

function safeReturnUrl(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/* ---------- Cart ---------- */

export async function addToCart(productId: string) {
  const ids = await getCartIds();
  await saveCartIds([...ids, productId]);
  revalidatePath("/", "layout");
}

export async function addToCartAndGo(productId: string) {
  await addToCart(productId);
  redirect("/carrinho");
}

export async function buyNow(productId: string) {
  await addToCart(productId);
  redirect("/checkout");
}

export async function removeFromCart(productId: string) {
  const ids = await getCartIds();
  await saveCartIds(ids.filter((id) => id !== productId));
  revalidatePath("/", "layout");
}

/* ---------- Account ---------- */

interface LoginData {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

async function loginWithApi(email: string, password: string, remember: boolean) {
  const data = await apiRequest<LoginData>("api/Customer/Login", { method: "POST", body: { email, password } });
  if (!data?.accessToken || !data.userId) {
    throw new ApiError("E-mail ou senha inválidos. Conta da equipe? Entre em /painel/login.", 401);
  }
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || data.email || email;
  await setSession(
    {
      token: data.accessToken,
      refreshToken: data.refreshToken,
      userId: data.userId,
      email: data.email || email,
      name,
      exp: jwtExpiry(data.accessToken),
    },
    remember,
  );
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  if (!emailOk(email) || !password) return { error: "Informe seu e-mail e sua senha." };
  try {
    await loginWithApi(email, password, form.get("remember") === "on");
  } catch (error) {
    return { error: loginFailure(error, "loja") };
  }
  redirect(safeReturnUrl(text(form, "returnUrl")));
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const firstName = text(form, "firstName");
  const lastName = text(form, "lastName");
  const email = text(form, "email");
  const instagram = text(form, "instagram");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirmPassword") ?? "");
  const fieldErrors: Record<string, string> = {};
  if (!firstName) fieldErrors.firstName = "Informe o nome.";
  if (!lastName) fieldErrors.lastName = "Informe o sobrenome.";
  if (!emailOk(email)) fieldErrors.email = "Informe um e-mail válido.";
  if (instagram.length > 100) fieldErrors.instagram = "Use no máximo 100 caracteres.";
  if (password.length < 6) fieldErrors.password = "A senha precisa de pelo menos 6 caracteres.";
  if (password !== confirm) fieldErrors.confirmPassword = "As senhas não conferem.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  try {
    await apiRequest("api/Customer/CreateCustomer", {
      method: "POST",
      body: {
        name: `${firstName} ${lastName}`.trim(),
        instagram: instagram || undefined,
        emailAddress: email,
        password,
        confirmPassword: confirm,
        country: "Brasil",
        customerStatus: "Active",
      },
    });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível criar sua conta. Tente novamente.") };
  }

  try {
    await loginWithApi(email, password, true);
  } catch {
    redirect("/entrar?cadastro=ok");
  }
  redirect(safeReturnUrl(text(form, "returnUrl")));
}

export async function logout() {
  await clearSession();
  redirect("/");
}

/* ---------- Contact ---------- */

export async function sendContact(_: FormState, form: FormData): Promise<FormState> {
  const payload = {
    name: text(form, "name"),
    email: text(form, "email"),
    phone: text(form, "phone"),
    subject: text(form, "subject"),
    message: text(form, "message"),
  };
  const fieldErrors: Record<string, string> = {};
  if (!payload.name || payload.name.length > 120) fieldErrors.name = "Informe seu nome.";
  if (!emailOk(payload.email)) fieldErrors.email = "Informe um e-mail válido.";
  if (digits(payload.phone).length < 10 || payload.phone.length > 30) fieldErrors.phone = "Informe um telefone com DDD.";
  if (!payload.subject || payload.subject.length > 160) fieldErrors.subject = "Informe o assunto.";
  if (payload.message.length < 10 || payload.message.length > 4000) fieldErrors.message = "Escreva pelo menos 10 caracteres.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };
  try {
    await apiRequest("api/contact-messages", { method: "POST", body: payload });
    return { success: "Mensagem enviada. Em breve a gente responde." };
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível enviar sua mensagem. Tente novamente.") };
  }
}

/* ---------- Bag ---------- */

export async function finalizeBag(bagId: string): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Entre na sua conta para continuar." };
  const bag = await getActiveBag(session);
  if (!bag || bag.id !== bagId) return { error: "Sacolinha não encontrada." };
  try {
    await apiRequest("api/Bag/FinalizeBag", { method: "POST", body: { bagId }, token: session.token });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível fechar a sacolinha.") };
  }
  revalidatePath("/", "layout");
  return { success: "Sacolinha fechada! Agora a gente prepara o envio." };
}

/* ---------- Checkout ---------- */

export interface CheckoutState extends FormState {
  result?: {
    kind: "order" | "bag";
    id: string;
    paymentId?: string;
    qrImage?: string | null;
    pixCode?: string;
    paymentUrl?: string;
  };
}

type Raw = Record<string, unknown>;

function dig(value: unknown): Raw {
  let current = value as Raw;
  while (current && typeof current === "object") {
    const next = current.content ?? current.Content ?? current.data ?? current.Data;
    if (!next || typeof next !== "object") break;
    current = next as Raw;
  }
  return current ?? {};
}

const s = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export async function placeOrder(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const session = await getSession();
  if (!session) redirect("/entrar?returnUrl=/checkout");

  const input = {
    firstName: text(form, "firstName"),
    lastName: text(form, "lastName"),
    cpf: digits(text(form, "cpf")),
    email: text(form, "email"),
    phone: text(form, "phone"),
    postCode: digits(text(form, "postCode")),
    street: text(form, "street"),
    number: text(form, "number"),
    complement: text(form, "complement"),
    neighborhood: text(form, "neighborhood"),
    city: text(form, "city"),
    state: text(form, "state").toUpperCase(),
    deliveryMode: text(form, "deliveryMode") === "bag" ? "bag" : "normal",
    notes: text(form, "notes"),
  };

  const fieldErrors: Record<string, string> = {};
  if (!input.firstName) fieldErrors.firstName = "Informe o nome.";
  if (!input.lastName) fieldErrors.lastName = "Informe o sobrenome.";
  if (input.cpf.length !== 11) fieldErrors.cpf = "CPF precisa ter 11 números.";
  if (!emailOk(input.email)) fieldErrors.email = "Informe um e-mail válido.";
  if (digits(input.phone).length < 10) fieldErrors.phone = "Informe um telefone com DDD.";
  if (input.postCode.length !== 8) fieldErrors.postCode = "CEP precisa ter 8 números.";
  if (!input.street) fieldErrors.street = "Informe a rua.";
  if (!input.number) fieldErrors.number = "Informe o número.";
  if (!input.neighborhood) fieldErrors.neighborhood = "Informe o bairro.";
  if (!input.city) fieldErrors.city = "Informe a cidade.";
  if (!/^[A-Z]{2}$/.test(input.state)) fieldErrors.state = "UF com 2 letras.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, error: "Confira os campos destacados." };

  const cartIds = await getCartIds();
  let products;
  try {
    products = (await getAvailableProducts()).filter((p) => cartIds.includes(p.id));
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível carregar seu carrinho.") };
  }
  if (products.length === 0) return { error: "Seu carrinho está vazio ou as peças já foram garimpadas." };

  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const shippingDetail = {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phoneNumber: input.phone,
    street: input.street,
    number: input.number,
    complement: input.complement || undefined,
    neighborhood: input.neighborhood,
    city: input.city,
    state: input.state,
    postCode: input.postCode,
  };

  try {
    // Keep the customer record up to date, preserving the fields the form does not edit.
    const existing = await getCustomer(session);
    await apiRequest("api/Customer/UpdateCustomer", {
      method: "POST",
      token: session.token,
      body: {
        id: session.userId,
        name: fullName,
        description: input.notes || undefined,
        cpf: input.cpf,
        phoneNumber: input.phone,
        emailAddress: input.email,
        street: input.street,
        number: input.number,
        neighborhood: input.neighborhood,
        complement: input.complement || undefined,
        city: input.city,
        state: input.state,
        postalCode: input.postCode,
        country: "Brasil",
        website: existing?.website,
        instagram: existing?.instagram,
        twitterX: existing?.twitterX,
        tikTok: existing?.tikTok,
        customerStatus: existing?.customerStatus || "Active",
      },
    });

    let result: CheckoutState["result"];
    if (input.deliveryMode === "bag") {
      const bag = dig(
        await apiRequest<Raw>("api/Bag/CheckoutBag", {
          method: "POST",
          token: session.token,
          body: {
            customerId: session.userId,
            notes: input.notes || undefined,
            payerCpf: input.cpf,
            shippingDetail,
            items: products.map((p) => ({ productId: p.id, quantity: 1, unitPrice: p.price })),
          },
        }),
      );
      const id = s(bag.bagId) ?? s(bag.id);
      if (!id) return { error: "A loja não retornou a sacolinha. Tente novamente." };
      const qr = s(bag.pixQrCodeBase64);
      const pixQr = s(bag.pixQrCode);
      result = {
        kind: "bag",
        id,
        paymentId: s(bag.paymentId),
        qrImage: qrImage(qr) ?? (pixQr?.startsWith("data:") ? pixQr : null),
        pixCode: s(bag.pixCode) ?? (pixQr && !pixQr.startsWith("data:") ? pixQr : undefined),
        paymentUrl: s(bag.paymentUrl),
      };
    } else {
      const order = dig(
        await apiRequest<Raw>("api/Order/CreateOrder", {
          method: "POST",
          token: session.token,
          body: {
            customerId: session.userId,
            status: "Pending",
            notes: input.notes || undefined,
            shippingDetail,
            orderDetails: products.map((p) => ({ productId: p.id, quantity: 1, unitPrice: p.price })),
          },
        }),
      );
      const id = s(order.id);
      if (!id) return { error: "A loja não retornou o número do pedido. Tente novamente." };
      const pix = dig(
        await apiRequest<Raw>("api/pix/criar-pagamento", {
          method: "POST",
          token: session.token,
          body: {
            orderId: id,
            description: `Pedido ${id}`,
            payerFirstName: input.firstName,
            payerLastName: input.lastName,
            payerEmail: input.email,
            payerCpf: input.cpf,
          },
        }),
      );
      const tx = (((pix.pointOfInteraction ?? pix.point_of_interaction) as Raw | undefined)?.transactionData ??
        ((pix.pointOfInteraction ?? pix.point_of_interaction) as Raw | undefined)?.transaction_data ??
        {}) as Raw;
      result = {
        kind: "order",
        id,
        paymentId: s(pix.paymentId) ?? (pix.id !== undefined ? String(pix.id) : undefined),
        qrImage: qrImage(s(pix.qrCodeBase64) ?? s(pix.qr_code_base64) ?? s(tx.qrCodeBase64) ?? s(tx.qr_code_base64)),
        pixCode: s(pix.qrCode) ?? s(pix.qr_code) ?? s(tx.qrCode) ?? s(tx.qr_code),
      };
    }

    if (!result.qrImage && !result.pixCode && !result.paymentUrl) {
      return { error: "O pagamento foi criado, mas o Pix não voltou. Veja em Minhas compras ou fale com a gente." };
    }

    await saveCartIds([]);
    revalidatePath("/", "layout");
    return { result };
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível criar o pedido. Tente novamente.") };
  }
}
