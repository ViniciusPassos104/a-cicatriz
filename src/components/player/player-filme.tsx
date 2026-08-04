"use client";

import {
  ArrowLeft,
  Captions,
  Check,
  Download,
  Expand,
  Gauge,
  LoaderCircle,
  Minimize,
  Pause,
  PictureInPicture,
  Play,
  RotateCcw,
  RotateCw,
  Settings2,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type FontePlayer = {
  id: string;
  rotulo: string;
  resolucao: number;
  url: string;
  downloadUrl?: string;
};

type Props = {
  titulo: string;
  fontes: FontePlayer[];
  poster: string;
  legendaUrl: string | null;
};

type MenuAberto = "velocidade" | "qualidade" | null;

type EstadoTroca = {
  tempo: number;
  tocando: boolean;
};

function tempo(valor: number) {
  if (!Number.isFinite(valor)) return "0:00";
  const horas = Math.floor(valor / 3600);
  const minutos = Math.floor((valor % 3600) / 60);
  const segundos = Math.floor(valor % 60);
  return horas > 0
    ? `${horas}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`
    : `${minutos}:${String(segundos).padStart(2, "0")}`;
}

function fonteInicial(fontes: FontePlayer[]): FontePlayer {
  const primeira = fontes[0];
  if (!primeira) throw new Error("O player precisa de ao menos uma fonte.");
  return (
    fontes.find((fonte) => fonte.resolucao === 1080) ??
    fontes.find((fonte) => fonte.resolucao === 720) ??
    primeira
  );
}

function escolherFonteAutomatica(fontes: FontePlayer[]): FontePlayer {
  const primeira = fontes[0];
  if (!primeira) throw new Error("O player precisa de ao menos uma fonte.");
  const conexao = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;
  const conexaoLenta =
    conexao?.saveData ||
    ["slow-2g", "2g", "3g"].includes(conexao?.effectiveType ?? "");
  const alvo =
    conexaoLenta || window.innerWidth < 640
      ? 720
      : Math.min(
          2160,
          Math.max(720, window.innerHeight * window.devicePixelRatio),
        );
  const ordenadas = [...fontes].sort((a, b) => a.resolucao - b.resolucao);
  return (
    ordenadas.find((fonte) => fonte.resolucao >= alvo) ??
    ordenadas.at(-1) ??
    primeira
  );
}

function definirModoLegenda(faixa: TextTrack, ativar: boolean) {
  faixa.mode = ativar ? "showing" : "hidden";
}

export function PlayerFilme({ titulo, fontes, poster, legendaUrl }: Props) {
  const inicial = useMemo(() => fonteInicial(fontes), [fontes]);
  const chaveProgresso = useMemo(() => {
    if (titulo === "A Cicatriz") return "a-cicatriz-posicao";
    return `a-cicatriz-posicao:${titulo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`;
  }, [titulo]);
  const video = useRef<HTMLVideoElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  const primeiraReproducao = useRef(true);
  const ultimoVolume = useRef(1);
  const temporizadorControles = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const estadoTroca = useRef<EstadoTroca | null>(null);
  const [fonteAtiva, setFonteAtiva] = useState(inicial);
  const [qualidade, setQualidade] = useState("auto");
  const [tocando, setTocando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atual, setAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [bufferizado, setBufferizado] = useState(0);
  const [volume, setVolume] = useState(1);
  const [velocidade, setVelocidade] = useState(1);
  const [retomar, setRetomar] = useState<number | null>(null);
  const [previsao, setPrevisao] = useState<{
    posicao: number;
    tempo: number;
  } | null>(null);
  const [controlesVisiveis, setControlesVisiveis] = useState(true);
  const [menu, setMenu] = useState<MenuAberto>(null);
  const [telaCheia, setTelaCheia] = useState(false);
  const [legendasAtivas, setLegendasAtivas] = useState(false);

  const esconderControlesDepois = useCallback(() => {
    if (temporizadorControles.current)
      clearTimeout(temporizadorControles.current);
    if (!video.current?.paused && !menu) {
      temporizadorControles.current = setTimeout(
        () => setControlesVisiveis(false),
        2_700,
      );
    }
  }, [menu]);

  const mostrarControles = useCallback(() => {
    setControlesVisiveis(true);
    esconderControlesDepois();
  }, [esconderControlesDepois]);

  const alternar = useCallback(async () => {
    const elemento = video.current;
    if (!elemento) return;
    try {
      if (elemento.paused) {
        if (primeiraReproducao.current) {
          elemento.muted = false;
          elemento.volume = 1;
          primeiraReproducao.current = false;
        }
        await elemento.play();
      } else {
        elemento.pause();
      }
    } catch {
      setErro(
        "Não foi possível iniciar a reprodução. Atualize a página e tente novamente.",
      );
    }
  }, []);

  const saltar = useCallback((segundos: number) => {
    const elemento = video.current;
    if (!elemento) return;
    elemento.currentTime = Math.max(
      0,
      Math.min(elemento.duration || 0, elemento.currentTime + segundos),
    );
    setAtual(elemento.currentTime);
  }, []);

  const alternarMudo = useCallback(() => {
    const elemento = video.current;
    if (!elemento) return;
    if (elemento.muted || elemento.volume === 0) {
      elemento.muted = false;
      elemento.volume = ultimoVolume.current || 1;
    } else {
      ultimoVolume.current = elemento.volume;
      elemento.muted = true;
    }
  }, []);

  const alternarTelaCheia = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await contenedor.current?.requestFullscreen();
    } catch {
      setErro("O navegador não permitiu abrir a tela cheia.");
    }
  }, []);

  const abrirPictureInPicture = useCallback(async () => {
    const elemento = video.current;
    if (!elemento || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement)
        await document.exitPictureInPicture();
      else await elemento.requestPictureInPicture();
    } catch {
      setErro("O modo de miniplayer não está disponível neste navegador.");
    }
  }, []);

  const trocarFonte = useCallback(
    (novaFonte: FontePlayer, novaQualidade: string) => {
      const elemento = video.current;
      setQualidade(novaQualidade);
      setMenu(null);
      if (novaFonte.id === fonteAtiva.id) return;
      estadoTroca.current = {
        tempo: elemento?.currentTime ?? atual,
        tocando: elemento ? !elemento.paused : tocando,
      };
      setCarregando(true);
      setErro(null);
      setFonteAtiva(novaFonte);
    },
    [atual, fonteAtiva.id, tocando],
  );

  const selecionarQualidade = useCallback(
    (valor: string) => {
      const novaFonte =
        valor === "auto"
          ? escolherFonteAutomatica(fontes)
          : fontes.find((fonte) => fonte.id === valor);
      if (novaFonte) trocarFonte(novaFonte, valor);
    },
    [fontes, trocarFonte],
  );

  useEffect(() => {
    const quadro = window.requestAnimationFrame(() => {
      if (qualidade !== "auto") return;
      const automatica = escolherFonteAutomatica(fontes);
      if (automatica.id !== fonteAtiva.id) trocarFonte(automatica, "auto");
    });
    return () => window.cancelAnimationFrame(quadro);
  }, [fonteAtiva.id, fontes, qualidade, trocarFonte]);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (
        ["INPUT", "SELECT", "TEXTAREA"].includes(
          (evento.target as HTMLElement).tagName,
        )
      )
        return;
      const tecla = evento.key.toLowerCase();
      if (evento.code === "Space" || tecla === "k") {
        evento.preventDefault();
        void alternar();
      }
      if (evento.key === "ArrowLeft" || tecla === "j") saltar(-10);
      if (evento.key === "ArrowRight" || tecla === "l") saltar(10);
      if (evento.key === "ArrowUp" && video.current) {
        evento.preventDefault();
        video.current.muted = false;
        video.current.volume = Math.min(1, video.current.volume + 0.05);
      }
      if (evento.key === "ArrowDown" && video.current) {
        evento.preventDefault();
        video.current.volume = Math.max(0, video.current.volume - 0.05);
      }
      if (tecla === "m") alternarMudo();
      if (tecla === "f") void alternarTelaCheia();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [alternar, alternarMudo, alternarTelaCheia, saltar]);

  useEffect(() => {
    const atualizar = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", atualizar);
    return () => document.removeEventListener("fullscreenchange", atualizar);
  }, []);

  useEffect(() => {
    const salvar = window.setInterval(() => {
      if (video.current && video.current.currentTime > 5)
        localStorage.setItem(chaveProgresso, String(video.current.currentTime));
    }, 5_000);
    return () => clearInterval(salvar);
  }, [chaveProgresso]);

  useEffect(
    () => () => {
      if (temporizadorControles.current)
        clearTimeout(temporizadorControles.current);
    },
    [],
  );

  const metadados = async () => {
    const elemento = video.current;
    if (!elemento) return;
    setDuracao(elemento.duration);
    setCarregando(false);

    const troca = estadoTroca.current;
    if (troca) {
      elemento.currentTime = Math.min(troca.tempo, elemento.duration - 0.1);
      elemento.playbackRate = velocidade;
      estadoTroca.current = null;
      if (troca.tocando) await elemento.play().catch(() => undefined);
      return;
    }

    const salva = Number(localStorage.getItem(chaveProgresso));
    if (Number.isFinite(salva) && salva > 15 && salva < elemento.duration - 30)
      setRetomar(salva);
  };

  const atualizarTempo = (elemento: HTMLVideoElement) => {
    setAtual(elemento.currentTime);
    if (elemento.buffered.length && Number.isFinite(elemento.duration)) {
      const fim = elemento.buffered.end(elemento.buffered.length - 1);
      setBufferizado((fim / elemento.duration) * 100);
    }
  };

  const alterarVolume = (valor: number) => {
    const elemento = video.current;
    if (!elemento) return;
    elemento.muted = false;
    elemento.volume = valor;
    if (valor > 0) ultimoVolume.current = valor;
  };

  const alternarLegendas = () => {
    const faixa = video.current?.textTracks[0];
    if (!faixa) return;
    const ativar = faixa.mode !== "showing";
    definirModoLegenda(faixa, ativar);
    setLegendasAtivas(ativar);
  };

  const porcentagem = duracao ? (atual / duracao) * 100 : 0;
  const VolumeIcone = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const controlesAbertos = controlesVisiveis || !tocando || Boolean(menu);
  const estiloProgresso = {
    "--progresso": `${porcentagem}%`,
    "--bufferizado": `${Math.max(porcentagem, bufferizado)}%`,
  } as CSSProperties;

  return (
    <div
      ref={contenedor}
      className="player-shell relative flex h-svh min-h-[420px] w-full overflow-hidden bg-black text-white select-none"
      onPointerMove={mostrarControles}
      onPointerDown={mostrarControles}
      onMouseLeave={esconderControlesDepois}
      onContextMenu={(evento) => evento.preventDefault()}
    >
      <video
        ref={video}
        className="h-full w-full bg-black object-contain"
        src={fonteAtiva.url}
        poster={poster}
        preload="metadata"
        playsInline
        onClick={() => void alternar()}
        onDoubleClick={() => void alternarTelaCheia()}
        onLoadedMetadata={() => void metadados()}
        onCanPlay={() => setCarregando(false)}
        onWaiting={() => setCarregando(true)}
        onSeeking={() => setCarregando(true)}
        onSeeked={() => setCarregando(false)}
        onPlaying={() => {
          setTocando(true);
          setCarregando(false);
          esconderControlesDepois();
        }}
        onPause={() => {
          setTocando(false);
          setControlesVisiveis(true);
        }}
        onTimeUpdate={(evento) => atualizarTempo(evento.currentTarget)}
        onProgress={(evento) => atualizarTempo(evento.currentTarget)}
        onVolumeChange={(evento) =>
          setVolume(
            evento.currentTarget.muted ? 0 : evento.currentTarget.volume,
          )
        }
        onEnded={() => {
          localStorage.removeItem(chaveProgresso);
          setTocando(false);
          setControlesVisiveis(true);
        }}
        onError={() => {
          setCarregando(false);
          setErro(
            "Falha na reprodução desta qualidade. Selecione outra qualidade e tente novamente.",
          );
        }}
        aria-label={`Reprodutor do filme ${titulo}`}
      >
        {legendaUrl ? (
          <track
            kind="subtitles"
            src={legendaUrl}
            srcLang="pt-BR"
            label="Português"
          />
        ) : null}
        Seu navegador não consegue reproduzir este vídeo.
      </video>

      <div
        className={`pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/75 via-transparent to-black/90 transition-opacity duration-300 ${controlesAbertos ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`absolute inset-x-0 top-0 z-20 flex items-center gap-4 p-4 transition-all duration-300 sm:p-6 ${controlesAbertos ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"}`}
      >
        <Link
          href="/"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-black/35 backdrop-blur transition hover:bg-white/15"
          aria-label="Voltar ao catálogo"
        >
          <ArrowLeft />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-base font-bold drop-shadow sm:text-lg">
            {titulo}
          </p>
          <p className="text-xs text-white/60">
            {fonteAtiva.rotulo} · {fonteAtiva.resolucao}p
          </p>
        </div>
      </div>

      {carregando && !erro ? (
        <div
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
          role="status"
          aria-label="Carregando o vídeo"
        >
          <LoaderCircle className="size-12 animate-spin drop-shadow-xl" />
        </div>
      ) : null}

      {!tocando && !carregando && !erro && retomar === null ? (
        <button
          type="button"
          onClick={() => void alternar()}
          className="absolute top-1/2 left-1/2 z-20 grid size-20 -translate-1/2 place-items-center rounded-full bg-white text-black shadow-2xl transition hover:scale-105 sm:size-24"
          aria-label="Reproduzir"
        >
          <Play className="ml-1 size-9 sm:size-11" fill="currentColor" />
        </button>
      ) : null}

      {erro ? (
        <div className="absolute inset-4 z-40 grid place-items-center">
          <div
            className="glass max-w-xl rounded-2xl p-7 text-center"
            role="alert"
          >
            <h2 className="text-2xl font-bold">Não foi possível reproduzir</h2>
            <p className="mt-3 leading-7 text-[#ccc9c3]">{erro}</p>
            <button
              type="button"
              className="button-primary mt-6"
              onClick={() => {
                setErro(null);
                video.current?.load();
              }}
            >
              <RotateCw size={17} /> Tentar novamente
            </button>
          </div>
        </div>
      ) : null}

      {retomar !== null ? (
        <div
          className="absolute top-1/2 left-1/2 z-40 w-[min(92%,30rem)] -translate-1/2 rounded-2xl border border-white/15 bg-[#101216]/95 p-6 shadow-2xl backdrop-blur"
          role="dialog"
          aria-label="Continuar reprodução"
        >
          <p className="text-lg font-bold">Continuar de onde você parou?</p>
          <p className="mt-1 text-sm text-[#aaa9a6]">
            Você parou em {tempo(retomar)}.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="button-primary min-h-10 px-4 py-2"
              onClick={() => {
                if (video.current) video.current.currentTime = retomar;
                setRetomar(null);
                void alternar();
              }}
            >
              Continuar
            </button>
            <button
              className="button-secondary min-h-10 px-4 py-2"
              onClick={() => {
                localStorage.removeItem(chaveProgresso);
                if (video.current) video.current.currentTime = 0;
                setRetomar(null);
                void alternar();
              }}
            >
              Começar do início
            </button>
          </div>
        </div>
      ) : null}

      {menu ? (
        <div
          className="absolute right-3 bottom-24 z-40 w-64 overflow-hidden rounded-xl border border-white/15 bg-[#151515]/98 p-2 shadow-2xl backdrop-blur-xl sm:right-6 sm:bottom-28"
          role="menu"
          aria-label={menu === "qualidade" ? "Qualidade" : "Velocidade"}
        >
          <p className="px-3 py-2 text-xs font-bold tracking-wider text-white/55 uppercase">
            {menu === "qualidade" ? "Qualidade do vídeo" : "Velocidade"}
          </p>
          {menu === "qualidade" ? (
            <>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={qualidade === "auto"}
                className="player-menu-item"
                onClick={() => selecionarQualidade("auto")}
              >
                <span>
                  Automática
                  <small>{fonteAtiva.rotulo}</small>
                </span>
                {qualidade === "auto" ? <Check size={18} /> : null}
              </button>
              {fontes.map((fonte) => (
                <button
                  key={fonte.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={qualidade === fonte.id}
                  className="player-menu-item"
                  onClick={() => selecionarQualidade(fonte.id)}
                >
                  <span>
                    {fonte.rotulo}
                    <small>{fonte.resolucao}p</small>
                  </span>
                  {qualidade === fonte.id ? <Check size={18} /> : null}
                </button>
              ))}
            </>
          ) : (
            [0.5, 0.75, 1, 1.25, 1.5, 2].map((valor) => (
              <button
                key={valor}
                type="button"
                role="menuitemradio"
                aria-checked={velocidade === valor}
                className="player-menu-item"
                onClick={() => {
                  setVelocidade(valor);
                  if (video.current) video.current.playbackRate = valor;
                  setMenu(null);
                }}
              >
                <span>{valor === 1 ? "Normal" : `${valor}×`}</span>
                {velocidade === valor ? <Check size={18} /> : null}
              </button>
            ))
          )}
        </div>
      ) : null}

      <div
        className={`absolute inset-x-0 bottom-0 z-30 px-3 pb-3 transition-all duration-300 sm:px-6 sm:pb-5 ${controlesAbertos ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
        onClick={() => setMenu(null)}
      >
        <div className="group/progress relative flex h-6 items-center">
          {previsao ? (
            <span
              className="pointer-events-none absolute bottom-6 z-20 -translate-x-1/2 rounded bg-black/95 px-2 py-1 text-xs font-bold tabular-nums shadow-xl"
              style={{ left: previsao.posicao }}
            >
              {tempo(previsao.tempo)}
            </span>
          ) : null}
          <label className="sr-only" htmlFor="posicao-video">
            Posição do vídeo
          </label>
          <input
            id="posicao-video"
            type="range"
            min={0}
            max={duracao || 0}
            step="0.05"
            value={Math.min(atual, duracao || 0)}
            onPointerMove={(evento) => {
              const limites = evento.currentTarget.getBoundingClientRect();
              const posicao = Math.max(
                0,
                Math.min(limites.width, evento.clientX - limites.left),
              );
              setPrevisao({
                posicao,
                tempo: duracao * (posicao / limites.width),
              });
            }}
            onPointerLeave={() => setPrevisao(null)}
            onChange={(evento) => {
              const novoTempo = Number(evento.target.value);
              setAtual(novoTempo);
              if (video.current) video.current.currentTime = novoTempo;
            }}
            className="player-progress w-full"
            style={estiloProgresso}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={(evento) => {
              evento.stopPropagation();
              void alternar();
            }}
            className="player-control"
            aria-label={tocando ? "Pausar" : "Reproduzir"}
          >
            {tocando ? <Pause fill="white" /> : <Play fill="white" />}
          </button>
          <button
            type="button"
            onClick={(evento) => {
              evento.stopPropagation();
              saltar(-10);
            }}
            className="player-control player-desktop-control"
            aria-label="Voltar 10 segundos"
          >
            <RotateCcw />
          </button>
          <button
            type="button"
            onClick={(evento) => {
              evento.stopPropagation();
              saltar(10);
            }}
            className="player-control player-desktop-control"
            aria-label="Avançar 10 segundos"
          >
            <RotateCw />
          </button>
          <div className="group/volume flex items-center">
            <button
              type="button"
              onClick={(evento) => {
                evento.stopPropagation();
                alternarMudo();
              }}
              className="player-control"
              aria-label={volume === 0 ? "Ativar som" : "Silenciar"}
            >
              <VolumeIcone />
            </button>
            <label className="sr-only" htmlFor="volume-video">
              Volume
            </label>
            <input
              id="volume-video"
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={volume}
              onClick={(evento) => evento.stopPropagation()}
              onChange={(evento) => alterarVolume(Number(evento.target.value))}
              className="player-volume hidden w-0 accent-white opacity-0 transition-all duration-200 group-hover/volume:w-24 group-hover/volume:opacity-100 sm:block"
            />
          </div>
          <span className="ml-1 min-w-max text-xs text-white/90 tabular-nums sm:text-sm">
            {tempo(atual)} <span className="text-white/50">/</span>{" "}
            {tempo(duracao)}
          </span>

          <div className="ml-auto flex items-center gap-0 sm:gap-1">
            <a
              href={fonteAtiva.downloadUrl ?? fonteAtiva.url}
              download
              onClick={(evento) => evento.stopPropagation()}
              className="player-control"
              aria-label={`Baixar ${titulo} em ${fonteAtiva.rotulo}`}
              title="Baixar vídeo"
            >
              <Download />
            </a>
            <button
              type="button"
              onClick={(evento) => {
                evento.stopPropagation();
                setMenu(menu === "velocidade" ? null : "velocidade");
              }}
              className="player-control"
              aria-label={`Velocidade: ${velocidade}×`}
              aria-expanded={menu === "velocidade"}
              title="Velocidade"
            >
              <Gauge />
              <span className="absolute -right-0.5 -bottom-0.5 rounded bg-black px-1 text-[9px] font-bold">
                {velocidade}×
              </span>
            </button>
            <button
              type="button"
              onClick={(evento) => {
                evento.stopPropagation();
                setMenu(menu === "qualidade" ? null : "qualidade");
              }}
              className="player-control"
              aria-label={`Qualidade: ${qualidade === "auto" ? "automática" : fonteAtiva.rotulo}`}
              aria-expanded={menu === "qualidade"}
              title="Qualidade"
            >
              <Settings2 />
              <span className="absolute -right-1 -bottom-0.5 rounded bg-black px-1 text-[9px] font-bold">
                {fonteAtiva.resolucao >= 2160
                  ? "4K"
                  : `${fonteAtiva.resolucao}p`}
              </span>
            </button>
            <button
              type="button"
              disabled={!legendaUrl}
              onClick={(evento) => {
                evento.stopPropagation();
                alternarLegendas();
              }}
              className={`player-control player-desktop-control ${legendasAtivas ? "text-[#e50914]" : ""}`}
              aria-label={
                legendaUrl
                  ? "Ativar ou desativar legendas"
                  : "Legendas ainda não disponíveis"
              }
              title="Legendas"
            >
              <Captions />
            </button>
            <button
              type="button"
              onClick={(evento) => {
                evento.stopPropagation();
                void abrirPictureInPicture();
              }}
              className="player-control player-wide-control"
              aria-label="Abrir miniplayer"
              title="Miniplayer"
            >
              <PictureInPicture />
            </button>
            <button
              type="button"
              onClick={(evento) => {
                evento.stopPropagation();
                void alternarTelaCheia();
              }}
              className="player-control"
              aria-label={telaCheia ? "Sair da tela cheia" : "Tela cheia"}
              title="Tela cheia"
            >
              {telaCheia ? <Minimize /> : <Expand />}
            </button>
          </div>
        </div>
        <p className="mt-1 hidden text-right text-[10px] text-white/35 lg:block">
          Espaço: play/pause · J/L: voltar/avançar · M: som · F: tela cheia
        </p>
      </div>
    </div>
  );
}
