import { NextResponse, type NextRequest } from "next/server";

import { protegerApi } from "@/lib/auth/proteger-api";
import { respostaDeErro } from "@/lib/http/respostas";
import { listarPartes } from "@/lib/r2/multipartes";
import { identificarUploadSchema } from "@/lib/validacao/upload";

export async function POST(request: NextRequest) {
  const protecao = await protegerApi(request);
  if ("resposta" in protecao) return protecao.resposta;
  try {
    const dados = identificarUploadSchema.parse(await request.json());
    return NextResponse.json({
      partes: await listarPartes(dados.chave, dados.uploadId),
    });
  } catch (erro) {
    return respostaDeErro(
      erro,
      "Não foi possível consultar as partes enviadas.",
    );
  }
}
