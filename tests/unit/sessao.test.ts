import { describe, expect, it } from "vitest";

import {
  criarTokenSessao,
  tokenCsrfValido,
  validarTokenSessao,
} from "@/lib/auth/sessao";

describe("sessão administrativa", () => {
  const segredo = "segredo-de-teste-com-mais-de-trinta-e-dois-caracteres";
  it("cria e valida uma sessão assinada", async () => {
    const token = await criarTokenSessao(segredo, "csrf-seguro");
    await expect(validarTokenSessao(token, segredo)).resolves.toEqual({
      csrf: "csrf-seguro",
    });
  });
  it("rejeita segredo diferente", async () => {
    const token = await criarTokenSessao(segredo, "csrf");
    await expect(
      validarTokenSessao(token, `${segredo}-outro`),
    ).resolves.toBeNull();
  });
  it("compara CSRF sem comparação textual insegura", () => {
    expect(tokenCsrfValido("abc", "abc")).toBe(true);
    expect(tokenCsrfValido("abc", "abd")).toBe(false);
  });
});
