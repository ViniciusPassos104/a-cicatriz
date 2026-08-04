import { NextResponse, type NextRequest } from "next/server";

import { protegerApi } from "@/lib/auth/proteger-api";
import { COOKIE_SESSAO, opcoesCookieSessao } from "@/lib/auth/sessao";

export async function POST(request: NextRequest) {
  const protecao = await protegerApi(request);
  if ("resposta" in protecao) return protecao.resposta;

  const resposta = NextResponse.json({ sucesso: true });
  resposta.cookies.set(COOKIE_SESSAO, "", {
    ...opcoesCookieSessao(),
    maxAge: 0,
  });
  return resposta;
}
