import "server-only";
import { apiRequest, resolveImageUrl } from "../api";
import type { AdminSession } from "./session";

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const list = (v: unknown) => (Array.isArray(v) ? (v as Raw[]) : []);
const get = <T>(session: AdminSession, path: string) => apiRequest<T>(path, { token: session.token });

/* ---------- Customers ---------- */

export interface Customer {
  id: string;
  name?: string;
  description?: string;
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
  country?: string;
  website?: string;
  instagram?: string;
  twitterX?: string;
  tikTok?: string;
  customerStatus?: string;
  createdAt?: string;
}

export async function getCustomers(session: AdminSession): Promise<Customer[]> {
  const data = await get<Raw[]>(session, "api/Customer/GetCustomerList");
  return list(data)
    .map((c) => ({ ...(c as unknown as Customer), id: String(c.id ?? "") }))
    .filter((c) => c.id)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "pt-BR"));
}

/* ---------- Messages ---------- */

export interface Message {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  isRead: boolean;
  receivedAt?: string;
}

export async function getMessages(session: AdminSession): Promise<Message[]> {
  const data = await get<Raw[]>(session, "api/contact-messages");
  return list(data)
    .map((m) => ({
      id: String(m.id ?? ""),
      name: str(m.name),
      email: str(m.email),
      phone: str(m.phone),
      subject: str(m.subject),
      message: str(m.message),
      isRead: m.isRead === true,
      receivedAt: str(m.receivedAtUtc),
    }))
    .filter((m) => m.id)
    .sort((a, b) => new Date(b.receivedAt ?? 0).getTime() - new Date(a.receivedAt ?? 0).getTime());
}

/* ---------- Categories ---------- */

export interface CategoryFull {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  packageOccupationPoints: number;
}

