import { NextResponse, type NextRequest } from "next/server";

import { protegerApi } from "@/lib/auth/proteger-api";
import { respostaDeErro } from "@/lib/http/respostas";
import { iniciarUploadMultipartes } from "@/lib/r2/multipartes";
import { iniciarUploadSchema } from "@/lib/validacao/upload";

export async function POST(request: NextRequest) {
  const protecao = await protegerApi(request);
  if ("resposta" in protecao) return protecao.resposta;
  try {
    const arquivo = iniciarUploadSchema.parse(await request.json());
    return NextResponse.json(await iniciarUploadMultipartes(arquivo));
  } catch (erro) {
    return respostaDeErro(erro, "Não foi possível preparar o upload.");
  }
}
