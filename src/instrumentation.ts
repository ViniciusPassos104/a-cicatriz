import { configuracaoR2Disponivel } from "@/lib/validacao/ambiente";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && !configuracaoR2Disponivel()) {
    console.warn(
      "[Configuração] R2 ou autenticação incompletos. O site público usará os dados iniciais; o painel só funcionará após preencher .env.local.",
    );
  }
}
