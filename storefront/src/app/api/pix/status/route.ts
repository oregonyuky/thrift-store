import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPixStatus, isPaidStatus } from "@/lib/store";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Entre na sua conta." }, { status: 401 });
  const paymentId = new URL(request.url).searchParams.get("paymentId");
  if (!paymentId) return NextResponse.json({ message: "Pagamento não informado." }, { status: 400 });
  try {
    const status = await getPixStatus(paymentId, session);
    if (!status) return NextResponse.json({ message: "Pagamento não encontrado." }, { status: 404 });
    return NextResponse.json({
      paid: isPaidStatus(status.status) || isPaidStatus(status.orderStatus),
      status: status.status,
      expiresAt: status.expiresAt,
    });
  } catch {
    return NextResponse.json({ message: "Não foi possível consultar o pagamento." }, { status: 502 });
  }
}
