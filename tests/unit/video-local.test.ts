import { describe, expect, it } from "vitest";

import {
  interpretarIntervalo,
  qualidadeVideoLocal,
  versaoVideoLocal,
} from "@/lib/video-local";

describe("intervalos do vídeo local", () => {
  it("interpreta um intervalo aberto", () => {
    expect(interpretarIntervalo("bytes=100-", 1_000)).toEqual({
      inicio: 100,
      fim: 999,
    });
  });

  it("limita o fim ao tamanho do arquivo", () => {
    expect(interpretarIntervalo("bytes=0-9999", 1_000)).toEqual({
      inicio: 0,
      fim: 999,
    });
  });

  it("aceita solicitação dos últimos bytes", () => {
    expect(interpretarIntervalo("bytes=-100", 1_000)).toEqual({
      inicio: 900,
      fim: 999,
    });
  });

  it("rejeita intervalo fora do arquivo", () => {
    expect(interpretarIntervalo("bytes=1000-1200", 1_000)).toBeNull();
  });

  it("aceita somente as qualidades cadastradas", () => {
    expect(qualidadeVideoLocal("1080p")).toBe("1080p");
    expect(qualidadeVideoLocal("720p")).toBe("720p");
    expect(qualidadeVideoLocal("../../segredo")).toBeNull();
    expect(qualidadeVideoLocal("2160p", "mais-depressivo")).toBeNull();
    expect(qualidadeVideoLocal("1080p", "mais-depressivo")).toBe("1080p");
    expect(qualidadeVideoLocal("2160p", "resultado-final")).toBeNull();
    expect(qualidadeVideoLocal("720p", "resultado-final")).toBe("720p");
  });

  it("aceita somente as versões cadastradas", () => {
    expect(versaoVideoLocal("mais-depressivo")).toBe("mais-depressivo");
    expect(versaoVideoLocal("resultado-final")).toBe("resultado-final");
    expect(versaoVideoLocal(null)).toBe("a-cicatriz");
    expect(versaoVideoLocal("arquivo-secreto")).toBeNull();
  });
});
