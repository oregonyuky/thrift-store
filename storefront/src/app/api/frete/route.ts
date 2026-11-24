import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api";
import { getCartIds } from "@/lib/session";
import { quoteShipping } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { postCode?: string; productIds?: string[] };
  const postCode = String(body.postCode ?? "").replace(/\D/g, "");
  if (postCode.length !== 8) {
    return NextResponse.json({ message: "CEP inválido. Confira e tente novamente." }, { status: 400 });
  }
  const ids = Array.isArray(body.productIds) && body.productIds.length > 0
    ? body.productIds.filter((id) => typeof id === "string").slice(0, 50)
    : await getCartIds();
  if (ids.length === 0) {
    return NextResponse.json({ message: "Seu carrinho está vazio." }, { status: 400 });
  }
  try {
    const quote = await quoteShipping(postCode, ids);
    return NextResponse.json(quote);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Não foi possível calcular o frete.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
