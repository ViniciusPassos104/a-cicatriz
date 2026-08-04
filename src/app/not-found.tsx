import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NaoEncontrada() {
  return (
    <main className="container-site grid min-h-svh place-items-center py-20">
      <section className="text-center">
        <p className="label-cinema">Erro 404</p>
        <h1 className="font-display mt-4 text-5xl font-bold sm:text-7xl">
          Esta cena não existe.
        </h1>
        <p className="mt-5 text-[#aaa9a6]">
          A página procurada foi removida ou nunca esteve aqui.
        </p>
        <Link href="/" className="button-primary mt-8">
          <ArrowLeft size={17} /> Voltar ao início
        </Link>
      </section>
    </main>
  );
}
