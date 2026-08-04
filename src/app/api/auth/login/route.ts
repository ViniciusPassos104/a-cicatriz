import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  COOKIE_SESSAO,
  criarTokenSessao,
  opcoesCookieSessao,
} from "@/lib/auth/sessao";
import { obterIp, origemPermitida } from "@/lib/seguranca/origem";
import { verificarLimite } from "@/lib/seguranca/limite-requisicoes";
import { lerAmbienteServidor } from "@/lib/validacao/ambiente";

const credenciaisSchema = z.object({ senha: z.string().min(1).max(256) });

export async function POST(request: NextRequest) {
  const limite = verificarLimite(`login:${obterIp(request)}`, 5, 15 * 60_000);
  if (!limite.permitido) {
    return NextResponse.json(
      {
        erro: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limite.tentarNovamenteEm) },
      },
    );
  }
  if (!origemPermitida(request)) {
    return NextResponse.json(
      { erro: "Não foi possível validar esta solicitação." },
      { status: 403 },
    );
  }

  try {
    const { senha } = credenciaisSchema.parse(await request.json());
    const ambiente = lerAmbienteServidor();
    const corresponde = await bcrypt.compare(
      senha,
      ambiente.ADMIN_PASSWORD_HASH,
    );
    if (!corresponde) {
      return NextResponse.json(
        { erro: "Credenciais incorretas." },
        { status: 401 },
      );
    }

    const csrf = randomBytes(32).toString("base64url");
    const token = await criarTokenSessao(ambiente.SESSION_SECRET, csrf);
    const resposta = NextResponse.json({ sucesso: true, csrf });
    resposta.cookies.set(COOKIE_SESSAO, token, opcoesCookieSessao());
    return resposta;
  } catch (erro) {
    console.error(
      "[Autenticação] Falha no login.",
      erro instanceof Error ? erro.name : "Erro desconhecido",
    );
    return NextResponse.json(
      {
        erro: "Não foi possível entrar. Verifique a configuração e tente novamente.",
      },
      { status: 503 },
    );
  }
}
