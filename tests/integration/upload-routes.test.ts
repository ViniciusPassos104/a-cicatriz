import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { criarTokenSessao } from "@/lib/auth/sessao";

const mocks = vi.hoisted(() => ({
  iniciar: vi.fn(),
  assinar: vi.fn(),
  listar: vi.fn(),
  concluir: vi.fn(),
  cancelar: vi.fn(),
}));
vi.mock("@/lib/r2/multipartes", () => ({
  iniciarUploadMultipartes: mocks.iniciar,
  assinarParte: mocks.assinar,
  listarPartes: mocks.listar,
  concluirUploadMultipartes: mocks.concluir,
  cancelarUploadMultipartes: mocks.cancelar,
}));

describe("rotas do upload multipartes", () => {
  const segredo = "segredo-da-sessao-de-integracao-com-32-caracteres";
  const csrf = "csrf-integracao";
  let cookie = "";
  beforeAll(async () => {
    process.env.SESSION_SECRET = segredo;
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    cookie = `a_cicatriz_sessao=${await criarTokenSessao(segredo, csrf)}`;
  });
  const request = (rota: string, corpo: unknown, autenticado = true) =>
    new NextRequest(`http://localhost:3000${rota}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-csrf-token": csrf,
        ...(autenticado ? { cookie } : {}),
      },
      body: JSON.stringify(corpo),
    });
  it("rejeita usuário não autenticado", async () => {
    const { POST } = await import("@/app/api/upload/iniciar/route");
    expect(
      (
        await POST(
          request(
            "/api/upload/iniciar",
            { nome: "filme.mp4", tamanho: 100, tipo: "video/mp4" },
            false,
          ),
        )
      ).status,
    ).toBe(401);
  });
  it("inicia upload validado", async () => {
    mocks.iniciar.mockResolvedValue({
      uploadId: "upload-123456",
      chave: "filmes/123e4567-e89b-12d3-a456-426614174000.mp4",
      tamanhoParte: 10,
    });
    const { POST } = await import("@/app/api/upload/iniciar/route");
    expect(
      (
        await POST(
          request("/api/upload/iniciar", {
            nome: "filme.mp4",
            tamanho: 100,
            tipo: "video/mp4",
          }),
        )
      ).status,
    ).toBe(200);
    expect(mocks.iniciar).toHaveBeenCalled();
  });
  it("assina parte", async () => {
    mocks.assinar.mockResolvedValue("https://r2.exemplo/assinada");
    const { POST } = await import("@/app/api/upload/assinar-parte/route");
    const r = await POST(
      request("/api/upload/assinar-parte", {
        chave: "filmes/123e4567-e89b-12d3-a456-426614174000.mp4",
        uploadId: "upload-123456",
        numeroParte: 1,
      }),
    );
    expect(r.status).toBe(200);
  });
  it("lista partes", async () => {
    mocks.listar.mockResolvedValue([{ ETag: "etag", PartNumber: 1 }]);
    const { POST } = await import("@/app/api/upload/listar-partes/route");
    const r = await POST(
      request("/api/upload/listar-partes", {
        chave: "filmes/123e4567-e89b-12d3-a456-426614174000.mp4",
        uploadId: "upload-123456",
      }),
    );
    expect(r.status).toBe(200);
  });
  it("conclui upload", async () => {
    mocks.concluir.mockResolvedValue({ tamanhoVerificado: 100 });
    const { POST } = await import("@/app/api/upload/concluir/route");
    const r = await POST(
      request("/api/upload/concluir", {
        chave: "filmes/123e4567-e89b-12d3-a456-426614174000.mp4",
        uploadId: "upload-123456",
        nomeExibicao: "filme.mp4",
        tamanhoEsperado: 100,
        tipo: "video/mp4",
        partes: [{ ETag: "etag", PartNumber: 1 }],
      }),
    );
    expect(r.status).toBe(200);
  });
  it("cancela upload", async () => {
    mocks.cancelar.mockResolvedValue(undefined);
    const { POST } = await import("@/app/api/upload/cancelar/route");
    const r = await POST(
      request("/api/upload/cancelar", {
        chave: "filmes/123e4567-e89b-12d3-a456-426614174000.mp4",
        uploadId: "upload-123456",
      }),
    );
    expect(r.status).toBe(200);
    expect(mocks.cancelar).toHaveBeenCalled();
  });
});
