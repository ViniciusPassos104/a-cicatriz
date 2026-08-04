import { NextResponse, type NextRequest } from "next/server";

import { protegerApi } from "@/lib/auth/proteger-api";
import { respostaDeErro } from "@/lib/http/respostas";
import { concluirUploadMultipartes } from "@/lib/r2/multipartes";
import { concluirUploadSchema } from "@/lib/validacao/upload";

export async function POST(request: NextRequest) {
  const protecao = await protegerApi(request);
  if ("resposta" in protecao) return protecao.resposta;
  try {
    const dados = concluirUploadSchema.parse(await request.json());
    return NextResponse.json(await concluirUploadMultipartes(dados));
  } catch (erro) {
    return respostaDeErro(
      erro,
      "Falha ao concluir o upload. As partes enviadas foram preservadas.",
    );
  }
}
