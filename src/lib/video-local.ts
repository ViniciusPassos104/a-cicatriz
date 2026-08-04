import { stat } from "node:fs/promises";
import path from "node:path";

export const ID_FILME_LOCAL_PADRAO = "a-cicatriz";

export const FILMES_LOCAIS = [
  {
    id: ID_FILME_LOCAL_PADRAO,
    titulo: "A Cicatriz",
    subtitulo: "Versão original",
    duracao: "9 min",
    fontes: [
      {
        id: "2160p",
        nome: "FILME DEMO.mp4",
        rotulo: "4K",
        resolucao: 2160,
      },
      {
        id: "1080p",
        nome: "FILME DEMO 1080p.mp4",
        rotulo: "Full HD",
        resolucao: 1080,
      },
      {
        id: "720p",
        nome: "FILME DEMO 720p.mp4",
        rotulo: "HD",
        resolucao: 720,
      },
    ],
  },
  {
    id: "mais-depressivo",
    titulo: "Mais Depressivo",
    subtitulo: "Versão alternativa de A Cicatriz",
    duracao: "10 min",
    fontes: [
      {
        id: "1080p",
        nome: "Filme da escola.mp4",
        rotulo: "Full HD",
        resolucao: 1080,
      },
      {
        id: "720p",
        nome: "Filme da escola 720p.mp4",
        rotulo: "HD",
        resolucao: 720,
      },
    ],
  },
  {
    id: "resultado-final",
    titulo: "Resultado Final",
    subtitulo: "Versão final de A Cicatriz",
    duracao: "9 min",
    fontes: [
      {
        id: "1080p",
        nome: "Filme, resultado final.mp4",
        rotulo: "Full HD",
        resolucao: 1080,
      },
      {
        id: "720p",
        nome: "Filme, resultado final 720p.mp4",
        rotulo: "HD",
        resolucao: 720,
      },
    ],
  },
] as const;

export type IdFilmeLocal = (typeof FILMES_LOCAIS)[number]["id"];

export type VideoLocal = {
  filmeId: IdFilmeLocal;
  id: string;
  caminho: string;
  tamanho: number;
  nome: string;
  rotulo: string;
  resolucao: number;
};

export function configuracaoFilmeLocal(valor?: string | null) {
  const id = valor || ID_FILME_LOCAL_PADRAO;
  return FILMES_LOCAIS.find((filme) => filme.id === id) ?? null;
}

export function versaoVideoLocal(valor: string | null): IdFilmeLocal | null {
  const filme = configuracaoFilmeLocal(valor);
  return filme?.id ?? null;
}

export function qualidadeVideoLocal(
  valor: string | null,
  versao: IdFilmeLocal = ID_FILME_LOCAL_PADRAO,
): string | null {
  const filme = configuracaoFilmeLocal(versao);
  if (!filme) return null;
  if (!valor) return filme.fontes[0].id;
  return filme.fontes.some((video) => video.id === valor) ? valor : null;
}

export async function obterVideoLocal(
  versao: IdFilmeLocal = ID_FILME_LOCAL_PADRAO,
  qualidade?: string | null,
): Promise<VideoLocal | null> {
  const filme = configuracaoFilmeLocal(versao);
  if (!filme) return null;
  const idQualidade = qualidadeVideoLocal(qualidade ?? null, versao);
  const configuracao = filme.fontes.find((video) => video.id === idQualidade);
  if (!configuracao) return null;

  const caminho = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    configuracao.nome,
  );

  try {
    const informacoes = await stat(caminho);
    if (!informacoes.isFile() || informacoes.size <= 0) return null;
    return {
      ...configuracao,
      filmeId: filme.id,
      caminho,
      tamanho: informacoes.size,
    };
  } catch {
    return null;
  }
}

export async function obterVideosLocais(
  versao: IdFilmeLocal = ID_FILME_LOCAL_PADRAO,
): Promise<VideoLocal[]> {
  const filme = configuracaoFilmeLocal(versao);
  if (!filme) return [];
  const videos = await Promise.all(
    filme.fontes.map((video) => obterVideoLocal(versao, video.id)),
  );
  return videos.filter((video): video is VideoLocal => video !== null);
}

export function interpretarIntervalo(
  cabecalho: string,
  tamanho: number,
): { inicio: number; fim: number } | null {
  const correspondencia = /^bytes=(\d*)-(\d*)$/.exec(cabecalho.trim());
  if (!correspondencia) return null;

  const inicioTexto = correspondencia[1] ?? "";
  const fimTexto = correspondencia[2] ?? "";
  if (!inicioTexto && !fimTexto) return null;

  if (!inicioTexto) {
    const quantidade = Number(fimTexto);
    if (!Number.isSafeInteger(quantidade) || quantidade <= 0) return null;
    return { inicio: Math.max(0, tamanho - quantidade), fim: tamanho - 1 };
  }

  const inicio = Number(inicioTexto);
  const fimInformado = fimTexto ? Number(fimTexto) : tamanho - 1;
  const fim = Math.min(fimInformado, tamanho - 1);
  if (
    !Number.isSafeInteger(inicio) ||
    !Number.isSafeInteger(fim) ||
    inicio < 0 ||
    inicio >= tamanho ||
    fim < inicio
  ) {
    return null;
  }
  return { inicio, fim };
}
