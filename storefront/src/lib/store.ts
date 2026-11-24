import "server-only";
import { ApiError, apiRequest, resolveImageUrl } from "./api";
import type { CustomerSession } from "./session";

/* ---------- Types ---------- */

export interface ProductSize {
  id?: string;
  size?: string;
  bust?: number;
  sleeve?: number;
  length?: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId?: string;
  dropConfigId?: string;
  price: number;
  oldPrice?: number;
  discountPercent?: number;
  available: boolean;
  imageUrl: string | null;
  pictures: string[];
  altText?: string;
  shortDescription?: string;
  longDescription?: string;
  sizes: ProductSize[];
}

export interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

export interface DropConfig {
  titulo: string;
  subtitulo?: string;
  dataLiberacaoUtc: string;
}

export interface BagItem {
  productId?: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  isPaid: boolean;
  isReserved: boolean;
}

export interface BagSummary {
  id: string;
  status?: string;
  expirationDate?: string;
  paidAt?: string;
  totalItemsValue: number;
  shippingCost?: number;
  itemCount: number;
  currentPaymentId?: string;
  currentPaymentQrCodeBase64?: string;
  currentPaymentQrCode?: string;
  currentPaymentExpiresAt?: string;
  items: BagItem[];
}

export interface OrderSummary {
  id: string;
  status?: string;
  totalAmount?: number;
  shippingCost?: number;
  paymentId?: string;
  paymentStatus?: string;
  pixQrCodeBase64?: string;
  pixCode?: string;
  paymentExpiresAt?: string;
  orderDate?: string;
  items: BagItem[];
}

export interface CustomerProfile {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  cpf?: string;
  phoneNumber?: string;
  emailAddress?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  website?: string;
  instagram?: string;
  twitterX?: string;
  tikTok?: string;
  customerStatus?: string;
}

/* ---------- Mapping ---------- */

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function mapProduct(raw: Raw): Product {
  const pictures = [raw.mainImageURL ?? raw.mainImageUrl, raw.picture1, raw.picture2, raw.picture3, raw.picture4]
    .map((p) => resolveImageUrl(str(p)))
    .filter((p): p is string => !!p);
  const sizes = Array.isArray(raw.sizes) ? (raw.sizes as Raw[]) : [];
  return {
    id: String(raw.id ?? ""),
    name: str(raw.name) ?? "",
    categoryId: str(raw.categoryID ?? raw.categoryId),
    dropConfigId: str(raw.dropConfigId),
    price: num(raw.unitPrice) ?? 0,
    oldPrice: num(raw.oldPrice),
    discountPercent: num(raw.discountPercent),
    available: raw.productAvailable !== false,
    imageUrl: pictures[0] ?? null,
    pictures,
    altText: str(raw.altText),
    shortDescription: str(raw.shortDescription),
    longDescription: str(raw.longDescription),
    sizes: sizes.map((s) => ({
      id: str(s.id),
      size: str(s.size),
      bust: num(s.bust),
      sleeve: num(s.sleeve),
      length: num(s.length),
    })),
  };
}

function mapItems(list: unknown): BagItem[] {
  if (!Array.isArray(list)) return [];
  return (list as Raw[]).map((item) => {
    const product = (item.product ?? {}) as Raw;
    return {
      productId: str(item.productId) ?? str(product.id),
      name: str(item.name) ?? str(item.productName) ?? str(product.name) ?? "Peça",
      imageUrl: resolveImageUrl(
        str(item.productImageUrl) ?? str(item.imageUrl) ?? str(item.mainImageUrl) ?? str(product.mainImageURL ?? product.mainImageUrl),
      ),
      quantity: num(item.quantity) && (item.quantity as number) > 0 ? (item.quantity as number) : 1,
      unitPrice: num(item.unitPrice) ?? num(item.price) ?? num(product.unitPrice) ?? 0,
      isPaid: item.isPaid === true,
      isReserved: item.isReserved === true,
    };
  });
}

function firstList(...lists: unknown[]): unknown {
  return lists.find((l) => Array.isArray(l) && l.length > 0) ?? [];
}

function mapBag(raw: Raw): BagSummary {
  const items = mapItems(firstList(raw.items, raw.bagItems, raw.orderDetails));
  return {
    id: String(raw.id ?? raw.bagId ?? ""),
    status: str(raw.status),
    expirationDate: str(raw.expirationDate),
    paidAt: str(raw.paidAt),
    totalItemsValue: num(raw.totalItemsValue) ?? 0,
    shippingCost: num(raw.shippingCost),
    itemCount: num(raw.itemCount) || items.reduce((sum, i) => sum + i.quantity, 0),
    currentPaymentId: str(raw.currentPaymentId),
    currentPaymentQrCodeBase64: str(raw.currentPaymentQrCodeBase64),
    currentPaymentQrCode: str(raw.currentPaymentQrCode),
    currentPaymentExpiresAt: str(raw.currentPaymentExpiresAt),
    items,
  };
}

function mapOrder(raw: Raw): OrderSummary {
  const payment = (raw.payment ?? {}) as Raw;
  return {
    id: String(raw.id ?? ""),
    status: str(raw.status),
    totalAmount: num(raw.totalAmount),
    shippingCost: num(raw.shippingCost),
    paymentId: str(payment.providerTransactionId) ?? str(raw.paymentId),
    paymentStatus: str(payment.status) ?? str(raw.paymentStatus),
    pixQrCodeBase64: str(payment.pixQrCodeBase64) ?? str(raw.pixQrCodeBase64),
    pixCode: str(payment.pixQrCode) ?? str(raw.pixQrCode),
    paymentExpiresAt: str(payment.expiresAt) ?? str(raw.paymentExpiresAt),
    orderDate: str(raw.orderDate) ?? str(raw.createdAt),
    items: mapItems(firstList(raw.items, raw.orderDetails)),
  };
}

