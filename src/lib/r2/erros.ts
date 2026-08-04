import { ErroConfiguracao } from "@/lib/validacao/ambiente";

export function mensagemErroR2(erro: unknown, acao: string): string {
  if (erro instanceof ErroConfiguracao) return erro.message;
  if (erro instanceof Error && erro.name === "AbortError")
    return "A operação foi cancelada.";
  console.error(`[R2] Falha ao ${acao}.`, erro);
  return `Não foi possível ${acao}. Verifique a conexão e a configuração do R2.`;
}

export function objetoNaoEncontrado(erro: unknown): boolean {
  if (!erro || typeof erro !== "object") return false;
  const possivel = erro as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return (
    possivel.name === "NoSuchKey" || possivel.$metadata?.httpStatusCode === 404
  );
}
