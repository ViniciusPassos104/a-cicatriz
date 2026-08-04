import { S3Client } from "@aws-sdk/client-s3";

import {
  lerAmbienteServidor,
  type AmbienteServidor,
} from "@/lib/validacao/ambiente";

let cliente: S3Client | undefined;

export function obterClienteR2(): {
  cliente: S3Client;
  ambiente: AmbienteServidor;
} {
  const ambiente = lerAmbienteServidor();
  cliente ??= new S3Client({
    region: "auto",
    endpoint: ambiente.R2_ENDPOINT,
    credentials: {
      accessKeyId: ambiente.R2_ACCESS_KEY_ID,
      secretAccessKey: ambiente.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false,
  });
  return { cliente, ambiente };
}

export function criarUrlPublica(chave: string, base?: string): string {
  const endereco = base ?? lerAmbienteServidor().R2_PUBLIC_BASE_URL;
  return new URL(
    chave,
    endereco.endsWith("/") ? endereco : `${endereco}/`,
  ).toString();
}
