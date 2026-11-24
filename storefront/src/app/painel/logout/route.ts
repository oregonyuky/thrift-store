import { NextResponse } from "next/server";
import { clearSession } from "@/lib/painel/session";

export async function POST(request: Request) {
  await clearSession();
  return NextResponse.redirect(new URL("/painel/login", request.url), 303);
}
