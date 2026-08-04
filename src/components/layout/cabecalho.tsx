"use client";

import { Menu, Play, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  ["Início", "#inicio"],
  ["Catálogo", "#catalogo"],
  ["O Filme", "#filme"],
  ["Elenco", "#elenco"],
  ["Créditos", "#creditos"],
  ["Assistir", "/assistir"],
] as const;

export function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const [rolado, setRolado] = useState(false);

  useEffect(() => {
    const atualizar = () => setRolado(window.scrollY > 24);
    atualizar();
    window.addEventListener("scroll", atualizar, { passive: true });
    return () => window.removeEventListener("scroll", atualizar);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition ${rolado || aberto ? "bg-[#07080af2] shadow-2xl backdrop-blur-xl" : "bg-transparent"}`}
    >
      <div className="container-site flex min-h-20 items-center justify-between gap-6">
        <Link
          href="/#inicio"
          className="font-display text-lg font-bold tracking-[.2em]"
          aria-label="A Cicatriz — página inicial"
        >
          A <span className="text-[#e13747]">CICATRIZ</span>
        </Link>
        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Navegação principal"
        >
          {links.map(([rotulo, href]) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-semibold text-[#ccc9c3] transition hover:text-white"
            >
              {rotulo}
            </Link>
          ))}
        </nav>
        <Link href="/assistir" className="button-primary hidden md:inline-flex">
          <Play size={16} fill="currentColor" /> Assistir agora
        </Link>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full border border-white/15 md:hidden"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
          onClick={() => setAberto((valor) => !valor)}
        >
          {aberto ? <X /> : <Menu />}
        </button>
      </div>
      {aberto ? (
        <nav
          className="container-site grid gap-1 border-t border-white/10 py-3 md:hidden"
          aria-label="Navegação para celular"
        >
          {links.map(([rotulo, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setAberto(false)}
              className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-white/5"
            >
              {rotulo}
            </Link>
          ))}
          <Link
            href="/assistir"
            onClick={() => setAberto(false)}
            className="button-primary mt-2"
          >
            <Play size={16} fill="currentColor" /> Assistir agora
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