export async function getCategoriesFull(session: AdminSession): Promise<CategoryFull[]> {
  const data = await get<Raw[]>(session, "api/Category/GetCategoryList");
  return list(data)
    .map((c) => ({
      id: String(c.id ?? ""),
      name: str(c.name) ?? "",
      description: str(c.description),
      isActive: c.isActive !== false,
      packageOccupationPoints: num(c.packageOccupationPoints) ?? 0,
    }))
    .filter((c) => c.id)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/* ---------- Drops ---------- */

export interface DropFull {
  id: string;
  titulo: string;
  subtitulo?: string;
  /** Local São Paulo time, "YYYY-MM-DDTHH:mm". */
  dataLiberacao?: string;
  ativo: boolean;
}

export async function getDropsFull(session: AdminSession): Promise<DropFull[]> {
  const data = await get<Raw[]>(session, "api/drop-config");
  return list(data)
    .map((d) => ({
      id: String(d.id ?? ""),
      titulo: str(d.titulo) ?? "Drop",
      subtitulo: str(d.subtitulo),
      dataLiberacao: str(d.dataLiberacaoBrasilia)?.slice(0, 16),
      ativo: d.ativo === true,
    }))
    .filter((d) => d.id)
    .sort((a, b) => (b.dataLiberacao ?? "").localeCompare(a.dataLiberacao ?? ""));
}

/* ---------- Shipping boxes & package categories ---------- */

export interface ShippingBox {
  id: string;
  name: string;
  width?: number;
  length?: number;
  height?: number;
  weight?: number;
  maxWeight?: number;
  insuranceValue?: number;
  isActive: boolean;
  isInUse: boolean;
  packageCategoryId?: string;
  packageCategoryName?: string;
  capacityPoints: number;
  stockQuantity: number;
}

export async function getShippingBoxes(session: AdminSession): Promise<ShippingBox[]> {
  const data = await get<Raw[]>(session, "api/ShippingBox/GetShippingBoxList");
  return list(data)
    .map((b) => ({
      id: String(b.id ?? ""),
      name: str(b.name) ?? "",
      width: num(b.width),
      length: num(b.length),
      height: num(b.height),
      weight: num(b.weight),
      maxWeight: num(b.maxWeight),
      insuranceValue: num(b.insuranceValue),
      isActive: b.isActive !== false,
      isInUse: b.isInUse === true,
      packageCategoryId: str(b.packageCategoryId),
      packageCategoryName: str(b.packageCategoryName),
      capacityPoints: num(b.capacityPoints) ?? 0,
      stockQuantity: num(b.stockQuantity) ?? 0,
    }))
    .filter((b) => b.id)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export interface PackageCategory {
  id: string;
  name: string;
  capacityPoints: number;
  description?: string;
  isActive: boolean;
}

export async function getPackageCategories(session: AdminSession): Promise<PackageCategory[]> {
  const data = await get<Raw[]>(session, "api/PackageCategory/GetPackageCategoryList");
  return list(data)
    .map((p) => ({
      id: String(p.id ?? ""),
      name: str(p.name) ?? "",
      capacityPoints: num(p.capacityPoints) ?? 0,
      description: str(p.description),
      isActive: p.isActive !== false,
    }))
    .filter((p) => p.id)
    .sort((a, b) => a.capacityPoints - b.capacityPoints);
}

/* ---------- Site ---------- */

export async function getHeroImage(session: AdminSession): Promise<string | null> {
  try {
    const raw = await get<Raw>(session, "api/SiteSettings");
    return resolveImageUrl(str(raw?.heroImageUrl));
  } catch {
    return null;
  }
}

/* ---------- Users ---------- */

export interface StaffUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailConfirmed: boolean;
  isBlocked: boolean;
  createdAt?: string;
}

export async function getUsers(session: AdminSession): Promise<StaffUser[]> {
  const data = await get<Raw[]>(session, "api/Security/GetUserList");
  return list(data)
    .filter((u) => u.isDeleted !== true)
    .map((u) => ({
      id: String(u.id ?? ""),
      firstName: str(u.firstName),
      lastName: str(u.lastName),
      email: str(u.email),
      emailConfirmed: u.emailConfirmed === true,
      isBlocked: u.isBlocked === true,
      createdAt: str(u.createdAt),
    }))
    .filter((u) => u.id)
    .sort((a, b) => (a.firstName ?? a.email ?? "").localeCompare(b.firstName ?? b.email ?? "", "pt-BR"));
}

export async function getRoles(session: AdminSession): Promise<string[]> {
  const data = await get<Raw[]>(session, "api/Security/GetRoleList");
  return list(data)
    .map((r) => str(r.name))
    .filter((n): n is string => !!n)
    .sort((a, b) => a.localeCompare(b));
}

export async function getUserRoles(session: AdminSession, userId: string): Promise<string[]> {
  const data = await apiRequest<unknown>("api/Security/GetUserRoles", { method: "POST", token: session.token, body: { userId } });
  return Array.isArray(data) ? data.filter((r): r is string => typeof r === "string") : [];
}

/* ---------- Bag settings ---------- */

export interface BagSettingsFull {
  defaultDurationValue: number;
  defaultDurationUnit: string;
  extensionDurationValue: number;
  extensionDurationUnit: string;
  extensionResponseDeadlineValue: number;
  extensionResponseDeadlineUnit: string;
}

export async function getBagSettingsFull(session: AdminSession): Promise<BagSettingsFull | null> {
  try {
    const raw = await get<Raw>(session, "api/Bag/GetBagSettings");
    return {
      defaultDurationValue: num(raw?.defaultDurationValue) ?? 60,
      defaultDurationUnit: str(raw?.defaultDurationUnit) ?? "days",
      extensionDurationValue: num(raw?.extensionDurationValue) ?? 7,
      extensionDurationUnit: str(raw?.extensionDurationUnit) ?? "days",
      extensionResponseDeadlineValue: num(raw?.extensionResponseDeadlineValue) ?? 7,
      extensionResponseDeadlineUnit: str(raw?.extensionResponseDeadlineUnit) ?? "days",
    };
  } catch {
    return null;
  }
}
