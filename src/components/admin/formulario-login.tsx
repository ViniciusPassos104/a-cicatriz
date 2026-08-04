"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function FormularioLogin() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const dados = (await resposta.json()) as { erro?: string; csrf?: string };
      if (!resposta.ok)
        throw new Error(dados.erro ?? "Não foi possível entrar.");
      if (dados.csrf) sessionStorage.setItem("a-cicatriz-csrf", dados.csrf);
      router.replace("/admin");
      router.refresh();
    } catch (falha) {
      setErro(
        falha instanceof Error ? falha.message : "Não foi possível entrar.",
      );
    } finally {
      setEnviando(false);
    }
  };
  return (
    <form onSubmit={(e) => void enviar(e)} className="mt-8" noValidate>
      <label htmlFor="senha" className="field-label">
        Senha administrativa
      </label>
      <div className="relative">
        <LockKeyhole
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/35"
          size={18}
        />
        <input
          id="senha"
          type={mostrar ? "text" : "password"}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          required
          maxLength={256}
          className="input-cinema pr-12 pl-10"
          aria-describedby={erro ? "erro-login" : undefined}
        />
        <button
          type="button"
          className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg hover:bg-white/5"
          aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setMostrar((v) => !v)}
        >
          {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {erro ? (
        <p id="erro-login" className="mt-3 text-sm text-red-300" role="alert">
          {erro}
        </p>
      ) : null}
      <button
        type="submit"
        className="button-primary mt-6 w-full"
        disabled={enviando || !senha}
      >
        {enviando ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : (
          <LockKeyhole size={18} />
        )}{" "}
        {enviando ? "Entrando…" : "Entrar no painel"}
      </button>
    </form>
  );
}
