import { describe, expect, it, vi } from "vitest";

import { comRetentativa } from "@/lib/upload/retentativa";

describe("retentativas", () => {
  it("repete somente a operação que falhou", async () => {
    const operacao = vi
      .fn()
      .mockRejectedValueOnce(new Error("falhou"))
      .mockRejectedValueOnce(new Error("falhou"))
      .mockResolvedValue("ok");
    await expect(
      comRetentativa(operacao, { maximoTentativas: 5, atrasoBaseMs: 1 }),
    ).resolves.toBe("ok");
    expect(operacao).toHaveBeenCalledTimes(3);
  });
  it("respeita o máximo de cinco tentativas", async () => {
    const operacao = vi.fn().mockRejectedValue(new Error("falhou"));
    await expect(
      comRetentativa(operacao, { maximoTentativas: 5, atrasoBaseMs: 1 }),
    ).rejects.toThrow("falhou");
    expect(operacao).toHaveBeenCalledTimes(5);
  });
});
