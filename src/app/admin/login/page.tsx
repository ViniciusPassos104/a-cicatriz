import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { FormularioLogin } from "@/components/admin/formulario-login";

export const metadata = {
  title: "Acesso administrativo",
  robots: { index: false, follow: false },
};

export default function LoginAdmin() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(213,44,59,.14),transparent_42%)]" />
      <section className="card-cinema relative w-full max-w-md p-7 sm:p-9">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#aaa9a6] hover:text-white"
        >
          <ArrowLeft size={16} /> Voltar ao site
        </Link>
        <ShieldCheck className="text-[#d52c3b]" size={38} />
        <p className="label-cinema mt-5">Área restrita</p>
        <h1 className="font-display mt-2 text-4xl font-bold">Administração</h1>
        <p className="mt-3 text-sm leading-6 text-[#929491]">
          Acesso exclusivo da equipe responsável pelo filme.
        </p>
        <FormularioLogin />
      </section>
    </main>
  );
}
