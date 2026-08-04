const RELEASE =
  "https://github.com/ViniciusPassos104/a-cicatriz/releases/download/filmes-v1";

const filmes = {
  "a-cicatriz": {
    titulo: "A Cicatriz",
    fontes: {
      "1080p": `${RELEASE}/a-cicatriz-1080p.mp4`,
      "720p": `${RELEASE}/a-cicatriz-720p.mp4`,
    },
  },
  "mais-depressivo": {
    titulo: "Mais Depressivo",
    fontes: {
      "1080p": `${RELEASE}/mais-depressivo-1080p.mp4`,
      "720p": `${RELEASE}/mais-depressivo-720p.mp4`,
    },
  },
  "resultado-final": {
    titulo: "Resultado Final",
    fontes: {
      "1080p": `${RELEASE}/resultado-final-1080p.mp4`,
      "720p": `${RELEASE}/resultado-final-720p.mp4`,
    },
  },
};

const tela = document.querySelector("#tela-player");
const palco = document.querySelector("#palco");
const video = document.querySelector("#video");
const titulo = document.querySelector("#titulo-player");
const play = document.querySelector("#play");
const playCentral = document.querySelector("#play-central");
const progresso = document.querySelector("#progresso");
const atual = document.querySelector("#atual");
const duracao = document.querySelector("#duracao");
const volume = document.querySelector("#volume");
const mudo = document.querySelector("#mudo");
const velocidade = document.querySelector("#velocidade");
const qualidade = document.querySelector("#qualidade");
const download = document.querySelector("#download");

let idAtivo = null;
let qualidadeAtiva = null;
let temporizadorControles = null;
let trocandoFonte = false;

function formatarTempo(segundos) {
  if (!Number.isFinite(segundos)) return "0:00";
  const total = Math.max(0, Math.floor(segundos));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundosRestantes = String(total % 60).padStart(2, "0");
  return horas
    ? `${horas}:${String(minutos).padStart(2, "0")}:${segundosRestantes}`
    : `${minutos}:${segundosRestantes}`;
}

function qualidadeAutomatica() {
  const conexao = navigator.connection;
  if (
    window.innerWidth < 800 ||
    conexao?.saveData ||
    ["slow-2g", "2g", "3g"].includes(conexao?.effectiveType)
  ) {
    return "720p";
  }
  return "1080p";
}

function fonteDesejada() {
  return qualidade.value === "auto" ? qualidadeAutomatica() : qualidade.value;
}

function atualizarBotoes() {
  const tocando = !video.paused && !video.ended;
  palco.classList.toggle("tocando", tocando);
  play.textContent = tocando ? "❚❚" : "▶";
  play.setAttribute("aria-label", tocando ? "Pausar" : "Reproduzir");
  playCentral.setAttribute("aria-label", tocando ? "Pausar" : "Reproduzir");
}

function atualizarVolume() {
  if (video.muted || video.volume === 0) mudo.textContent = "🔇";
  else if (video.volume < 0.5) mudo.textContent = "🔉";
  else mudo.textContent = "🔊";
  mudo.setAttribute("aria-label", video.muted ? "Ativar som" : "Silenciar");
}

function salvarProgresso() {
  if (!idAtivo || !Number.isFinite(video.currentTime)) return;
  localStorage.setItem(
    `a-cicatriz:${idAtivo}:posicao`,
    String(video.currentTime),
  );
}

function trocarFonte(novaQualidade, manterEstado = true) {
  if (!idAtivo || !filmes[idAtivo] || novaQualidade === qualidadeAtiva) return;
  const estavaTocando = !video.paused;
  const posicao = manterEstado ? video.currentTime : 0;
  qualidadeAtiva = novaQualidade;
  trocandoFonte = true;
  palco.classList.add("esperando");
  video.src = filmes[idAtivo].fontes[novaQualidade];
  download.href = video.src;
  download.setAttribute(
    "aria-label",
    `Baixar ${filmes[idAtivo].titulo} em ${novaQualidade}`,
  );
  video.load();
  video.addEventListener(
    "loadedmetadata",
    async () => {
      if (posicao > 0 && posicao < video.duration) video.currentTime = posicao;
      trocandoFonte = false;
      palco.classList.remove("esperando");
      if (estavaTocando) await video.play().catch(() => {});
    },
    { once: true },
  );
}

function abrirFilme(id, atualizarUrl = true) {
  const filme = filmes[id];
  if (!filme) return;
  idAtivo = id;
  titulo.textContent = filme.titulo;
  tela.hidden = false;
  document.body.classList.add("player-aberto");
  qualidade.value = "auto";
  qualidadeAtiva = null;
  trocarFonte(qualidadeAutomatica(), false);
  if (atualizarUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("filme", id);
    history.pushState({ filme: id }, "", url);
  }
}

