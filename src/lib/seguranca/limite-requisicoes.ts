type Registro = { quantidade: number; reiniciaEm: number };

const registros = new Map<string, Registro>();

export function verificarLimite(
  chave: string,
  maximo: number,
  janelaMs: number,
  agora = Date.now(),
): { permitido: boolean; tentarNovamenteEm: number } {
  const atual = registros.get(chave);
  if (!atual || atual.reiniciaEm <= agora) {
    registros.set(chave, { quantidade: 1, reiniciaEm: agora + janelaMs });
    return { permitido: true, tentarNovamenteEm: 0 };
  }

  atual.quantidade += 1;
  return {
    permitido: atual.quantidade <= maximo,
    tentarNovamenteEm: Math.max(
      1,
      Math.ceil((atual.reiniciaEm - agora) / 1_000),
    ),
  };
}

export function limparLimitesParaTeste(): void {
  registros.clear();
}
