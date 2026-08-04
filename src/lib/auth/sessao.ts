import { timingSafeEqual } from "node:crypto";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";

export const COOKIE_SESSAO = "a_cicatriz_sessao";
const EMISSOR = "a-cicatriz";
const AUDIENCIA = "administracao";

export type SessaoAdmin = { csrf: string };

function chaveSegredo(segredo: string): Uint8Array {
  return new TextEncoder().encode(segredo);
}

export async function criarTokenSessao(
  segredo: string,
  csrf: string,
): Promise<string> {
  return new SignJWT({ csrf })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("administrador")
    .setIssuer(EMISSOR)
    .setAudience(AUDIENCIA)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(chaveSegredo(segredo));
}

export async function validarTokenSessao(
  token: string,
  segredo: string,
): Promise<SessaoAdmin | null> {
  try {
    const { payload } = await jwtVerify(token, chaveSegredo(segredo), {
      issuer: EMISSOR,
      audience: AUDIENCIA,
      subject: "administrador",
    });
    return typeof payload.csrf === "string" ? { csrf: payload.csrf } : null;
  } catch {
    return null;
  }
}

export function opcoesCookieSessao() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}

export async function obterSessaoRequest(
  request: NextRequest,
): Promise<SessaoAdmin | null> {
  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  const segredo = process.env.SESSION_SECRET;
  if (!token || !segredo) return null;
  return validarTokenSessao(token, segredo);
}

export async function exigirSessaoPagina(): Promise<SessaoAdmin> {
  const armazenamento = await cookies();
  const token = armazenamento.get(COOKIE_SESSAO)?.value;
  const segredo = process.env.SESSION_SECRET;
  const sessao =
    token && segredo ? await validarTokenSessao(token, segredo) : null;
  if (!sessao) redirect("/admin/login?motivo=sessao");
  return sessao;
}

export function tokenCsrfValido(
  recebido: string | null,
  esperado: string,
): boolean {
  if (!recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}
