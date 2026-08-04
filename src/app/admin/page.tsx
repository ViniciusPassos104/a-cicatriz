import type { Metadata } from "next";

import { PainelAdmin } from "@/components/admin/painel-admin";
import { exigirSessaoPagina } from "@/lib/auth/sessao";
import { obterFilme } from "@/lib/r2/repositorio-filme";

export const metadata: Metadata = {
  title: "Painel administrativo",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function Administracao() {
  const [sessao, filme] = await Promise.all([
    exigirSessaoPagina(),
    obterFilme(),
  ]);
  return <PainelAdmin inicial={filme} csrf={sessao.csrf} />;
}
