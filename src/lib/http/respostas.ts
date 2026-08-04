import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ErroConfiguracao } from "@/lib/validacao/ambiente";

export function respostaDeErro(
  erro: unknown,
  mensagemPadrao: string,
): NextResponse {
  if (erro instanceof ZodError) {
    return NextResponse.json(
      { erro: erro.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }
  if (erro instanceof ErroConfiguracao) {
    console.error(
      "[Configuração] Variáveis ausentes:",
      erro.variaveis.join(", "),
    );
    return NextResponse.json(
      {
        erro: "A configuração do R2 está incompleta. Consulte o arquivo .env.example.",
      },
      { status: 503 },
    );
  }
  if (erro instanceof Error) {
    const mensagensPermitidas = [
      "Envie e verifique o filme antes de publicá-lo.",
      "Número de parte inválido.",
      "A lista de partes enviadas não corresponde ao armazenamento.",
      "O tamanho armazenado não corresponde ao arquivo original.",
      "Formato de imagem incompatível. Use JPG, PNG ou WebP.",
      "A imagem deve ter no máximo 10 MiB.",
    ];
    if (
      mensagensPermitidas.includes(erro.message) ||
      erro.message.startsWith("O arquivo") ||
      erro.message.startsWith("Formato incompatível") ||
      erro.message.startsWith("O tipo") ||
      erro.message.startsWith("A extensão")
    ) {
      return NextResponse.json({ erro: erro.message }, { status: 400 });
    }
  }
  console.error(`[API] ${mensagemPadrao}`, erro);
  return NextResponse.json({ erro: mensagemPadrao }, { status: 500 });
}
