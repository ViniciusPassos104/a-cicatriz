"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Film,
  ImageIcon,
  LoaderCircle,
  LogOut,
  Save,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { GerenciadorUpload } from "@/components/upload/gerenciador-upload";
import { formatarBytes } from "@/lib/upload/progresso";
import type { DadosEditaveisFilme, Filme } from "@/types/filme";

type Mensagem = { tipo: "sucesso" | "erro"; texto: string } | null;

function extrairEditaveis(filme: Filme): DadosEditaveisFilme {
  const {
    titulo,
    fraseImpacto,
    sinopse,
    categoria,
    idioma,
    ano,
    duracao,
    classificacao,
    elenco,
    creditos,
  } = filme;
  return {
    titulo,
    fraseImpacto,
    sinopse,
    categoria,
    idioma,
    ano,
    duracao,
    classificacao,
    elenco,
    creditos,
  };
}
function paraLista(valor: string) {
  return valor
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
function dataPt(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(data));
}

async function api<T>(
  caminho: string,
  metodo: string,
  csrf: string,
  corpo?: unknown,
): Promise<T> {
  const resposta = await fetch(caminho, {
    method: metodo,
    headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const dados = (await resposta.json()) as T & {
    erro?: string;
    codigo?: string;
  };
  if (resposta.status === 401) {
    window.location.href = "/admin/login?motivo=sessao";
    throw new Error("Sua sessão expirou.");
  }
  if (!resposta.ok)
    throw new Error(dados.erro ?? "Não foi possível concluir a solicitação.");
  return dados;
}

export function PainelAdmin({
  inicial,
  csrf,
}: {
  inicial: Filme;
  csrf: string;
}) {
  const router = useRouter();
  const [filme, setFilme] = useState(inicial);
  const [formulario, setFormulario] = useState(() => extrairEditaveis(inicial));
  const [mensagem, setMensagem] = useState<Mensagem>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [confirmacao, setConfirmacao] = useState("");
  const [previews, setPreviews] = useState({
    capa: inicial.capaUrl,
    poster: inicial.posterUrl,
  });
  const alterado = useMemo(
    () =>
      JSON.stringify(formulario) !== JSON.stringify(extrairEditaveis(filme)),
    [formulario, filme],
  );

  useEffect(() => {
    const aviso = (evento: BeforeUnloadEvent) => {
      if (alterado) {
        evento.preventDefault();
        evento.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [alterado]);

  const atualizar = <K extends keyof DadosEditaveisFilme>(
    campo: K,
    valor: DadosEditaveisFilme[K],
  ) => setFormulario((atual) => ({ ...atual, [campo]: valor }));
  const atualizarCredito = (
    campo: keyof DadosEditaveisFilme["creditos"],
    valor: string | string[],
  ) =>
    setFormulario((atual) => ({
      ...atual,
      creditos: { ...atual.creditos, [campo]: valor },
    }));

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (processando) return;
    setProcessando("salvar");
    setMensagem(null);
    try {
      const dados = await api<{ filme: Filme }>(
        "/api/filme",
        "PATCH",
        csrf,
        formulario,
      );
      setFilme(dados.filme);
      setFormulario(extrairEditaveis(dados.filme));
      setMensagem({
        tipo: "sucesso",
        texto: "Dados do filme salvos com sucesso.",
      });
      router.refresh();
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto: erro instanceof Error ? erro.message : "Falha ao salvar dados.",
      });
    } finally {
      setProcessando(null);
    }
  };

  const alternarPublicacao = async () => {
    if (processando) return;
    setProcessando("publicacao");
    setMensagem(null);
    try {
      const dados = await api<{ filme: Filme }>("/api/filme", "PUT", csrf, {
        publicado: !filme.publicado,
      });
      setFilme(dados.filme);
      setMensagem({
        tipo: "sucesso",
        texto: dados.filme.publicado
          ? "Filme publicado."
          : "Filme despublicado.",
      });
      router.refresh();
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto:
          erro instanceof Error ? erro.message : "Falha ao alterar publicação.",
      });
    } finally {
      setProcessando(null);
    }
  };

  const enviarImagem = async (tipoImagem: "capa" | "poster", arquivo: File) => {
    if (processando) return;
    setProcessando(tipoImagem);
    setMensagem(null);
    const preview = URL.createObjectURL(arquivo);
    setPreviews((atual) => ({ ...atual, [tipoImagem]: preview }));
    try {
      const assinatura = await api<{ url: string; chave: string }>(
        "/api/upload/imagem",
        "POST",
        csrf,
        { tipoImagem, contentType: arquivo.type, tamanho: arquivo.size },
      );
      const envio = await fetch(assinatura.url, {
        method: "PUT",
        headers: { "Content-Type": arquivo.type },
        body: arquivo,
      });
      if (!envio.ok)
        throw new Error(
          "Falha de conexão ao enviar a imagem diretamente ao R2.",
        );
      const dados = await api<{ filme: Filme }>(
        "/api/upload/imagem",
        "PATCH",
        csrf,
        { tipoImagem, chave: assinatura.chave },
      );
      setFilme(dados.filme);
      setPreviews({ capa: dados.filme.capaUrl, poster: dados.filme.posterUrl });
      setMensagem({
        tipo: "sucesso",
        texto: `${tipoImagem === "capa" ? "Capa" : "Pôster"} atualizado com sucesso.`,
      });
      router.refresh();
    } catch (erro) {
      setPreviews({ capa: filme.capaUrl, poster: filme.posterUrl });
      setMensagem({
        tipo: "erro",
        texto:
          erro instanceof Error ? erro.message : "Falha ao carregar a imagem.",
      });
    } finally {
      URL.revokeObjectURL(preview);
      setProcessando(null);
    }
  };

  const excluirFilme = async () => {
    if (confirmacao !== "EXCLUIR FILME" || processando) return;
    setProcessando("excluir");
    setMensagem(null);
    try {
      const dados = await api<{ filme: Filme }>(
        "/api/filme/arquivo",
        "DELETE",
        csrf,
        { confirmacao },
      );
      setFilme(dados.filme);
      setConfirmacao("");
      setMensagem({
        tipo: "sucesso",
        texto:
          "Arquivo do filme excluído. Os metadados foram preservados e o filme foi despublicado.",
      });
      router.refresh();
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto:
          erro instanceof Error ? erro.message : "Falha ao excluir o filme.",
      });
    } finally {
      setProcessando(null);
    }
  };

  const sair = async () => {
    if (processando) return;
    setProcessando("sair");
    try {
      await api("/api/auth/logout", "POST", csrf, {});
      sessionStorage.removeItem("a-cicatriz-csrf");
      router.replace("/admin/login");
      router.refresh();
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto: erro instanceof Error ? erro.message : "Falha ao sair.",
      });
      setProcessando(null);
    }
  };

  const uploadConcluido = (novo: Filme, chaveAnterior: string | null) => {
    setFilme(novo);
    setFormulario(extrairEditaveis(novo));
    setMensagem({
      tipo: "sucesso",
      texto: "Novo filme verificado e associado com sucesso.",
    });
    router.refresh();
    if (
      chaveAnterior &&
      window.confirm(
        "O novo filme foi verificado. Deseja excluir agora o arquivo anterior do R2?",
      )
    ) {
      void api("/api/filme/arquivo", "DELETE", csrf, {
        confirmacao: "EXCLUIR ARQUIVO ANTERIOR",
        chave: chaveAnterior,
      })
        .then(() =>
          setMensagem({
            tipo: "sucesso",
            texto: "Arquivo anterior excluído com sucesso.",
          }),
        )
        .catch((erro: unknown) =>
          setMensagem({
            tipo: "erro",
            texto:
              erro instanceof Error
                ? erro.message
                : "Falha ao excluir o arquivo anterior.",
          }),
        );
    }
  };

  const camposCredito: Array<[keyof DadosEditaveisFilme["creditos"], string]> =
    [
      ["direcao", "Direção"],
      ["producao", "Produção"],
      ["roteiro", "Roteiro"],
      ["edicao", "Edição"],
      ["direcaoFotografia", "Direção de fotografia"],
      ["efeitosVisuais", "Efeitos visuais"],
      ["captacaoSom", "Captação de som"],
      ["designSom", "Design de som"],
      ["colorizacao", "Colorização"],
      ["agradecimentos", "Agradecimentos"],
    ];

  return (
    <main className="min-h-svh bg-[#08090b] pb-20">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08090bea] backdrop-blur-xl">
        <div className="container-site flex min-h-18 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="grid size-10 place-items-center rounded-full border border-white/10 hover:bg-white/5"
              aria-label="Voltar ao site"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-xs font-bold tracking-widest text-[#d52c3b] uppercase">
                A Cicatriz
              </p>
              <h1 className="font-display text-xl font-bold">
                Painel administrativo
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {alterado ? (
              <span className="hidden items-center gap-2 text-xs text-amber-300 sm:flex">
                <span className="status-dot" /> Alterações não salvas
              </span>
            ) : null}
            <button
              type="button"
              className="button-secondary min-h-10 px-4 py-2"
              onClick={() => void sair()}
              disabled={processando === "sair"}
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>
      <div className="container-site pt-8">
        {mensagem ? (
          <div
            role={mensagem.tipo === "erro" ? "alert" : "status"}
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${mensagem.tipo === "erro" ? "border-red-400/25 bg-red-400/5 text-red-200" : "border-emerald-400/25 bg-emerald-400/5 text-emerald-200"}`}
          >
            {mensagem.tipo === "erro" ? (
              <AlertTriangle size={20} />
            ) : (
              <CheckCircle2 size={20} />
            )}
            <p>{mensagem.texto}</p>
          </div>
        ) : null}
        <section className="grid gap-4 md:grid-cols-3">
          <article className="card-cinema p-5">
            <p className="text-xs font-bold tracking-wider text-[#858783] uppercase">
              Status
            </p>
            <div
              className={`mt-4 flex items-center gap-3 text-lg font-bold ${filme.publicado ? "text-emerald-300" : "text-amber-300"}`}
            >
              <span className="status-dot" />
              {filme.publicado ? "Publicado" : "Não publicado"}
            </div>
            <button
              type="button"
              className="button-secondary mt-5 w-full"
              onClick={() => void alternarPublicacao()}
              disabled={
                Boolean(processando) || (!filme.publicado && !filme.video)
              }
            >
              {processando === "publicacao" ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <Send size={17} />
              )}{" "}
              {filme.publicado ? "Despublicar" : "Publicar filme"}
            </button>
          </article>
          <article className="card-cinema p-5 md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-wider text-[#858783] uppercase">
                  Arquivo atual
                </p>
                {filme.video ? (
                  <>
                    <h2 className="mt-3 font-bold break-all">
                      {filme.video.nomeExibicao}
                    </h2>
                    <p className="mt-2 text-sm text-[#969895]">
                      {formatarBytes(filme.video.tamanho)} ·{" "}
                      {filme.video.tipo.replace("video/", "").toUpperCase()} ·
                      enviado em {dataPt(filme.video.enviadoEm)}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-[#aaa9a6]">Nenhum vídeo enviado.</p>
                )}
              </div>
              <Film className="text-[#d52c3b]" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {filme.video ? (
                <Link
                  href="/assistir"
                  target="_blank"
                  className="button-secondary"
                >
                  <ExternalLink size={16} /> Assistir
                </Link>
              ) : null}
              <a href="#upload" className="button-secondary">
                <UploadCloud size={16} />{" "}
                {filme.video ? "Substituir" : "Enviar filme"}
              </a>
            </div>
          </article>
        </section>

        <div id="upload" className="mt-6 scroll-mt-24">
          <GerenciadorUpload csrf={csrf} onConcluido={uploadConcluido} />
        </div>

        <form
          onSubmit={(e) => void salvar(e)}
          className="card-cinema mt-6 p-5 sm:p-7"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="label-cinema">Conteúdo público</p>
              <h2 className="font-display mt-2 text-2xl font-bold">
                Dados do filme
              </h2>
            </div>
            <button
              type="submit"
              className="button-primary"
              disabled={!alterado || Boolean(processando)}
            >
              {processando === "salvar" ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <Save size={17} />
              )}{" "}
              Salvar alterações
            </button>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <label>
              <span className="field-label">Título</span>
              <input
                className="input-cinema"
                value={formulario.titulo}
                onChange={(e) => atualizar("titulo", e.target.value)}
                required
                maxLength={120}
              />
            </label>
            <label>
              <span className="field-label">Frase de impacto</span>
              <input
                className="input-cinema"
                value={formulario.fraseImpacto}
                onChange={(e) => atualizar("fraseImpacto", e.target.value)}
                required
                maxLength={220}
              />
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Sinopse</span>
              <textarea
                className="input-cinema min-h-36 resize-y"
                value={formulario.sinopse}
                onChange={(e) => atualizar("sinopse", e.target.value)}
                required
                minLength={30}
                maxLength={2500}
              />
            </label>
            <label>
              <span className="field-label">Categoria</span>
              <input
                className="input-cinema"
                value={formulario.categoria}
                onChange={(e) => atualizar("categoria", e.target.value)}
                required
              />
            </label>
            <label>
              <span className="field-label">Idioma</span>
              <input
                className="input-cinema"
                value={formulario.idioma}
                onChange={(e) => atualizar("idioma", e.target.value)}
                required
              />
            </label>
            <label>
              <span className="field-label">Ano</span>
              <input
                className="input-cinema"
                value={formulario.ano}
                onChange={(e) => atualizar("ano", e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Duração</span>
              <input
                className="input-cinema"
                value={formulario.duracao}
                onChange={(e) => atualizar("duracao", e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Classificação indicativa</span>
              <input
                className="input-cinema"
                value={formulario.classificacao}
                onChange={(e) => atualizar("classificacao", e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Elenco — um nome por linha</span>
              <textarea
                className="input-cinema min-h-32"
                value={formulario.elenco.join("\n")}
                onChange={(e) => atualizar("elenco", paraLista(e.target.value))}
              />
            </label>
          </div>
          <h3 className="font-display mt-10 text-xl font-bold">Créditos</h3>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {camposCredito.map(([campo, rotulo]) => (
              <label key={campo}>
                <span className="field-label">
                  {rotulo} — um nome por linha
                </span>
                <textarea
                  className="input-cinema min-h-24"
                  value={(formulario.creditos[campo] as string[]).join("\n")}
                  onChange={(e) =>
                    atualizarCredito(campo, paraLista(e.target.value))
                  }
                />
              </label>
            ))}
            <label className="md:col-span-2">
              <span className="field-label">Instituição de ensino</span>
              <input
                className="input-cinema"
                value={formulario.creditos.instituicaoEnsino}
                onChange={(e) =>
                  atualizarCredito("instituicaoEnsino", e.target.value)
                }
              />
            </label>
          </div>
        </form>

        <section className="card-cinema mt-6 p-5 sm:p-7">
          <p className="label-cinema">Identidade visual</p>
          <h2 className="font-display mt-2 text-2xl font-bold">
            Capa e pôster
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {(["capa", "poster"] as const).map((tipo) => (
              <article key={tipo}>
                <div
                  role="img"
                  aria-label={`Pré-visualização da ${tipo}`}
                  className={`w-full rounded-xl border border-white/10 bg-cover bg-center ${tipo === "capa" ? "aspect-video" : "mx-auto aspect-[2/3] max-w-64"}`}
                  style={{ backgroundImage: `url(${previews[tipo]})` }}
                />
                <label className="button-secondary mt-4 cursor-pointer">
                  <ImageIcon size={17} />{" "}
                  {processando === tipo ? "Enviando…" : `Alterar ${tipo}`}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    disabled={Boolean(processando)}
                    onChange={(e) => {
                      const arquivo = e.target.files?.[0];
                      if (arquivo) void enviarImagem(tipo, arquivo);
                    }}
                  />
                </label>
                <p className="mt-2 text-xs text-[#858783]">
                  JPG, PNG ou WebP, até 10 MiB.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/5 p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <AlertTriangle className="shrink-0 text-red-400" />
            <div>
              <h2 className="font-display text-2xl font-bold">
                Zona de perigo
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa9a6]">
                A exclusão remove definitivamente o arquivo atual do R2,
                despublica o filme e preserva os textos. Para confirmar, digite
                exatamente <strong className="text-white">EXCLUIR FILME</strong>
                .
              </p>
            </div>
          </div>
          <label className="mt-5 block max-w-md">
            <span className="field-label">Confirmação</span>
            <input
              className="input-cinema"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="button-secondary mt-4 border-red-400/30 text-red-200"
            disabled={
              !filme.video ||
              confirmacao !== "EXCLUIR FILME" ||
              Boolean(processando)
            }
            onClick={() => void excluirFilme()}
          >
            <Trash2 size={17} /> Excluir arquivo do filme
          </button>
        </section>
      </div>
    </main>
  );
}
