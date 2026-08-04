import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/auth/login/route";
import { limparLimitesParaTeste } from "@/lib/seguranca/limite-requisicoes";

describe("login administrativo", () => {
  afterEach(() => {
    limparLimitesParaTeste();
  });
  it("cria cookie HttpOnly para senha correta", async () => {
    process.env.R2_ACCOUNT_ID = "conta";
    process.env.R2_ACCESS_KEY_ID = "acesso";
    process.env.R2_SECRET_ACCESS_KEY = "segredo-r2";
    process.env.R2_BUCKET_NAME = "bucket";
    process.env.R2_ENDPOINT = "https://conta.r2.cloudflarestorage.com";
    process.env.R2_PUBLIC_BASE_URL = "https://midia.exemplo.com";
    process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash(
      "senha-forte-de-teste",
      4,
    );
    process.env.SESSION_SECRET =
      "segredo-da-sessao-com-pelo-menos-trinta-e-dois";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ senha: "senha-forte-de-teste" }),
    });
    const resposta = await POST(request);
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("set-cookie")).toMatch(
      /a_cicatriz_sessao=.*HttpOnly.*SameSite=Strict/i,
    );
  });
  it("usa mensagem genérica para senha incorreta", async () => {
    process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash("correta", 4);
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ senha: "incorreta" }),
    });
    const resposta = await POST(request);
    expect(resposta.status).toBe(401);
    await expect(resposta.json()).resolves.toMatchObject({
      erro: "Credenciais incorretas.",
    });
  });
});
