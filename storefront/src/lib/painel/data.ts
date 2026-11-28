import "server-only";
import { ApiError, apiRequest, resolveImageUrl } from "../api";
import type { AdminSession } from "./session";

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const list = (v: unknown) => (Array.isArray(v) ? (v as Raw[]) : []);

/* ---------- Orders ---------- */

export type Stage = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const stageLabels: Record<Stage, string> = {
  [-1]: "Cancelado",
  0: "Aguardando pagamento",
  1: "Pagamento confirmado",
  2: "Preparando embalagem",
  3: "Etiqueta gerada",
  4: "Postado na transportadora",
  5: "Em transporte",
  6: "Entregue",
};

export interface OrderRow {
  id: string;
  customerId?: string;
  customerName?: string;
  status?: string;
  stage: Stage;
  itemCount: number;
  total: number;
  shippingCost?: number;
  city?: string;
  state?: string;
  orderDate?: string;
  paymentMethod?: string;
  packageName?: string;
  meCartId?: string;
  meCartAdded: boolean;
  meCheckedOut: boolean;
  meGenerated: boolean;
  items: Array<{ name: string; imageUrl: string | null; unitPrice: number; quantity: number }>;
}

/** Same rule as the legacy panel's order timeline. */
export function stageOf(o: { status?: string; meGenerated: boolean; meCheckedOut: boolean; meCartAdded: boolean; meCartId?: string }): Stage {
  switch (o.status) {
    case "Cancelled":
      return -1;
    case "Delivered":
      return 6;
    case "Shipped":
      return 5;
    case "Dispatched":
      return 4;
  }
  if (o.meGenerated) return 3;
  if (o.meCheckedOut || o.meCartAdded || o.meCartId) return 2;
  if (o.status === "Paid") return 1;
  return 0;
}

function mapOrder(raw: Raw): OrderRow {
  const base = {
    status: str(raw.status),
    meCartId: str(raw.melhorEnvioCartId),
    meCartAdded: raw.isMelhorEnvioCartAdded === true || !!raw.melhorEnvioCartAddedAt,
    meCheckedOut: raw.isMelhorEnvioCheckedOut === true || !!raw.melhorEnvioCheckoutAt,
    meGenerated: raw.isMelhorEnvioGenerated === true || !!raw.melhorEnvioGeneratedAt,
  };
  const items = list(raw.items ?? raw.orderDetails).map((i) => ({
    name: str(i.productName) ?? "Peça",
    imageUrl: resolveImageUrl(str(i.productImageUrl)),
    unitPrice: num(i.unitPrice) ?? 0,
    quantity: num(i.quantity) ?? 1,
  }));
  const shipping = (raw.shippingDetail ?? {}) as Raw;
  return {
    id: String(raw.id ?? ""),
    customerId: str(raw.customerId),
    customerName: str(raw.customerName) ?? str(raw.shippingRecipientName),
    ...base,
    stage: stageOf(base),
    itemCount: num(raw.itemCount) ?? items.reduce((s, i) => s + i.quantity, 0),
    total: num(raw.totalWithShipping) ?? num(raw.totalAmount) ?? 0,
    shippingCost: num(raw.shippingCost),
    city: str(raw.shippingCity) ?? str(shipping.city),
    state: str(raw.shippingState) ?? str(shipping.state),
    orderDate: str(raw.orderDate) ?? str(raw.createdAt),
    paymentMethod: str(raw.paymentMethod) ?? str(raw.paymentTypeName),
    packageName: str(raw.packageName) ?? str(raw.shippingBoxData),
    items,
  };
}

export async function getOrders(session: AdminSession): Promise<OrderRow[]> {
  const data = await apiRequest<Raw[]>("api/Order/GetOrderList", { token: session.token });
  return list(data)
    .map(mapOrder)
    .filter((o) => o.id)
    .sort((a, b) => new Date(b.orderDate ?? 0).getTime() - new Date(a.orderDate ?? 0).getTime());
}

export interface OrderDetail extends OrderRow {
  notes?: string;
  itemsTotal: number;
  payment?: { status?: string; provider?: string; amount?: number; transactionId?: string; method?: string; paidAt?: string };
  shipping?: { name: string; email?: string; phone?: string; street?: string; number?: string; complement?: string; neighborhood?: string; city?: string; state?: string; postCode?: string };
}

