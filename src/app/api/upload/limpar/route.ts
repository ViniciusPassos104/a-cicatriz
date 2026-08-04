import { NextResponse, type NextRequest } from "next/server";

import { protegerApi } from "@/lib/auth/proteger-api";
import { respostaDeErro } from "@/lib/http/respostas";
import { limparUploadsIncompletos } from "@/lib/r2/multipartes";

export async function POST(request: NextRequest) {
  const protecao = await protegerApi(request);
  if ("resposta" in protecao) return protecao.resposta;
  try {
    return NextResponse.json({ removidos: await limparUploadsIncompletos() });
  } catch (erro) {
    return respostaDeErro(erro, "Não foi possível limpar uploads incompletos.");
  }
}
