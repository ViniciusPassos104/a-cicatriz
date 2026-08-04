import { NextResponse, type NextRequest } from "next/server";

import { protegerApi } from "@/lib/auth/proteger-api";
import { respostaDeErro } from "@/lib/http/respostas";
import { assinarUploadImagem } from "@/lib/r2/imagens";
import { associarImagem } from "@/lib/r2/repositorio-filme";
import {
  confirmarImagemSchema,
  imagemUploadSchema,
} from "@/lib/validacao/upload";

export async function POST(request: NextRequest) {
  const protecao = await protegerApi(request);
  if ("resposta" in protecao) return protecao.resposta;
  try {
    const dados = imagemUploadSchema.parse(await request.json());
    return NextResponse.json(await assinarUploadImagem(dados));
  } catch (erro) {
    return respostaDeErro(erro, "Falha ao preparar o envio da imagem.");
  }
}

export async function PATCH(request: NextRequest) {
  const protecao = await protegerApi(request);
  if ("resposta" in protecao) return protecao.resposta;
  try {
    const dados = confirmarImagemSchema.parse(await request.json());
    return NextResponse.json({
      filme: await associarImagem(dados.tipoImagem, dados.chave),
    });
  } catch (erro) {
    return respostaDeErro(erro, "Falha ao salvar a imagem do filme.");
  }
}
