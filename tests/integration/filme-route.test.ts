import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { criarTokenSessao } from "@/lib/auth/sessao";
import {
  filmeInicial,
  type DadosEditaveisFilme,
  type Filme,
} from "@/types/filme";

const repositorio = vi.hoisted(() => ({
  filme: undefined as Filme | undefined,
}));

vi.mock("@/lib/r2/repositorio-filme", () => ({
  obterFilme: vi.fn(async () => repositorio.filme),
  atualizarDadosFilme: vi.fn(async (dados: DadosEditaveisFilme) => {
    repositorio.filme = {
      ...(repositorio.filme as Filme),
      ...dados,
      atualizadoEm: new Date().toISOString(),
    };
    return repositorio.filme;
  }),
  atualizarPublicacao: vi.fn(),
}));

describe("atualização pública dos dados", () => {
  const segredo = "segredo-da-sessao-do-filme-com-mais-de-trinta-e-dois";
  const csrf = "csrf-filme";
  let cookie = "";

  beforeAll(async () => {
    repositorio.filme = { ...filmeInicial, publicado: true };
    process.env.SESSION_SECRET = segredo;
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    cookie = `a_cicatriz_sessao=${await criarTokenSessao(segredo, csrf)}`;
  });

  it("faz o dado salvo aparecer na resposta pública", async () => {
    const { GET, PATCH } = await import("@/app/api/filme/route");
    const atualizados = {
      ...filmeInicial,
      titulo: "A Cicatriz — Versão final",
    };
    const requisicao = new NextRequest("http://localhost:3000/api/filme", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-csrf-token": csrf,
        cookie,
      },
      body: JSON.stringify(atualizados),
    });
    expect((await PATCH(requisicao)).status).toBe(200);
    const publica = (await (await GET()).json()) as { filme: Filme };
    expect(publica.filme.titulo).toBe("A Cicatriz — Versão final");
  });
});