export function qrImage(base64?: string): string | null {
  if (!base64) return null;
  return base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
}

/* ---------- Catalog ---------- */

export async function getProducts(): Promise<Product[]> {
  const list = await apiRequest<Raw[]>("api/Product/GetProductList");
  return (Array.isArray(list) ? list : []).map(mapProduct).filter((p) => p.id);
}

export async function getAvailableProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.available).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function getProduct(id: string, session: CustomerSession | null): Promise<Product | null> {
  // The detail endpoint needs a token; it also returns the extra photos.
  if (session) {
    try {
      const raw = await apiRequest<Raw>(`api/Product/GetProductSingle?id=${encodeURIComponent(id)}`, { token: session.token });
      if (raw && raw.id) return mapProduct(raw);
    } catch {
      /* fall back to the public list */
    }
  }
  const products = await getProducts();
  return products.find((p) => p.id === id) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  try {
    const list = await apiRequest<Raw[]>("api/Category/GetCategoryList");
    return (Array.isArray(list) ? list : [])
      .map((c) => ({ id: String(c.id ?? ""), name: str(c.name) ?? "", isActive: c.isActive !== false }))
      .filter((c) => c.id && c.isActive);
  } catch {
    return [];
  }
}

export async function getHeroImage(): Promise<string | null> {
  try {
    const settings = await apiRequest<Raw>("api/SiteSettings");
    return resolveImageUrl(str(settings?.heroImageUrl));
  } catch {
    return null;
  }
}

export async function getActiveDrop(): Promise<DropConfig | null> {
  try {
    const raw = await apiRequest<Raw | null>("api/drop-config/active", { allowNotFound: true });
    if (!raw || raw.ativo === false) return null;
    const date = str(raw.dataLiberacaoUtc);
    if (!date) return null;
    return { titulo: str(raw.titulo) ?? "Próximo drop", subtitulo: str(raw.subtitulo), dataLiberacaoUtc: date };
  } catch {
    return null;
  }
}

/* ---------- Customer ---------- */

export async function getCustomer(session: CustomerSession): Promise<CustomerProfile | null> {
  try {
    const raw = await apiRequest<Raw>(`api/Customer/GetCustomerSingle?id=${encodeURIComponent(session.userId)}`, { token: session.token });
    if (!raw) return null;
    const profile = raw as CustomerProfile;
    if (!profile.firstName && !profile.lastName && profile.name) {
      const [first, ...rest] = profile.name.trim().split(/\s+/);
      profile.firstName = first;
      profile.lastName = rest.join(" ");
    }
    return profile;
  } catch {
    return null;
  }
}

/* ---------- Bags & orders ---------- */

export async function getActiveBag(session: CustomerSession | null): Promise<BagSummary | null> {
  if (!session) return null;
  try {
    const raw = await apiRequest<Raw | null>(`api/Bag/GetActiveBag?customerId=${encodeURIComponent(session.userId)}`, {
      token: session.token,
      allowNotFound: true,
    });
    return raw && (raw.id || raw.bagId) ? mapBag(raw) : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    return null;
  }
}

export async function getPurchaseHistory(session: CustomerSession): Promise<BagSummary[]> {
  const list = await apiRequest<Raw[]>(`api/Bag/GetPurchaseHistory?customerId=${encodeURIComponent(session.userId)}`, {
    token: session.token,
  });
  return (Array.isArray(list) ? list : []).map(mapBag);
}

export async function getOrders(session: CustomerSession): Promise<OrderSummary[]> {
  const list = await apiRequest<Raw[]>(`api/Order/GetOrderList?customerId=${encodeURIComponent(session.userId)}`, {
    token: session.token,
  });
  return (Array.isArray(list) ? list : []).map(mapOrder);
}

export async function getOrder(id: string, session: CustomerSession | null): Promise<OrderSummary | null> {
  try {
    const raw = await apiRequest<Raw>(`api/Order/GetOrderSingle?id=${encodeURIComponent(id)}`, { token: session?.token });
    return raw && raw.id ? mapOrder(raw) : null;
  } catch {
    return null;
  }
}

export interface ShippingQuote {
  shippingCost: number;
  packageName?: string;
  carrierName?: string;
}

export async function quoteShipping(postCode: string, productIds: string[]): Promise<ShippingQuote> {
  const result = await apiRequest<Raw>("api/Order/CalculateAutomaticShipping", {
    method: "POST",
    body: { destinationPostCode: postCode, items: productIds.map((productId) => ({ productId, quantity: 1 })) },
  });
  if (!result || result.success === false) {
    throw new ApiError(str(result?.message) ?? "Não foi possível calcular o frete para este CEP.", 400);
  }
  return {
    shippingCost: num(result.shippingCost) ?? 0,
    packageName: str(result.packageName),
    carrierName: str(result.carrierName),
  };
}

export async function getPixStatus(paymentId: string, session: CustomerSession) {
  const raw = await apiRequest<Raw | null>(`api/pix/status/${encodeURIComponent(paymentId)}`, {
    token: session.token,
    allowNotFound: true,
  });
  if (!raw) return null;
  return {
    status: str(raw.status),
    orderStatus: str(raw.orderStatus),
    expiresAt: str(raw.expiracao),
  };
}

export function isPaidStatus(status?: string) {
  const s = (status ?? "").toLowerCase().replace(/[\s_-]+/g, "");
  return ["paid", "pago", "approved", "aprovado", "paymentconfirmed", "pagamentoconfirmado"].includes(s);
}
