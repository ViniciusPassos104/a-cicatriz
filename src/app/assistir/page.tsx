import type { Metadata } from "next";

import { PlayerFilme } from "@/components/player/player-filme";
import { SemVideo } from "@/components/player/sem-video";
import { obterFilme } from "@/lib/r2/repositorio-filme";
import {
  configuracaoFilmeLocal,
  ID_FILME_LOCAL_PADRAO,
  obterVideosLocais,
} from "@/lib/video-local";

export const metadata: Metadata = {
  title: "Assistir",
  description: "Assista ao curta-metragem A Cicatriz.",
};
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ versao?: string | string[] }>;
};

export default async function Assistir({ searchParams }: Props) {
  const parametros = await searchParams;
  const versaoSolicitada = Array.isArray(parametros.versao)
    ? parametros.versao[0]
    : parametros.versao;
  const configuracaoLocal =
    configuracaoFilmeLocal(versaoSolicitada) ?? configuracaoFilmeLocal();
  if (!configuracaoLocal) return <SemVideo />;

  const [filme, videosLocais] = await Promise.all([
    obterFilme(),
    obterVideosLocais(configuracaoLocal.id),
  ]);
  if (
    videosLocais.length &&
    (configuracaoLocal.id !== ID_FILME_LOCAL_PADRAO ||
      !filme.publicado ||
      !filme.video)
  ) {
    return (
      <PlayerFilme
        titulo={configuracaoLocal.titulo}
        fontes={videosLocais.map((video) => ({
          id: video.id,
          rotulo: video.rotulo,
          resolucao: video.resolucao,
          url: `/api/video-local?versao=${configuracaoLocal.id}&qualidade=${video.id}`,
          downloadUrl: `/api/video-local?versao=${configuracaoLocal.id}&qualidade=${video.id}&download=1`,
        }))}
        poster={filme.posterUrl}
        legendaUrl={filme.legendaUrl}
      />
    );
  }
  if (!filme.publicado || !filme.video) return <SemVideo />;
  return (
    <PlayerFilme
      titulo={filme.titulo}
      fontes={[
        {
          id: "original",
          rotulo: "Original",
          resolucao: 2160,
          url: filme.video.url,
          downloadUrl: filme.video.url,
        },
      ]}
      poster={filme.posterUrl}
      legendaUrl={filme.legendaUrl}
    />
  );
}
