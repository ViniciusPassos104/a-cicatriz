import { expect, test } from "@playwright/test";

const errosPorPagina = new WeakMap<object, string[]>();

test.beforeEach(async ({ page }) => {
  const erros: string[] = [];
  errosPorPagina.set(page, erros);
  page.on("console", (mensagem) => {
    if (mensagem.type() === "error") erros.push(mensagem.text());
  });
  page.on("pageerror", (erro) => erros.push(erro.message));
});

test.afterEach(async ({ page }) => {
  expect(
    errosPorPagina.get(page) ?? [],
    "O navegador não deve registrar erros",
  ).toEqual([]);
});

test("página inicial abre e navega", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /A Cicatriz/i, level: 1 }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Conheça a história" }).click();
  await expect(
    page.getByRole("heading", { name: /Quando o sinal toca/i }),
  ).toBeVisible();
});
test("área administrativa exige login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(
    page.getByRole("heading", { name: "Administração" }),
  ).toBeVisible();
});
test("player disponibiliza o filme local com intervalos de bytes", async ({
  page,
}) => {
  const intervalo = await page.request.get("/api/video-local", {
    headers: { Range: "bytes=0-1023" },
  });
  expect(intervalo.status()).toBe(206);
  expect(intervalo.headers()["content-range"]).toMatch(
    /^bytes 0-1023\/3346838794$/,
  );
  expect((await intervalo.body()).byteLength).toBe(1024);
  await page.goto("/assistir");
  await expect(page.locator("video")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reproduzir" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Baixar A Cicatriz/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Qualidade:/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Velocidade:/i }),
  ).toBeVisible();
});
test("catálogo abre a versão Mais Depressivo", async ({ page }) => {
  const intervalo = await page.request.get(
    "/api/video-local?versao=mais-depressivo&qualidade=1080p",
    { headers: { Range: "bytes=0-1023" } },
  );
  expect(intervalo.status()).toBe(206);
  expect(intervalo.headers()["content-range"]).toBe("bytes 0-1023/1056112592");

  await page.goto("/assistir?versao=mais-depressivo");
  await expect(
    page.getByLabel("Reprodutor do filme Mais Depressivo"),
  ).toBeVisible();
  await expect(
    page.getByText("Mais Depressivo", { exact: true }),
  ).toBeVisible();
});
test("catálogo abre Resultado Final", async ({ page }) => {
  const intervalo = await page.request.get(
    "/api/video-local?versao=resultado-final&qualidade=1080p",
    { headers: { Range: "bytes=0-1023" } },
  );
  expect(intervalo.status()).toBe(206);
  expect(intervalo.headers()["content-range"]).toBe("bytes 0-1023/904927386");

  await page.goto("/assistir?versao=resultado-final");
  await expect(
    page.getByLabel("Reprodutor do filme Resultado Final"),
  ).toBeVisible();
  await expect(
    page.getByText("Resultado Final", { exact: true }),
  ).toBeVisible();
});
test("layout responde à largura disponível", async ({ page }) => {
  await page.goto("/");
  const largura = page.viewportSize()?.width ?? 1280;
  if (largura < 768) {
    await expect(
      page.getByRole("button", { name: "Abrir menu" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Navegação para celular" }),
    ).toBeVisible();
  } else {
    await expect(
      page.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeVisible();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
