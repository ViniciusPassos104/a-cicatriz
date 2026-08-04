import { z } from "zod";

const ambienteBaseSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.url(),
  R2_PUBLIC_BASE_URL: z.url(),
  ADMIN_PASSWORD_HASH: z.string().min(20),
  SESSION_SECRET: z.string().min(32),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export type AmbienteServidor = z.infer<typeof ambienteBaseSchema>;

export class ErroConfiguracao extends Error {
  constructor(public readonly variaveis: string[]) {
    super(
      `Configuração incompleta: preencha ${variaveis.join(", ")} no arquivo .env.local.`,
    );
    this.name = "ErroConfiguracao";
  }
}

export function lerAmbienteServidor(
  origem: NodeJS.ProcessEnv = process.env,
): AmbienteServidor {
  const resultado = ambienteBaseSchema.safeParse(origem);
  if (resultado.success) return resultado.data;

  const variaveis = [
    ...new Set(resultado.error.issues.map((item) => String(item.path[0]))),
  ];
  throw new ErroConfiguracao(variaveis);
}

export function configuracaoR2Disponivel(
  origem: NodeJS.ProcessEnv = process.env,
): boolean {
  return ambienteBaseSchema.safeParse(origem).success;
}
