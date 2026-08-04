import { createReadStream } from "node:fs";
import { Readable } from "node:stream";

import {
  interpretarIntervalo,
  obterVideoLocal,
  qualidadeVideoLocal,
  versaoVideoLocal,
} from "@/lib/video-local";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cabecalhosBase = {
  "Accept-Ranges": "bytes",
  "Content-Type": "video/mp4",
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

async function videoDaRequisicao(request: Request) {
  const parametros = new URL(request.url).searchParams;
  const versao = versaoVideoLocal(parametros.get("versao"));
  if (!versao) return null;
  const qualidade = qualidadeVideoLocal(parametros.get("qualidade"), versao);
  if (!qualidade) return null;
  return obterVideoLocal(versao, qualidade);
}

function cabecalhosDownload(
  request: Request,
  nome: string,
): Record<string, string> {
  const baixar = new URL(request.url).searchParams.get("download") === "1";
  if (!baixar) return {};
  const nomeSeguro = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .toLowerCase();
  return { "Content-Disposition": `attachment; filename="${nomeSeguro}"` };
}

export async function HEAD(request: Request) {
  const video = await videoDaRequisicao(request);
  if (!video) return new Response(null, { status: 404 });
  return new Response(null, {
    status: 200,
    headers: {
      ...cabecalhosBase,
      ...cabecalhosDownload(request, video.nome),
      "Content-Length": String(video.tamanho),
    },
  });
}

export async function GET(request: Request) {
  const video = await videoDaRequisicao(request);
  if (!video) {
    return Response.json(
      { erro: "O arquivo local do filme não foi encontrado." },
      { status: 404 },
    );
  }

  const intervaloSolicitado = request.headers.get("range");
  if (intervaloSolicitado) {
    const intervalo = interpretarIntervalo(intervaloSolicitado, video.tamanho);
    if (!intervalo) {
      return new Response(null, {
        status: 416,
        headers: {
          ...cabecalhosBase,
          "Content-Range": `bytes */${video.tamanho}`,
        },
      });
    }

    const tamanhoIntervalo = intervalo.fim - intervalo.inicio + 1;
    const arquivo = createReadStream(video.caminho, {
      start: intervalo.inicio,
      end: intervalo.fim,
    });
    return new Response(Readable.toWeb(arquivo) as ReadableStream, {
      status: 206,
      headers: {
        ...cabecalhosBase,
        ...cabecalhosDownload(request, video.nome),
        "Content-Length": String(tamanhoIntervalo),
        "Content-Range": `bytes ${intervalo.inicio}-${intervalo.fim}/${video.tamanho}`,
      },
    });
  }

  const arquivo = createReadStream(video.caminho);
  return new Response(Readable.toWeb(arquivo) as ReadableStream, {
    status: 200,
    headers: {
      ...cabecalhosBase,
      ...cabecalhosDownload(request, video.nome),
      "Content-Length": String(video.tamanho),
    },
  });
}
