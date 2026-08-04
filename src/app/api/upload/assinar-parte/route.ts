import { NextResponse, type NextRequest } from "next/server";

import { protegerApi } from "@/lib/auth/proteger-api";
import { respostaDeErro } from "@/lib/http/respostas";
import { assinarParte } from "@/lib/r2/multipartes";
import { assinarParteSchema } from "@/lib/validacao/upload";

export async function POST(request: NextRequest) {
  const protecao = await protegerApi(request);
  if ("resposta" in protecao) return protecao.resposta;
  try {
    const dados = assinarParteSchema.parse(await request.json());
    const url = await assinarParte(
      dados.chave,
      dados.uploadId,
      dados.numeroParte,
    );
    return NextResponse.json({ url, expiraEmSegundos: 600 });
  } catch (erro) {
    return respostaDeErro(erro, "Não foi possível gerar a URL desta parte.");
  }
}
