import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { obterClienteR2 } from "@/lib/r2/cliente";
import { criarChaveSegura } from "@/lib/upload/arquivo";
import { TAMANHO_MAXIMO_IMAGEM } from "@/lib/upload/constantes";

const tipos = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export async function assinarUploadImagem(args: {
  tipoImagem: "capa" | "poster";
  contentType: string;
  tamanho: number;
}) {
  if (!(args.contentType in tipos))
    throw new Error("Formato de imagem incompatível. Use JPG, PNG ou WebP.");
  if (
    !Number.isSafeInteger(args.tamanho) ||
    args.tamanho <= 0 ||
    args.tamanho > TAMANHO_MAXIMO_IMAGEM
  ) {
    throw new Error("A imagem deve ter no máximo 10 MiB.");
  }

  const extensao = tipos[args.contentType as keyof typeof tipos];
  const chave = criarChaveSegura(
    args.tipoImagem === "capa" ? "capas" : "posteres",
    extensao,
  );
  const { cliente, ambiente } = obterClienteR2();
  const comando = new PutObjectCommand({
    Bucket: ambiente.R2_BUCKET_NAME,
    Key: chave,
    ContentType: args.contentType,
    ContentLength: args.tamanho,
    CacheControl: "public, max-age=31536000, immutable",
  });
  const url = await getSignedUrl(cliente, comando, { expiresIn: 10 * 60 });
  return { url, chave };
}