export async function getOrder(session: AdminSession, id: string): Promise<OrderDetail | null> {
  const raw = await apiRequest<Raw>(`api/Order/GetOrderSingle?id=${encodeURIComponent(id)}`, { token: session.token, allowNotFound: true });
  if (!raw || !raw.id) return null;
  const row = mapOrder(raw);
  const payment = (raw.payment ?? undefined) as Raw | undefined;
  const detail = (payment?.paymentDetail ?? {}) as Raw;
  const s = (raw.shippingDetail ?? undefined) as Raw | undefined;
  return {
    ...row,
    total: num(raw.totalAmount) ?? row.total,
    notes: str(raw.notes),
    itemsTotal: row.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    payment: payment
      ? {
          status: str(payment.status),
          provider: str(payment.provider),
          amount: num(payment.amount),
          transactionId: str(payment.providerTransactionId) ?? str(detail.transactionId),
          method: str(detail.paymentMethod) ?? str(payment.paymentTypeName),
          paidAt: str(payment.paymentDateTime) ?? str(detail.capturedAt),
        }
      : undefined,
    shipping: s
      ? {
          name: [str(s.firstName), str(s.lastName)].filter(Boolean).join(" ") || row.customerName || "",
          email: str(s.email),
          phone: str(s.phoneNumber),
          street: str(s.street),
          number: str(s.number),
          complement: str(s.complement),
          neighborhood: str(s.neighborhood),
          city: str(s.city),
          state: str(s.state),
          postCode: str(s.postCode),
        }
      : undefined,
  };
}

/* ---------- Bags ---------- */

export interface BagRow {
  id: string;
  customerName?: string;
  status: string;
  createdAt?: string;
  expirationDate?: string;
  closedAt?: string;
  lastInteractionAt?: string;
  totalItemsValue: number;
  shippingCost?: number;
  totalWeight?: number;
  allItemsPaid: boolean;
  itemCount: number;
}

export async function getBags(session: AdminSession): Promise<BagRow[]> {
  const data = await apiRequest<Raw[]>("api/Bag/GetBagList", { token: session.token });
  return list(data)
    .map((b) => ({
      id: String(b.id ?? ""),
      customerName: str(b.customerName),
      status: str(b.status) ?? "Active",
      createdAt: str(b.createdAt),
      expirationDate: str(b.expirationDate),
      closedAt: str(b.closedAt),
      lastInteractionAt: str(b.lastInteractionAt),
      totalItemsValue: num(b.totalItemsValue) ?? 0,
      shippingCost: num(b.shippingCost),
      totalWeight: num(b.totalWeight),
      allItemsPaid: b.allItemsPaid === true,
      itemCount: num(b.itemCount) ?? 0,
    }))
    .filter((b) => b.id);
}

export interface BagSettings {
  extensionDurationValue: number;
  extensionDurationUnit: string;
}

export async function getBagSettings(session: AdminSession): Promise<BagSettings | null> {
  try {
    const raw = await apiRequest<Raw>("api/Bag/GetBagSettings", { token: session.token });
    return {
      extensionDurationValue: num(raw?.extensionDurationValue) ?? 30,
      extensionDurationUnit: str(raw?.extensionDurationUnit) ?? "days",
    };
  } catch {
    return null;
  }
}

/* ---------- Products ---------- */

export interface ProductRow {
  id: string;
  name: string;
  categoryId?: string;
  dropConfigId?: string;
  dropTitulo?: string;
  createdAt?: string;
  price: number;
  oldPrice?: number;
  available: boolean;
  isSold: boolean;
  imageUrl: string | null;
  size?: string;
}

export async function getProducts(session: AdminSession): Promise<ProductRow[]> {
  const data = await apiRequest<Raw[]>("api/Product/GetProductList", { token: session.token });
  return list(data)
    .map((p) => ({
      id: String(p.id ?? ""),
      name: str(p.name) ?? "",
      categoryId: str(p.categoryID ?? p.categoryId),
      dropConfigId: str(p.dropConfigId),
      dropTitulo: str(p.dropTitulo),
      createdAt: str(p.createdAtUtc),
      price: num(p.unitPrice) ?? 0,
      oldPrice: num(p.oldPrice),
      available: p.productAvailable !== false,
      isSold: p.isSold === true,
      imageUrl: resolveImageUrl(str(p.mainImageURL ?? p.mainImageUrl)),
      size: str(list(p.sizes)[0]?.size),
    }))
    .filter((p) => p.id)
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
}

export interface ProductFull {
  id?: string;
  name?: string;
  categoryID?: string;
  dropConfigId?: string;
  unitPrice?: number;
  oldPrice?: number;
  unitWeight?: number;
  discountPercent?: number;
  productAvailable?: boolean;
  mainImageURL?: string;
  altText?: string;
  addBadge?: boolean;
  shortDescription?: string;
  longDescription?: string;
  picture1?: string;
  picture2?: string;
  picture3?: string;
  picture4?: string;
  note?: string;
  sizes?: Array<{ size?: string; bust?: number; sleeve?: number; length?: number; stockQuantity?: number }>;
}

