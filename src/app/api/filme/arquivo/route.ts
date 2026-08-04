import { NextResponse, type NextRequest } from "next/server";

import { protegerApi } from "@/lib/auth/proteger-api";
import { respostaDeErro } from "@/lib/http/respostas";
import {
  excluirObjeto,
  excluirVideoAtual,
  obterFilme,
} from "@/lib/r2/repositorio-filme";
import { excluirArquivoSchema } from "@/lib/validacao/upload";

export async function DELETE(request: NextRequest) {
  const protecao = await protegerApi(request);
  if ("resposta" in protecao) return protecao.resposta;
  try {
    const acao = excluirArquivoSchema.parse(await request.json());
    if (acao.confirmacao === "EXCLUIR FILME") {
      return NextResponse.json({ filme: await excluirVideoAtual() });
    }

    const filme = await obterFilme();
    if (filme.video?.chave === acao.chave) {
      return NextResponse.json(
        {
          erro: "O arquivo atual não pode ser excluído como arquivo anterior.",
        },
        { status: 409 },
      );
    }
    await excluirObjeto(acao.chave);
    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    return respostaDeErro(
      erro,
      "Não foi possível excluir o arquivo solicitado.",
    );
  }
}
