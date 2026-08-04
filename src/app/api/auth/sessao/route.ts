import { NextResponse, type NextRequest } from "next/server";

import { protegerApi } from "@/lib/auth/proteger-api";

export async function GET(request: NextRequest) {
  const protecao = await protegerApi(request, { csrf: false });
  if ("resposta" in protecao) return protecao.resposta;
  return NextResponse.json({ autenticado: true, csrf: protecao.sessao.csrf });
}
