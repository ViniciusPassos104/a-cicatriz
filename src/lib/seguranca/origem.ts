import type { NextRequest } from "next/server";

export function origemPermitida(request: NextRequest): boolean {
  const origem = request.headers.get("origin");
  if (!origem) return false;

  const configurada = process.env.NEXT_PUBLIC_SITE_URL;
  const permitidas = new Set([request.nextUrl.origin]);
  if (configurada) {
    try {
      permitidas.add(new URL(configurada).origin);
    } catch {
      return false;
    }
  }
  return permitidas.has(origem);
}

export function obterIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "desconhecido"
  );
}
