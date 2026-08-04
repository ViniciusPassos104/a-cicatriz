import { describe, expect, it } from "vitest";

import { calcularProgresso, formatarBytes } from "@/lib/upload/progresso";

describe("progresso do upload", () => {
  it("calcula percentual, velocidade e tempo restante", () => {
    const valor = calcularProgresso({
      enviados: 500,
      total: 1_000,
      iniciadaEm: 0,
      agora: 5_000,
    });
    expect(valor.percentual).toBe(50);
    expect(valor.velocidade).toBe(100);
    expect(valor.segundosRestantes).toBe(5);
  });
  it("formata bytes em português", () =>
    expect(formatarBytes(1024 * 1024)).toContain("1 MiB"));
});
