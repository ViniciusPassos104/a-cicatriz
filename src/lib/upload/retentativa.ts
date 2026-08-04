export type OpcoesRetentativa = {
  maximoTentativas?: number;
  atrasoBaseMs?: number;
  sinal?: AbortSignal;
  aoTentarNovamente?: (tentativa: number, erro: unknown) => void;
};

export async function comRetentativa<T>(
  operacao: (tentativa: number) => Promise<T>,
  opcoes: OpcoesRetentativa = {},
): Promise<T> {
  const maximo = opcoes.maximoTentativas ?? 5;
  const atrasoBase = opcoes.atrasoBaseMs ?? 500;
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= maximo; tentativa += 1) {
    if (opcoes.sinal?.aborted)
      throw new DOMException("Operação cancelada.", "AbortError");
    try {
      return await operacao(tentativa);
    } catch (erro) {
      ultimoErro = erro;
      if (tentativa === maximo || opcoes.sinal?.aborted) break;
      opcoes.aoTentarNovamente?.(tentativa + 1, erro);
      await esperar(atrasoBase * 2 ** (tentativa - 1), opcoes.sinal);
    }
  }

  throw ultimoErro;
}

function esperar(ms: number, sinal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const temporizador = setTimeout(resolve, ms);
    sinal?.addEventListener(
      "abort",
      () => {
        clearTimeout(temporizador);
        reject(new DOMException("Operação cancelada.", "AbortError"));
      },
      { once: true },
    );
  });
}
