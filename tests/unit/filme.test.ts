import { describe, expect, it } from "vitest";

import {
  dadosEditaveisFilmeSchema,
  filmeInicial,
  filmeSchema,
} from "@/types/filme";

describe("dados do filme", () => {
  it("valida o conteúdo inicial", () =>
    expect(filmeSchema.parse(filmeInicial).titulo).toBe("A Cicatriz"));
  it("bloqueia marcação HTML em campos exibidos", () =>
    expect(() =>
      dadosEditaveisFilmeSchema.parse({ ...filmeInicial, titulo: "<script>" }),
    ).toThrow(/caracteres não permitidos/));
  it("não inventa créditos inicialmente vazios", () =>
    expect(filmeInicial.creditos.direcao).toEqual([]));
});
