import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { unstable_noStore as noStore } from "next/cache";

import { criarUrlPublica, obterClienteR2 } from "@/lib/r2/cliente";
import { objetoNaoEncontrado } from "@/lib/r2/erros";
import { configuracaoR2Disponivel } from "@/lib/validacao/ambiente";
import {
  dadosEditaveisFilmeSchema,
  filmeInicial,
  filmeSchema,
  type ArquivoVideo,
  type DadosEditaveisFilme,
  type Filme,
} from "@/types/filme";

const CHAVE_CONFIGURACAO = "configuracao/filme.json";

export async function obterFilme(): Promise<Filme> {
  noStore();
  if (!configuracaoR2Disponivel()) return filmeInicial;

  const { cliente, ambiente } = obterClienteR2();
  try {
    const resposta = await cliente.send(
      new GetObjectCommand({
        Bucket: ambiente.R2_BUCKET_NAME,
        Key: CHAVE_CONFIGURACAO,
      }),
    );
    const conteudo = await resposta.Body?.transformToString("utf-8");
    if (!conteudo) throw new Error("O arquivo de configuração está vazio.");
    return filmeSchema.parse(JSON.parse(conteudo));
  } catch (erro) {
    if (objetoNaoEncontrado(erro)) return filmeInicial;
    console.error(
      "[Filme] Não foi possível ler a configuração; usando a versão inicial.",
      erro,
    );
    return filmeInicial;
  }
}

export async function salvarFilme(filme: Filme): Promise<Filme> {
  const validado = filmeSchema.parse(filme);
  const { cliente, ambiente } = obterClienteR2();
  const nomeBackup = `configuracao/historico/filme-${Date.now()}.json`;

  try {
    await cliente.send(
      new CopyObjectCommand({
        Bucket: ambiente.R2_BUCKET_NAME,
        CopySource: `${ambiente.R2_BUCKET_NAME}/${CHAVE_CONFIGURACAO}`,
        Key: nomeBackup,
      }),
    );
  } catch (erro) {
    if (!objetoNaoEncontrado(erro)) throw erro;
  }

  await cliente.send(
    new PutObjectCommand({
      Bucket: ambiente.R2_BUCKET_NAME,
      Key: CHAVE_CONFIGURACAO,
      Body: JSON.stringify(validado, null, 2),
      ContentType: "application/json; charset=utf-8",
      CacheControl: "no-store",
    }),
  );
  return validado;
}

export async function atualizarDadosFilme(
  dados: DadosEditaveisFilme,
): Promise<Filme> {
  const atuais = await obterFilme();
  const editaveis = dadosEditaveisFilmeSchema.parse(dados);
  return salvarFilme({
    ...atuais,
    ...editaveis,
    atualizadoEm: new Date().toISOString(),
  });
}

export async function atualizarPublicacao(publicado: boolean): Promise<Filme> {
  const filme = await obterFilme();
  if (publicado && !filme.video) {
    throw new Error("Envie e verifique o filme antes de publicá-lo.");
  }
  return salvarFilme({
    ...filme,
    publicado,
    atualizadoEm: new Date().toISOString(),
  });
}

export async function associarVideo(video: ArquivoVideo): Promise<{
  filme: Filme;
  chaveAnterior: string | null;
}> {
  const atual = await obterFilme();
  const chaveAnterior = atual.video?.chave ?? null;
  const filme = await salvarFilme({
    ...atual,
    video,
    publicado: atual.video ? atual.publicado : false,
    atualizadoEm: new Date().toISOString(),
  });
  return { filme, chaveAnterior };
}

export async function associarImagem(
  tipo: "capa" | "poster",
  chave: string,
): Promise<Filme> {
  const atual = await obterFilme();
  const { cliente, ambiente } = obterClienteR2();
  await cliente.send(
    new HeadObjectCommand({ Bucket: ambiente.R2_BUCKET_NAME, Key: chave }),
  );
  const propriedade = tipo === "capa" ? "capaUrl" : "posterUrl";
  return salvarFilme({
    ...atual,
    [propriedade]: criarUrlPublica(chave),
    atualizadoEm: new Date().toISOString(),
  });
}

export async function excluirObjeto(chave: string): Promise<void> {
  const { cliente, ambiente } = obterClienteR2();
  await cliente.send(
    new DeleteObjectCommand({ Bucket: ambiente.R2_BUCKET_NAME, Key: chave }),
  );
}

export async function excluirVideoAtual(): Promise<Filme> {
  const atual = await obterFilme();
  if (!atual.video) return atual;
  await excluirObjeto(atual.video.chave);
  return salvarFilme({
    ...atual,
    video: null,
    publicado: false,
    atualizadoEm: new Date().toISOString(),
  });
}
