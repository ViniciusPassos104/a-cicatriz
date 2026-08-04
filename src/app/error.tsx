"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function LimiteDeErro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Falha na interface:", error);
  }, [error]);
  return (
    <main className="container-site grid min-h-svh place-items-center py-20">
      <section
        className="card-cinema max-w-xl p-8 text-center sm:p-12"
        role="alert"
      >
        <AlertTriangle className="mx-auto text-[#e43a49]" size={48} />
        <h1 className="font-display mt-6 text-4xl font-bold">
          Algo não saiu como esperado
        </h1>
        <p className="mt-4 leading-7 text-[#aaa9a6]">
          Não foi possível carregar esta parte do site. Sua tela não perdeu
          dados enviados; tente novamente.
        </p>
        <button type="button" className="button-primary mt-8" onClick={reset}>
          <RotateCcw size={17} /> Tentar novamente
        </button>
      </section>
    </main>
  );
}
