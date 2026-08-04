import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
  ListMultipartUploadsCommand,
  ListPartsCommand,
  UploadPartCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { criarUrlPublica, obterClienteR2 } from "@/lib/r2/cliente";
import { associarVideo } from "@/lib/r2/repositorio-filme";
import {
  criarChaveSegura,
  validarVideo,
  type DescricaoArquivo,
} from "@/lib/upload/arquivo";
import { TAMANHO_PARTE } from "@/lib/upload/constantes";

export async function iniciarUploadMultipartes(arquivo: DescricaoArquivo) {
  const validacao = validarVideo(arquivo);
  if (!validacao.valido) throw new Error(validacao.mensagem);

  const { cliente, ambiente } = obterClienteR2();
  const chave = criarChaveSegura("filmes", validacao.extensao);
  const resposta = await cliente.send(
    new CreateMultipartUploadCommand({
      Bucket: ambiente.R2_BUCKET_NAME,
      Key: chave,
      ContentType: validacao.tipo,
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: { tamanho_original: String(arquivo.tamanho) },
    }),
  );
  if (!resposta.UploadId)
    throw new Error("O armazenamento não retornou um identificador de upload.");

  return { uploadId: resposta.UploadId, chave, tamanhoParte: TAMANHO_PARTE };
}

export async function assinarParte(
  chave: string,
  uploadId: string,
  numeroParte: number,
) {
  if (
    !Number.isInteger(numeroParte) ||
    numeroParte < 1 ||
    numeroParte > 10_000
  ) {
    throw new Error("Número de parte inválido.");
  }
  const { cliente, ambiente } = obterClienteR2();
  const comando = new UploadPartCommand({
    Bucket: ambiente.R2_BUCKET_NAME,
    Key: chave,
    UploadId: uploadId,
    PartNumber: numeroParte,
  });
  return getSignedUrl(cliente, comando, { expiresIn: 10 * 60 });
}

export async function listarPartes(
  chave: string,
  uploadId: string,
): Promise<CompletedPart[]> {
  const { cliente, ambiente } = obterClienteR2();
  const partes: CompletedPart[] = [];
  let marcador: string | undefined;

  do {
    const resposta = await cliente.send(
      new ListPartsCommand({
        Bucket: ambiente.R2_BUCKET_NAME,
        Key: chave,
        UploadId: uploadId,
        PartNumberMarker: marcador,
      }),
    );
    partes.push(
      ...(resposta.Parts ?? []).map(({ ETag, PartNumber }) => ({
        ETag,
        PartNumber,
      })),
    );
    marcador = resposta.IsTruncated ? resposta.NextPartNumberMarker : undefined;
  } while (marcador);

  return partes;
}

export async function concluirUploadMultipartes(args: {
  chave: string;
  uploadId: string;
  partes: CompletedPart[];
  nomeExibicao: string;
  tamanhoEsperado: number;
  tipo: "video/mp4" | "video/webm";
}) {
  const validacao = validarVideo({
    nome: args.nomeExibicao,
    tamanho: args.tamanhoEsperado,
    tipo: args.tipo,
  });
  if (!validacao.valido) throw new Error(validacao.mensagem);

  const { cliente, ambiente } = obterClienteR2();
  const partesRemotas = await listarPartes(args.chave, args.uploadId);
  const recebidas = new Map(
    args.partes.map((parte) => [parte.PartNumber, parte.ETag]),
  );
  const conferidas = partesRemotas
    .filter(
      (parte) =>
        parte.PartNumber && recebidas.get(parte.PartNumber) === parte.ETag,
    )
    .sort((a, b) => (a.PartNumber ?? 0) - (b.PartNumber ?? 0));

  if (conferidas.length !== args.partes.length || conferidas.length === 0) {
    throw new Error(
      "A lista de partes enviadas não corresponde ao armazenamento.",
    );
  }

  await cliente.send(
    new CompleteMultipartUploadCommand({
      Bucket: ambiente.R2_BUCKET_NAME,
      Key: args.chave,
      UploadId: args.uploadId,
      MultipartUpload: { Parts: conferidas },
    }),
  );

  const cabecalho = await cliente.send(
    new HeadObjectCommand({ Bucket: ambiente.R2_BUCKET_NAME, Key: args.chave }),
  );
  const tamanhoDeclarado = Number(cabecalho.Metadata?.tamanho_original);
  if (
    cabecalho.ContentLength !== args.tamanhoEsperado ||
    tamanhoDeclarado !== args.tamanhoEsperado
  ) {
    throw new Error(
      "O tamanho armazenado não corresponde ao arquivo original.",
    );
  }

  const resultado = await associarVideo({
    chave: args.chave,
    url: criarUrlPublica(args.chave),
    tamanho: args.tamanhoEsperado,
    tipo: args.tipo,
    nomeExibicao: args.nomeExibicao,
    enviadoEm: new Date().toISOString(),
  });
  return { ...resultado, tamanhoVerificado: cabecalho.ContentLength };
}

export async function cancelarUploadMultipartes(
  chave: string,
  uploadId: string,
): Promise<void> {
  const { cliente, ambiente } = obterClienteR2();
  await cliente.send(
    new AbortMultipartUploadCommand({
      Bucket: ambiente.R2_BUCKET_NAME,
      Key: chave,
      UploadId: uploadId,
    }),
  );
}

export async function limparUploadsIncompletos(
  maisAntigosQueMs = 7 * 24 * 60 * 60 * 1_000,
) {
  const { cliente, ambiente } = obterClienteR2();
  const limite = Date.now() - maisAntigosQueMs;
  const listagem = await cliente.send(
    new ListMultipartUploadsCommand({
      Bucket: ambiente.R2_BUCKET_NAME,
      Prefix: "filmes/",
    }),
  );
  const antigos = (listagem.Uploads ?? []).filter(
    (upload) =>
      upload.Initiated &&
      upload.Initiated.getTime() < limite &&
      upload.Key &&
      upload.UploadId,
  );
  await Promise.all(
    antigos.map((upload) =>
      cliente.send(
        new AbortMultipartUploadCommand({
          Bucket: ambiente.R2_BUCKET_NAME,
          Key: upload.Key,
          UploadId: upload.UploadId,
        }),
      ),
    ),
  );
  return antigos.length;
}
