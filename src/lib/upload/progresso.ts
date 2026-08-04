export type AmostraProgresso = {
  enviados: number;
  total: number;
  iniciadaEm: number;
  agora: number;
};

export function calcularProgresso(amostra: AmostraProgresso) {
  const enviados = Math.max(0, Math.min(amostra.enviados, amostra.total));
  const segundos = Math.max(
    (amostra.agora - amostra.iniciadaEm) / 1_000,
    0.001,
  );
  const velocidade = enviados / segundos;
  const restantes = Math.max(amostra.total - enviados, 0);

  return {
    percentual: amostra.total > 0 ? (enviados / amostra.total) * 100 : 0,
    velocidade,
    segundosRestantes: velocidade > 0 ? restantes / velocidade : null,
  };
}

export function formatarBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const unidades = ["B", "KiB", "MiB", "GiB"];
  const indice = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    unidades.length - 1,
  );
  return `${(bytes / 1024 ** indice).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${unidades[indice]}`;
}

export function formatarTempo(segundos: number | null): string {
  if (segundos === null || !Number.isFinite(segundos)) return "Calculando…";
  if (segundos < 60) return `${Math.max(1, Math.round(segundos))} s`;
  const minutos = Math.ceil(segundos / 60);
  if (minutos < 60) return `${minutos} min`;
  return `${Math.floor(minutos / 60)} h ${minutos % 60} min`;
}
