import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function obterCapa() {
  const caminho = path.join(process.cwd(), "Capa do Filme.png");
  try {
    const informacoes = await stat(caminho);
    return informacoes.isFile() ? { caminho, tamanho: informacoes.size } : null;
  } catch {
    return null;
  }
}

const cabecalhos = {
  "Cache-Control": "public, max-age=3600, must-revalidate",
  "Content-Type": "image/png",
  "X-Content-Type-Options": "nosniff",
};

export async function HEAD() {
  const capa = await obterCapa();
  if (!capa) return new Response(null, { status: 404 });
  return new Response(null, {
    headers: { ...cabecalhos, "Content-Length": String(capa.tamanho) },
  });
}

export async function GET() {
  const capa = await obterCapa();
  if (!capa) return new Response(null, { status: 404 });
  const arquivo = createReadStream(capa.caminho);
  return new Response(Readable.toWeb(arquivo) as ReadableStream, {
    headers: { ...cabecalhos, "Content-Length": String(capa.tamanho) },
  });
}
