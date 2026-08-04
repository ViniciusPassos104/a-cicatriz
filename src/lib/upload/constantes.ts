export const TAMANHO_MAXIMO_VIDEO = 5_000_000_000;
export const TAMANHO_PARTE = 64 * 1024 * 1024;
export const CONCORRENCIA_UPLOAD = 3;
export const MAXIMO_TENTATIVAS_PARTE = 5;
export const TIPOS_VIDEO = ["video/mp4", "video/webm"] as const;
export const EXTENSOES_VIDEO = ["mp4", "webm"] as const;
export const TAMANHO_MAXIMO_IMAGEM = 10 * 1024 * 1024;

export type TipoVideo = (typeof TIPOS_VIDEO)[number];
