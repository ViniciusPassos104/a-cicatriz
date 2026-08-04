import { z } from "zod";

import { TAMANHO_MAXIMO_VIDEO } from "@/lib/upload/constantes";

const chaveFilme = z
  .string()
  .regex(/^filmes\/[0-9a-f-]{36}\.(mp4|webm)$/i, "Chave de arquivo inválida.");
const uploadId = z.string().min(8).max(1_024);

export const iniciarUploadSchema = z.object({
  nome: z.string().trim().min(1).max(180),
  tamanho: z.number().int().positive().max(TAMANHO_MAXIMO_VIDEO),
  tipo: z.enum(["video/mp4", "video/webm"]),
});

export const identificarUploadSchema = z.object({
  chave: chaveFilme,
  uploadId,
});

export const assinarParteSchema = identificarUploadSchema.extend({
  numeroParte: z.number().int().min(1).max(10_000),
});

export const parteConcluidaSchema = z.object({
  ETag: z.string().min(1).max(300),
  PartNumber: z.number().int().min(1).max(10_000),
});

export const concluirUploadSchema = identificarUploadSchema.extend({
  nomeExibicao: z.string().trim().min(1).max(180),
  tamanhoEsperado: z.number().int().positive().max(TAMANHO_MAXIMO_VIDEO),
  tipo: z.enum(["video/mp4", "video/webm"]),
  partes: z.array(parteConcluidaSchema).min(1).max(10_000),
});

export const imagemUploadSchema = z.object({
  tipoImagem: z.enum(["capa", "poster"]),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  tamanho: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
});

export const confirmarImagemSchema = z.object({
  tipoImagem: z.enum(["capa", "poster"]),
  chave: z.string().regex(/^(capas|posteres)\/[0-9a-f-]{36}\.(jpg|png|webp)$/i),
});

export const excluirArquivoSchema = z.discriminatedUnion("confirmacao", [
  z.object({ confirmacao: z.literal("EXCLUIR FILME") }),
  z.object({
    confirmacao: z.literal("EXCLUIR ARQUIVO ANTERIOR"),
    chave: chaveFilme,
  }),
]);
