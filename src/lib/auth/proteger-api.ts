import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  obterSessaoRequest,
  tokenCsrfValido,
  type SessaoAdmin,
} from "@/lib/auth/sessao";
import { obterIp, origemPermitida } from "@/lib/seguranca/origem";
import { verificarLimite } from "@/lib/seguranca/limite-requisicoes";

export async function protegerApi(
  request: NextRequest,
  opcoes: { csrf?: boolean } = { csrf: true },
): Promise<{ sessao: SessaoAdmin } | { resposta: NextResponse }> {
  const limite = verificarLimite(`admin:${obterIp(request)}`, 180, 60_000);
  if (!limite.permitido) {
    return {
      resposta: NextResponse.json(
        { erro: "Muitas solicitações. Aguarde um instante e tente novamente." },
        {
          status: 429,
          headers: { "Retry-After": String(limite.tentarNovamenteEm) },
        },
      ),
    };
  }

  const sessao = await obterSessaoRequest(request);
  if (!sessao) {
    return {
      resposta: NextResponse.json(
        {
          erro: "Sua sessão expirou. Entre novamente para continuar.",
          codigo: "SESSAO_EXPIRADA",
        },
        { status: 401 },
      ),
    };
  }

  if (
    opcoes.csrf &&
    (!origemPermitida(request) ||
      !tokenCsrfValido(request.headers.get("x-csrf-token"), sessao.csrf))
  ) {
    return {
      resposta: NextResponse.json(
        { erro: "Não foi possível validar a origem da solicitação." },
        { status: 403 },
      ),
    };
  }

  return { sessao };
}
