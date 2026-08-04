import {
  ArrowDown,
  BookOpen,
  Clapperboard,
  HeartHandshake,
  Play,
  Quote,
  School,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Cabecalho } from "@/components/layout/cabecalho";
import { Rodape } from "@/components/layout/rodape";
import { Revelar } from "@/components/ui/revelar";
import { obterFilme } from "@/lib/r2/repositorio-filme";
import { configuracaoFilmeLocal } from "@/lib/video-local";

export const dynamic = "force-dynamic";

function nomes(lista: string[]) {
  return lista.length ? lista.join(", ") : "A definir";
}

export default async function PaginaInicial() {
  const filme = await obterFilme();
  const maisDepressivo = configuracaoFilmeLocal("mais-depressivo");
  const resultadoFinal = configuracaoFilmeLocal("resultado-final");
  const creditos = [
    ["Direção", filme.creditos.direcao],
    ["Edição", filme.creditos.edicao],
    ["Direção de fotografia", filme.creditos.direcaoFotografia],
    ["Efeitos visuais", filme.creditos.efeitosVisuais],
  ] as const;

  return (
    <>
      <Cabecalho />
      <main>
        <section
          id="inicio"
          className="hero-mask grain relative flex min-h-[min(920px,100svh)] items-end overflow-hidden pt-24"
        >
          <Image
            src={filme.capaUrl}
            alt="Capa do filme A Cicatriz em um corredor escolar"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_32%]"
          />
          <div className="container-site relative z-10 pt-32 pb-20 sm:pb-24 lg:pb-28">
            <div className="max-w-3xl">
              <p className="label-cinema mb-5">Um curta-metragem escolar</p>
              <h1 className="font-display text-6xl leading-[.88] font-bold tracking-[-.04em] text-balance sm:text-7xl lg:text-[7.5rem]">
                A <span className="text-[#df3040]">Cicatriz</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-balance text-[#d3d0ca] sm:text-xl">
                {filme.fraseImpacto}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/assistir" className="button-primary">
                  <Play size={18} fill="currentColor" /> Assistir ao filme
                </Link>
                <Link href="#filme" className="button-secondary">
                  <BookOpen size={18} /> Conheça a história
                </Link>
              </div>
              <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#b6b3ae]">
                <div>
                  <dt className="sr-only">Ano</dt>
                  <dd>{filme.ano}</dd>
                </div>
                <div>
                  <dt className="sr-only">Duração</dt>
                  <dd>{filme.duracao}</dd>
                </div>
                <div>
                  <dt className="sr-only">Gênero</dt>
                  <dd>Drama escolar</dd>
                </div>
                <div>
                  <dt className="sr-only">Classificação</dt>
                  <dd className="rounded border border-white/25 px-2 py-0.5">
                    {filme.classificacao}
                  </dd>
                </div>
              </dl>
            </div>
            <a
              href="#filme"
              className="absolute right-2 bottom-8 hidden items-center gap-2 text-xs font-bold tracking-[.2em] text-white/55 uppercase lg:flex"
            >
              Descobrir <ArrowDown size={15} />
            </a>
          </div>
        </section>

        <section id="catalogo" className="container-site py-20 sm:py-28">
          <Revelar>
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="label-cinema">Catálogo</p>
                <h2 className="font-display mt-3 text-4xl font-bold sm:text-5xl">
                  Agora em cartaz
                </h2>
              </div>
              <p className="hidden max-w-sm text-right text-sm leading-6 text-white/45 sm:block">
                Este espaço já está preparado para receber seus próximos filmes.
              </p>
            </div>
            <div className="mt-10 flex gap-5 overflow-x-auto pb-5">
              <Link
                href="/assistir"
                className="group relative aspect-[9/14] w-[min(72vw,260px)] shrink-0 overflow-hidden rounded-xl bg-[#111318] shadow-2xl ring-1 ring-white/10 transition duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:ring-white/30"
                aria-label="Assistir A Cicatriz"
              >
                <Image
                  src={filme.posterUrl}
                  alt="Capa de A Cicatriz"
                  fill
                  sizes="260px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />
                <span className="absolute top-3 left-3 rounded bg-[#e50914] px-2 py-1 text-[10px] font-black tracking-wider uppercase shadow-lg">
                  Novo
                </span>
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-bold">A Cicatriz</p>
                    <p className="mt-1 text-xs text-white/65">
                      {filme.ano} · {filme.duracao}
                    </p>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-black shadow-xl transition group-hover:scale-110">
                    <Play size={18} fill="currentColor" />
                  </span>
                </div>
              </Link>

              {maisDepressivo ? (
                <Link
                  href="/assistir?versao=mais-depressivo"
                  className="group relative aspect-[9/14] w-[min(72vw,260px)] shrink-0 overflow-hidden rounded-xl bg-[#111318] shadow-2xl ring-1 ring-white/10 transition duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:ring-white/30"
                  aria-label="Assistir Mais Depressivo"
                >
                  <Image
                    src={filme.posterUrl}
                    alt="Capa da versão Mais Depressivo"
                    fill
                    sizes="260px"
                    className="object-cover brightness-[.55] saturate-50 transition duration-500 group-hover:scale-105 group-hover:brightness-75"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent,rgba(0,0,0,.5))]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/20" />
                  <span className="absolute top-3 left-3 rounded bg-[#7f1d2d] px-2 py-1 text-[10px] font-black tracking-wider uppercase shadow-lg">
                    Nova versão
                  </span>
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-bold">
                        {maisDepressivo.titulo}
                      </p>
                      <p className="mt-1 text-xs text-white/65">
                        Alternativa · {maisDepressivo.duracao}
                      </p>
                    </div>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-black shadow-xl transition group-hover:scale-110">
                      <Play size={18} fill="currentColor" />
                    </span>
                  </div>
                </Link>
              ) : null}

              {resultadoFinal ? (
                <Link
                  href="/assistir?versao=resultado-final"
                  className="group relative aspect-[9/14] w-[min(72vw,260px)] shrink-0 overflow-hidden rounded-xl bg-[#111318] shadow-2xl ring-1 ring-amber-200/20 transition duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:ring-amber-100/50"
                  aria-label="Assistir Resultado Final"
                >
                  <Image
                    src={filme.posterUrl}
                    alt="Capa da versão Resultado Final"
                    fill
                    sizes="260px"
                    className="object-cover contrast-110 saturate-[.85] transition duration-500 group-hover:scale-105 group-hover:saturate-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-amber-950/15" />
                  <span className="absolute top-3 left-3 rounded bg-amber-500 px-2 py-1 text-[10px] font-black tracking-wider text-black uppercase shadow-lg">
                    Versão final
                  </span>
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-bold">
                        {resultadoFinal.titulo}
                      </p>
                      <p className="mt-1 text-xs text-white/65">
                        Final · {resultadoFinal.duracao}
                      </p>
                    </div>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-black shadow-xl transition group-hover:scale-110">
                      <Play size={18} fill="currentColor" />
                    </span>
                  </div>
                </Link>
              ) : null}

              <article className="grid aspect-[9/14] w-[min(72vw,260px)] shrink-0 place-items-center rounded-xl border border-dashed border-white/15 bg-white/[.025] p-6 text-center">
                <div>
                  <Clapperboard className="mx-auto text-white/20" size={42} />
                  <h3 className="font-display mt-5 text-xl font-bold text-white/60">
                    Próxima estreia
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/35">
                    Seus novos filmes aparecerão aqui.
                  </p>
                </div>
              </article>
            </div>
          </Revelar>
        </section>

        <section id="filme" className="container-site py-24 sm:py-32">
          <Revelar className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="label-cinema">O filme</p>
              <h2 className="font-display mt-4 text-4xl leading-tight font-bold sm:text-6xl">
                Quando o sinal toca, a marca fica.
              </h2>
            </div>
            <div>
              <Quote className="mb-6 text-[#c82938]" size={38} />
              <p className="text-xl leading-[1.8] text-balance text-[#d0cec9] sm:text-2xl">
                {filme.sinopse}
              </p>
              <p className="mt-6 text-sm leading-7 text-[#8f918e]">
                {filme.categoria} · {filme.idioma}
              </p>
            </div>
          </Revelar>
        </section>

        <section className="section-line bg-[#0b0d10] py-20 sm:py-28">
          <Revelar className="container-site grid gap-10 lg:grid-cols-[1fr_.8fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="label-cinema">Conscientização</p>
              <h2 className="font-display mt-4 text-4xl font-bold sm:text-5xl">
                O silêncio também pode ferir.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[#aaa9a6]">
                Bullying não é brincadeira. Escutar, acolher e pedir ajuda são
                atos de coragem. Se você presencia uma agressão, não normalize:
                procure uma pessoa adulta de confiança e ajude a interromper o
                ciclo.
              </p>
            </div>
            <div className="card-cinema relative overflow-hidden p-8 sm:p-10">
              <div className="absolute -top-14 -right-14 size-40 rounded-full bg-[#c52433]/20 blur-3xl" />
              <HeartHandshake size={42} className="text-[#e23847]" />
              <p className="font-display mt-6 text-2xl leading-relaxed">
                “Uma palavra pode abrir uma ferida. Outra pode começar a
                curá-la.”
              </p>
            </div>
          </Revelar>
        </section>

        <section id="elenco" className="container-site py-24 sm:py-32">
          <Revelar>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="label-cinema">Em cena</p>
                <h2 className="font-display mt-3 text-4xl font-bold sm:text-6xl">
                  Elenco
                </h2>
              </div>
              <Users className="text-white/15" size={64} />
            </div>
            <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
              {filme.elenco.map((pessoa, indice) => (
                <article
                  key={pessoa}
                  className="group min-h-36 bg-[#0d0f13] p-5 transition hover:bg-[#15181e]"
                >
                  <span className="text-xs text-[#8b1f2a]">
                    {String(indice + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display mt-12 text-xl font-bold">
                    {pessoa}
                  </h3>
                </article>
              ))}
            </div>
          </Revelar>
        </section>

        <section className="section-line py-24 sm:py-32">
          <Revelar className="container-site">
            <p className="label-cinema">Por trás da história</p>
            <h2 className="font-display mt-3 max-w-xl text-4xl font-bold sm:text-5xl">
              Três ideias que atravessam o filme
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                [
                  "01",
                  "O corredor",
                  "A escola como lugar de encontros, escolhas e silêncios.",
                ],
                [
                  "02",
                  "A palavra",
                  "Aquilo que parece pequeno pode permanecer por muito tempo.",
                ],
                [
                  "03",
                  "O acolhimento",
                  "Romper o isolamento é o primeiro gesto de transformação.",
                ],
              ].map(([numero, titulo, texto], indice) => (
                <article
                  key={titulo}
                  className={`card-cinema relative min-h-80 overflow-hidden p-7 ${indice === 1 ? "md:translate-y-8" : ""}`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(213,44,59,.16),transparent_42%)]" />
                  <span className="relative text-xs font-bold tracking-[.2em] text-[#d32d3c]">
                    {numero}
                  </span>
                  <div className="absolute inset-x-7 bottom-7">
                    <h3 className="font-display text-3xl font-bold">
                      {titulo}
                    </h3>
                    <p className="mt-3 leading-7 text-[#999b98]">{texto}</p>
                  </div>
                </article>
              ))}
            </div>
          </Revelar>
        </section>

        <section
          id="creditos"
          className="section-line bg-[#0a0b0e] py-24 sm:py-32"
        >
          <Revelar className="container-site grid gap-14 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="label-cinema">Realização</p>
              <h2 className="font-display mt-3 text-4xl font-bold sm:text-6xl">
                Créditos principais
              </h2>
              <Clapperboard className="mt-10 text-[#c62a38]" size={44} />
            </div>
            <dl className="divide-y divide-white/10 border-y border-white/10">
              {creditos.map(([funcao, pessoas]) => (
                <div
                  key={funcao}
                  className="grid gap-2 py-6 sm:grid-cols-[13rem_1fr]"
                >
                  <dt className="text-sm font-bold tracking-wider text-[#888a87] uppercase">
                    {funcao}
                  </dt>
                  <dd className="text-lg">{nomes(pessoas)}</dd>
                </div>
              ))}
            </dl>
          </Revelar>
        </section>

        <section className="container-site py-24 sm:py-32">
          <Revelar className="card-cinema grid gap-10 overflow-hidden p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="label-cinema">Informações técnicas</p>
              <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">
                Uma história brasileira, contada em português.
              </h2>
              <div className="mt-8 grid gap-6 text-sm text-[#aaa9a6] sm:grid-cols-3">
                <div>
                  <School className="mb-3 text-[#d32d3c]" />
                  <strong className="block text-white">Categoria</strong>
                  {filme.categoria}
                </div>
                <div>
                  <Clapperboard className="mb-3 text-[#d32d3c]" />
                  <strong className="block text-white">Duração</strong>
                  {filme.duracao}
                </div>
                <div>
                  <BookOpen className="mb-3 text-[#d32d3c]" />
                  <strong className="block text-white">Idioma</strong>
                  {filme.idioma}
                </div>
              </div>
            </div>
            <Link href="/assistir" className="button-primary">
              <Play size={18} fill="currentColor" /> Assistir agora
            </Link>
          </Revelar>
        </section>
      </main>
      <Rodape />
    </>
  );
}
