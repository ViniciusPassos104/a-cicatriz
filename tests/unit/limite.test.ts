import { beforeEach, describe, expect, it } from "vitest";

import {
  limparLimitesParaTeste,
  verificarLimite,
} from "@/lib/seguranca/limite-requisicoes";

describe("limitação de requisições", () => {
  beforeEach(limparLimitesParaTeste);
  it("bloqueia após o máximo e libera na janela seguinte", () => {
    expect(verificarLimite("ip", 2, 1000, 0).permitido).toBe(true);
    expect(verificarLimite("ip", 2, 1000, 1).permitido).toBe(true);
    expect(verificarLimite("ip", 2, 1000, 2).permitido).toBe(false);
    expect(verificarLimite("ip", 2, 1000, 1000).permitido).toBe(true);
  });
});
