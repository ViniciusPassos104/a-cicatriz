import { ArrowLeft, Film } from "lucide-react";
import Link from "next/link";

export function SemVideo() {
  return (
    <main className="container-site grid min-h-svh place-items-center py-20">
      <section className="card-cinema max-w-xl p-8 text-center sm:p-12">
        <Film className="mx-auto text-[#d52c3b]" size={50} />
        <h1 className="font-display mt-6 text-4xl font-bold">
          O filme ainda não está disponível
        </h1>
        <p className="mt-4 leading-7 text-[#aaa9a6]">
          A exibição será liberada aqui assim que o arquivo final estiver
          publicado. Volte em breve.
        </p>
        <Link href="/" className="button-secondary mt-8">
          <ArrowLeft size={17} /> Voltar à página inicial
        </Link>
      </section>
    </main>
  );
}
