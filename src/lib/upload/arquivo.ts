import { randomUUID } from "node:crypto";

import {
  EXTENSOES_VIDEO,
  TAMANHO_MAXIMO_VIDEO,
  TAMANHO_PARTE,
  TIPOS_VIDEO,
  type TipoVideo,
} from "@/lib/upload/constantes";

export type DescricaoArquivo = {
  nome: string;
  tamanho: number;
  tipo: string;
};

export type ResultadoValidacaoArquivo =
  | { valido: true; extensao: "mp4" | "webm"; tipo: TipoVideo }
  | { valido: false; mensagem: string };

export function validarVideo(
  arquivo: DescricaoArquivo,
): ResultadoValidacaoArquivo {
  if (!Number.isSafeInteger(arquivo.tamanho) || arquivo.tamanho <= 0) {
    return {
      valido: false,
      mensagem: "O arquivo está vazio ou possui tamanho inválido.",
    };
  }
  if (arquivo.tamanho > TAMANHO_MAXIMO_VIDEO) {
    return {
      valido: false,
      mensagem:
        "O arquivo é maior que 5 GB (5.000.000.000 bytes). Selecione um vídeo menor.",
    };
  }

  const extensao = arquivo.nome.split(".").pop()?.toLowerCase();
  if (!extensao || !EXTENSOES_VIDEO.includes(extensao as "mp4" | "webm")) {
    return {
      valido: false,
      mensagem: "Formato incompatível. Use um arquivo MP4 ou WebM.",
    };
  }
  if (!TIPOS_VIDEO.includes(arquivo.tipo as TipoVideo)) {
    return {
      valido: false,
      mensagem: "O tipo do arquivo não corresponde a um vídeo MP4 ou WebM.",
    };
  }

  const tipoEsperado = extensao === "mp4" ? "video/mp4" : "video/webm";
  if (arquivo.tipo !== tipoEsperado) {
    return {
      valido: false,
      mensagem: "A extensão e o tipo do vídeo não correspondem.",
    };
  }

  return {
    valido: true,
    extensao: extensao as "mp4" | "webm",
    tipo: tipoEsperado,
  };
}

export function criarChaveSegura(
  categoria: "filmes" | "capas" | "posteres",
  extensao: string,
  gerarId: () => string = randomUUID,
): string {
  const extensaoNormalizada = extensao.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!extensaoNormalizada) throw new Error("Extensão inválida.");
  return `${categoria}/${gerarId()}.${extensaoNormalizada}`;
}

export function calcularPartes(
  tamanhoArquivo: number,
  tamanhoParte = TAMANHO_PARTE,
): Array<{ numero: number; inicio: number; fim: number; tamanho: number }> {
  if (tamanhoArquivo <= 0 || tamanhoParte <= 0) return [];

  const quantidade = Math.ceil(tamanhoArquivo / tamanhoParte);
  return Array.from({ length: quantidade }, (_, indice) => {
    const inicio = indice * tamanhoParte;
    const fim = Math.min(inicio + tamanhoParte, tamanhoArquivo);
    return { numero: indice + 1, inicio, fim, tamanho: fim - inicio };
  });
}
