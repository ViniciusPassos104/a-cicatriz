import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { protegerApi } from "@/lib/auth/proteger-api";
import { respostaDeErro } from "@/lib/http/respostas";
import {
  atualizarDadosFilme,
  atualizarPublicacao,
  obterFilme,
} from "@/lib/r2/repositorio-filme";
import { dadosEditaveisFilmeSchema } from "@/types/filme";

export async function GET() {
  const filme = await obterFilme();
  return NextResponse.json({
    filme: filme.publicado ? filme : { ...filme, video: null },
  });
}

export async function PATCH(request: NextRequest) {
  const protecao = await protegerApi(request);
  if ("resposta" in protecao) return protecao.resposta;
  try {
    const dados = dadosEditaveisFilmeSchema.parse(await request.json());
    return NextResponse.json({ filme: await atualizarDadosFilme(dados) });
  } catch (erro) {
    return respostaDeErro(erro, "Falha ao salvar os dados do filme.");
  }
}

export async function PUT(request: NextRequest) {
  const protecao = await protegerApi(request);
  if ("resposta" in protecao) return protecao.resposta;
  try {
    const { publicado } = z
      .object({ publicado: z.boolean() })
      .parse(await request.json());
    return NextResponse.json({ filme: await atualizarPublicacao(publicado) });
  } catch (erro) {
    return respostaDeErro(erro, "Falha ao alterar a publicação do filme.");
  }
}