export async function getProduct(session: AdminSession, id: string): Promise<ProductFull | null> {
  const raw = await apiRequest<ProductFull>(`api/Product/GetProductSingle?id=${encodeURIComponent(id)}`, { token: session.token, allowNotFound: true });
  // The API sends null for empty fields (oldPrice, unitWeight...); the screens expect undefined.
  return raw && raw.id ? (withoutNulls(raw) as ProductFull) : null;
}

function withoutNulls(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(withoutNulls);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, withoutNulls(v)]));
  }
  return value;
}

export interface Option {
  id: string;
  name: string;
}

export async function getCategories(session: AdminSession): Promise<Option[]> {
  try {
    const data = await apiRequest<Raw[]>("api/Category/GetCategoryList", { token: session.token });
    return list(data).map((c) => ({ id: String(c.id ?? ""), name: str(c.name) ?? "" })).filter((c) => c.id);
  } catch {
    return [];
  }
}

export interface Drop extends Option {
  ativo: boolean;
  date?: string;
}

export async function getDrops(session: AdminSession): Promise<Drop[]> {
  try {
    const data = await apiRequest<Raw[]>("api/drop-config", { token: session.token });
    return list(data)
      .map((d) => ({ id: String(d.id ?? ""), name: str(d.titulo) ?? "Drop", ativo: d.ativo === true, date: str(d.dataLiberacaoUtc) }))
      .filter((d) => d.id);
  } catch {
    return [];
  }
}

/* ---------- Other ---------- */

export async function getBalance(session: AdminSession): Promise<number | null> {
  try {
    const raw = await apiRequest<Raw>("api/Order/GetMelhorEnvioBalance", { token: session.token });
    return num(raw?.balance) ?? null;
  } catch {
    return null;
  }
}

export async function getUnreadMessages(session: AdminSession): Promise<number | null> {
  try {
    const data = await apiRequest<Raw[]>("api/contact-messages", { token: session.token });
    return list(data).filter((m) => m.isRead !== true).length;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 401)) return null;
    return null;
  }
}

/* ---------- One bag, with its pieces ---------- */

export interface BagItem {
  id: string;
  productId?: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  quantity: number;
  isPaid: boolean;
  isReserved: boolean;
  reservationExpiresAt?: string;
  addedAt?: string;
  paidAt?: string;
}

export interface BagDetail extends BagRow {
  customerId?: string;
  notes?: string;
  items: BagItem[];
  history: Array<{ id: string; oldDate?: string; newDate?: string; changedAt?: string; note?: string; changedBy?: string }>;
}

export async function getBagDetail(session: AdminSession, id: string): Promise<BagDetail | null> {
  const b = await apiRequest<Raw>(`api/Bag/GetBagSingle?id=${encodeURIComponent(id)}`, { token: session.token, allowNotFound: true });
  if (!b || !str(b.id)) return null;
  const items = list(b.items).map((i) => ({
    id: String(i.id ?? i.productId ?? ""),
    productId: str(i.productId),
    name: str(i.productName) ?? "Peça",
    imageUrl: resolveImageUrl(str(i.productImageUrl)),
    price: num(i.price) ?? 0,
    quantity: num(i.quantity) ?? 1,
    isPaid: i.isPaid === true,
    isReserved: i.isReserved === true,
    reservationExpiresAt: str(i.reservationExpiresAt),
    addedAt: str(i.addedAt),
    paidAt: str(i.paidAt),
  }));
  return {
    id: String(b.id),
    customerId: str(b.customerId),
    customerName: str(b.customerName),
    status: str(b.status) ?? "Active",
    createdAt: str(b.createdAt),
    expirationDate: str(b.expirationDate),
    closedAt: str(b.closedAt),
    lastInteractionAt: str(b.lastInteractionAt),
    totalItemsValue: num(b.totalItemsValue) ?? items.reduce((s, i) => s + i.price * i.quantity, 0),
    shippingCost: num(b.shippingCost),
    totalWeight: num(b.totalWeight),
    allItemsPaid: b.allItemsPaid === true,
    itemCount: items.length,
    notes: str(b.notes),
    items,
    history: list(b.expirationHistory).map((h) => ({
      id: String(h.id ?? ""),
      oldDate: str(h.oldExpirationDate),
      newDate: str(h.newExpirationDate),
      changedAt: str(h.changedAtUtc),
      note: str(h.note),
      changedBy: str(h.changedBy),
    })),
  };
}
