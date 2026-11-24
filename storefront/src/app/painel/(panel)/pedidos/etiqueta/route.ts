import { NextResponse } from "next/server";
import { ApiError, apiBinary } from "@/lib/api";
import { getSession } from "@/lib/painel/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/painel/login", request.url));
  const labelId = new URL(request.url).searchParams.get("labelId");
  if (!labelId) return NextResponse.json({ message: "Etiqueta não informada." }, { status: 400 });
  try {
    const upstream = await apiBinary(`api/Order/DownloadShippingLabel?labelId=${encodeURIComponent(labelId)}`, session.token);
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/pdf",
        "Content-Disposition": `attachment; filename="etiqueta-${labelId.replace(/[^\w-]/g, "")}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Não foi possível baixar a etiqueta.";
    return new NextResponse(message, { status: 502, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