function fecharFilme(atualizarUrl = true) {
  salvarProgresso();
  video.pause();
  video.removeAttribute("src");
  video.load();
  tela.hidden = true;
  document.body.classList.remove("player-aberto");
  palco.classList.remove("tocando", "esperando", "controles-ocultos");
  idAtivo = null;
  qualidadeAtiva = null;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (atualizarUrl) {
    const url = new URL(window.location.href);
    url.searchParams.delete("filme");
    history.pushState({}, "", url);
  }
}

async function alternarPlay() {
  if (video.paused) await video.play().catch(() => {});
  else video.pause();
}

function mostrarControles() {
  palco.classList.remove("controles-ocultos");
  clearTimeout(temporizadorControles);
  if (!video.paused) {
    temporizadorControles = setTimeout(() => {
      palco.classList.add("controles-ocultos");
    }, 2600);
  }
}

document.querySelectorAll('a[href^="?filme="]').forEach((link) => {
  link.addEventListener("click", (evento) => {
    evento.preventDefault();
    const id = new URL(link.href).searchParams.get("filme");
    abrirFilme(id);
  });
});

document
  .querySelector("#voltar")
  .addEventListener("click", () => fecharFilme());
play.addEventListener("click", alternarPlay);
playCentral.addEventListener("click", alternarPlay);
video.addEventListener("click", alternarPlay);
video.addEventListener("play", atualizarBotoes);
video.addEventListener("pause", atualizarBotoes);
video.addEventListener("ended", atualizarBotoes);
video.addEventListener("waiting", () => palco.classList.add("esperando"));
video.addEventListener("playing", () => palco.classList.remove("esperando"));
video.addEventListener("canplay", () => palco.classList.remove("esperando"));

video.addEventListener("loadedmetadata", () => {
  duracao.textContent = formatarTempo(video.duration);
  if (!trocandoFonte && idAtivo) {
    const salva = Number(localStorage.getItem(`a-cicatriz:${idAtivo}:posicao`));
    if (salva > 5 && salva < video.duration - 20) video.currentTime = salva;
  }
});

video.addEventListener("timeupdate", () => {
  atual.textContent = formatarTempo(video.currentTime);
  duracao.textContent = formatarTempo(video.duration);
  if (Number.isFinite(video.duration) && video.duration > 0) {
    progresso.value = String(
      Math.round((video.currentTime / video.duration) * 1000),
    );
  }
});

video.addEventListener("volumechange", atualizarVolume);
video.addEventListener("ratechange", () => {
  velocidade.value = String(video.playbackRate);
});

progresso.addEventListener("input", () => {
  if (!Number.isFinite(video.duration)) return;
  video.currentTime = (Number(progresso.value) / 1000) * video.duration;
});

volume.addEventListener("input", () => {
  video.muted = false;
  video.volume = Number(volume.value);
});

mudo.addEventListener("click", () => {
  video.muted = !video.muted;
});

velocidade.addEventListener("change", () => {
  video.playbackRate = Number(velocidade.value);
});

qualidade.addEventListener("change", () => {
  trocarFonte(fonteDesejada());
});

document.querySelector("#voltar-10").addEventListener("click", () => {
  video.currentTime = Math.max(0, video.currentTime - 10);
});

document.querySelector("#avancar-10").addEventListener("click", () => {
  video.currentTime = Math.min(
    video.duration || Infinity,
    video.currentTime + 10,
  );
});

document.querySelector("#tela-cheia").addEventListener("click", async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await palco.requestFullscreen();
});

palco.addEventListener("mousemove", mostrarControles);
palco.addEventListener("touchstart", mostrarControles, { passive: true });
window.addEventListener("beforeunload", salvarProgresso);

window.addEventListener("keydown", (evento) => {
  if (!idAtivo || ["INPUT", "SELECT"].includes(document.activeElement?.tagName))
    return;
  if (evento.code === "Space") {
    evento.preventDefault();
    alternarPlay();
  } else if (evento.key === "ArrowLeft") video.currentTime -= 10;
  else if (evento.key === "ArrowRight") video.currentTime += 10;
  else if (evento.key.toLowerCase() === "m") video.muted = !video.muted;
  else if (evento.key.toLowerCase() === "f") {
    if (document.fullscreenElement) document.exitFullscreen();
    else palco.requestFullscreen();
  } else if (evento.key === "Escape" && !document.fullscreenElement)
    fecharFilme();
});

window.addEventListener("popstate", () => {
  const id = new URL(window.location.href).searchParams.get("filme");
  if (id && filmes[id]) abrirFilme(id, false);
  else if (idAtivo) fecharFilme(false);
});

const inicial = new URL(window.location.href).searchParams.get("filme");
if (inicial && filmes[inicial]) abrirFilme(inicial, false);
