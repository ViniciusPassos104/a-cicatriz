import { describe, expect, it } from "vitest";

import {
  calcularPartes,
  criarChaveSegura,
  validarVideo,
} from "@/lib/upload/arquivo";
import { TAMANHO_MAXIMO_VIDEO, TAMANHO_PARTE } from "@/lib/upload/constantes";

describe("validação do vídeo", () => {
  it("aceita MP4 válido no limite", () =>
    expect(
      validarVideo({
        nome: "filme.MP4",
        tamanho: TAMANHO_MAXIMO_VIDEO,
        tipo: "video/mp4",
      }),
    ).toMatchObject({ valido: true, extensao: "mp4" }));
  it("rejeita arquivo maior que 5 GB", () =>
    expect(
      validarVideo({
        nome: "filme.mp4",
        tamanho: TAMANHO_MAXIMO_VIDEO + 1,
        tipo: "video/mp4",
      }),
    ).toMatchObject({
      valido: false,
      mensagem: expect.stringContaining("maior que 5 GB"),
    }));
  it("rejeita MIME e extensão incompatíveis", () =>
    expect(
      validarVideo({ nome: "filme.mp4", tamanho: 100, tipo: "video/webm" }),
    ).toMatchObject({
      valido: false,
      mensagem: expect.stringContaining("não correspondem"),
    }));
});

describe("partes e chave segura", () => {
  it("divide sem ultrapassar o tamanho", () => {
    const partes = calcularPartes(TAMANHO_PARTE * 2 + 7);
    expect(partes).toHaveLength(3);
    expect(partes[2]).toEqual({
      numero: 3,
      inicio: TAMANHO_PARTE * 2,
      fim: TAMANHO_PARTE * 2 + 7,
      tamanho: 7,
    });
  });
  it("não utiliza o nome original na chave", () =>
    expect(
      criarChaveSegura(
        "filmes",
        "MP4",
        () => "123e4567-e89b-12d3-a456-426614174000",
      ),
    ).toBe("filmes/123e4567-e89b-12d3-a456-426614174000.mp4"));
});
