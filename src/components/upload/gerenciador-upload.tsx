"use client";

import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { calcularPartes, validarVideo } from "@/lib/upload/arquivo";
import {
  CONCORRENCIA_UPLOAD,
  MAXIMO_TENTATIVAS_PARTE,
} from "@/lib/upload/constantes";
import {
  excluirUpload,
  listarUploads,
  salvarUpload,
  type PartePersistida,
  type UploadPersistido,
} from "@/lib/upload/indexed-db";
import {
  calcularProgresso,
  formatarBytes,
  formatarTempo,
} from "@/lib/upload/progresso";
import { comRetentativa } from "@/lib/upload/retentativa";
import type { Filme } from "@/types/filme";

type Estado =
  | "ocioso"
  | "preparando"
  | "enviando"
  | "pausado"
  | "retomando"
  | "concluindo"
  | "concluido"
  | "erro";
type RespostaApi = Record<string, unknown>;

async function chamarApi(
  caminho: string,
  csrf: string,
  corpo: unknown,
): Promise<RespostaApi> {
  const resposta = await fetch(caminho, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
    body: JSON.stringify(corpo),
  });
  const dados = (await resposta.json()) as RespostaApi;
  if (resposta.status === 401) {
    window.location.href = "/admin/login?motivo=sessao";
    throw new Error("Sua sessão expirou.");
  }
  if (!resposta.ok)
    throw new Error(
      typeof dados.erro === "string"
        ? dados.erro
        : "Falha de conexão com o servidor.",
    );
  return dados;
}

function enviarDireto(
  url: string,
  parte: Blob,
  aoProgredir: (bytes: number) => void,
  xhrs: Set<XMLHttpRequest>,
  sinal: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrs.add(xhr);
    xhr.open("PUT", url);
    xhr.upload.onprogress = (evento) => {
      if (evento.lengthComputable) aoProgredir(evento.loaded);
    };
    xhr.onload = () => {
      xhrs.delete(xhr);
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        if (!etag)
          reject(
            new Error(
              "O R2 não expôs o cabeçalho ETag. Revise a configuração CORS.",
            ),
          );
        else resolve(etag);
      } else if (xhr.status === 401 || xhr.status === 403)
        reject(new Error("A URL de upload expirou."));
      else reject(new Error(`A parte falhou com código ${xhr.status}.`));
    };
    xhr.onerror = () => {
      xhrs.delete(xhr);
      reject(new Error("Falha de conexão durante o envio da parte."));
    };
    xhr.onabort = () => {
      xhrs.delete(xhr);
      reject(new DOMException("Envio pausado.", "AbortError"));
    };
    sinal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(parte);
  });
}

export function GerenciadorUpload({
  csrf,
  onConcluido,
}: {
  csrf: string;
  onConcluido: (filme: Filme, chaveAnterior: string | null) => void;
}) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [pendente, setPendente] = useState<UploadPersistido | null>(null);
  const [estado, setEstado] = useState<Estado>("ocioso");
  const [mensagem, setMensagem] = useState(
    "Selecione o arquivo final do filme.",
  );
  const [enviados, setEnviados] = useState(0);
  const [total, setTotal] = useState(0);
  const [iniciadaEm, setIniciadaEm] = useState(0);
  const [agora, setAgora] = useState(0);
  const [online, setOnline] = useState(true);
  const sinalRef = useRef<AbortController | null>(null);
  const xhrsRef = useRef(new Set<XMLHttpRequest>());
  const canceladoRef = useRef(false);
  const bloqueioRef = useRef(false);
  const arquivoInput = useRef<HTMLInputElement>(null);
  const retomarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void listarUploads()
      .then((uploads) => {
        const ultimo = uploads.sort((a, b) =>
          b.criadoEm.localeCompare(a.criadoEm),
        )[0];
        if (ultimo) {
          setPendente(ultimo);
          setMensagem("Há um upload incompleto que pode ser retomado.");
        }
      })
      .catch(() =>
        setMensagem(
          "Não foi possível consultar uploads anteriores neste navegador.",
        ),
      );
  }, []);

  const ativo = ["preparando", "enviando", "retomando", "concluindo"].includes(
    estado,
  );
  useEffect(() => {
    if (!ativo) return;
    const temporizador = window.setInterval(() => setAgora(Date.now()), 1_000);
    return () => clearInterval(temporizador);
  }, [ativo]);
  useEffect(() => {
    const aviso = (evento: BeforeUnloadEvent) => {
      if (ativo) {
        evento.preventDefault();
        evento.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [ativo]);

  const pausar = useCallback(
    (motivo = "Upload pausado. Clique em continuar para retomar.") => {
      sinalRef.current?.abort();
      xhrsRef.current.forEach((xhr) => xhr.abort());
      setEstado("pausado");
      setMensagem(motivo);
    },
    [],
  );

  useEffect(() => {
    const desconectar = () => {
      setOnline(false);
      if (ativo)
        pausar(
          "Conexão perdida. O upload foi pausado e as partes concluídas foram preservadas.",
        );
    };
    const reconectar = () => {
      setOnline(true);
      if (estado === "pausado")
        setMensagem(
          "Conexão restabelecida. Clique em continuar para retomar o envio.",
        );
    };
    window.addEventListener("offline", desconectar);
    window.addEventListener("online", reconectar);
    return () => {
      window.removeEventListener("offline", desconectar);
      window.removeEventListener("online", reconectar);
    };
  }, [ativo, estado, pausar]);

  const executar = async (file: File, existente?: UploadPersistido) => {
    if (bloqueioRef.current) return;
    bloqueioRef.current = true;
    canceladoRef.current = false;
    const validacao = validarVideo({
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
    });
    if (!validacao.valido) {
      setEstado("erro");
      setMensagem(validacao.mensagem);
      bloqueioRef.current = false;
      return;
    }
    if (!navigator.onLine) {
      setEstado("pausado");
      setMensagem("Sem conexão. Conecte-se à internet para iniciar o envio.");
      bloqueioRef.current = false;
      return;
    }

    try {
      setEstado(existente ? "retomando" : "preparando");
      setMensagem(
        existente
          ? "Conferindo as partes já armazenadas…"
          : "Preparando o envio seguro…",
      );
      const inicioCronometro = Date.now();
      setTotal(file.size);
      setIniciadaEm(inicioCronometro);
      setAgora(inicioCronometro);
      let registro = existente;
      if (!registro) {
        const inicio = await chamarApi("/api/upload/iniciar", csrf, {
          nome: file.name,
          tamanho: file.size,
          tipo: file.type,
        });
        registro = {
          uploadId: String(inicio.uploadId),
          chave: String(inicio.chave),
          tamanhoParte: Number(inicio.tamanhoParte),
          nome: file.name,
          tamanho: file.size,
          tipo: validacao.tipo,
          ultimaModificacao: file.lastModified,
          partes: [],
          criadoEm: new Date().toISOString(),
        };
        await salvarUpload(registro);
        setPendente(registro);
      } else if (
        registro.nome !== file.name ||
        registro.tamanho !== file.size ||
        registro.tipo !== file.type ||
        registro.ultimaModificacao !== file.lastModified
      ) {
        throw new Error(
          "Selecione exatamente o mesmo arquivo usado para iniciar este upload.",
        );
      }

      const remotas = await chamarApi("/api/upload/listar-partes", csrf, {
        chave: registro.chave,
        uploadId: registro.uploadId,
      });
      const definicoes = calcularPartes(file.size, registro.tamanhoParte);
      const porNumero = new Map(
        definicoes.map((parte) => [parte.numero, parte]),
      );
      const concluidas = new Map<number, PartePersistida>();
      for (const parte of (remotas.partes as
        Array<{ PartNumber?: number; ETag?: string }> | undefined) ?? []) {
        const definicao = parte.PartNumber
          ? porNumero.get(parte.PartNumber)
          : undefined;
        if (definicao && parte.ETag)
          concluidas.set(definicao.numero, {
            numero: definicao.numero,
            etag: parte.ETag,
            tamanho: definicao.tamanho,
          });
      }
      for (const parte of registro.partes)
        if (!concluidas.has(parte.numero)) concluidas.set(parte.numero, parte);
      registro.partes = [...concluidas.values()];
      await salvarUpload(registro);
      setPendente({ ...registro });

      let bytesConcluidos = [...concluidas.values()].reduce(
        (soma, parte) => soma + parte.tamanho,
        0,
      );
      const ativos = new Map<number, number>();
      setEnviados(bytesConcluidos);
      const fila = definicoes.filter((parte) => !concluidas.has(parte.numero));
      let proximo = 0;
      const sinal = new AbortController();
      sinalRef.current = sinal;
      setEstado("enviando");
      setMensagem("Enviando diretamente para o Cloudflare R2…");

      const trabalhador = async () => {
        while (
          proximo < fila.length &&
          !sinal.signal.aborted &&
          !canceladoRef.current
        ) {
          const indice = proximo;
          proximo += 1;
          const definicao = fila[indice];
          if (!definicao) return;
          const blob = file.slice(definicao.inicio, definicao.fim);
          const etag = await comRetentativa(
            async (tentativa) => {
              if (sinal.signal.aborted)
                throw new DOMException("Envio pausado.", "AbortError");
              if (tentativa > 1)
                setMensagem(
                  `Tentando novamente a parte ${definicao.numero} (${tentativa}/${MAXIMO_TENTATIVAS_PARTE})…`,
                );
              const assinatura = await chamarApi(
                "/api/upload/assinar-parte",
                csrf,
                {
                  chave: registro.chave,
                  uploadId: registro.uploadId,
                  numeroParte: definicao.numero,
                },
              );
              ativos.set(definicao.numero, 0);
              try {
                return await enviarDireto(
                  String(assinatura.url),
                  blob,
                  (bytes) => {
                    ativos.set(definicao.numero, bytes);
                    setEnviados(
                      bytesConcluidos +
                        [...ativos.values()].reduce((a, b) => a + b, 0),
                    );
                  },
                  xhrsRef.current,
                  sinal.signal,
                );
              } finally {
                ativos.delete(definicao.numero);
              }
            },
            {
              maximoTentativas: MAXIMO_TENTATIVAS_PARTE,
              atrasoBaseMs: 700,
              sinal: sinal.signal,
            },
          );
          concluidas.set(definicao.numero, {
            numero: definicao.numero,
            etag,
            tamanho: definicao.tamanho,
          });
          bytesConcluidos += definicao.tamanho;
          setEnviados(bytesConcluidos);
          registro.partes = [...concluidas.values()];
          await salvarUpload(registro);
          setPendente({ ...registro });
          setMensagem(
            `Parte ${definicao.numero} de ${definicoes.length} concluída.`,
          );
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(CONCORRENCIA_UPLOAD, fila.length) }, () =>
          trabalhador(),
        ),
      );
      if (sinal.signal.aborted || canceladoRef.current) return;
      if (concluidas.size !== definicoes.length)
        throw new Error(
          "Algumas partes não foram concluídas. Tente continuar o envio.",
        );

      setEstado("concluindo");
      setMensagem("Concluindo e verificando o tamanho do arquivo…");
      const conclusao = await chamarApi("/api/upload/concluir", csrf, {
        chave: registro.chave,
        uploadId: registro.uploadId,
        nomeExibicao: file.name,
        tamanhoEsperado: file.size,
        tipo: file.type,
        partes: [...concluidas.values()]
          .sort((a, b) => a.numero - b.numero)
          .map((p) => ({ ETag: p.etag, PartNumber: p.numero })),
      });
      await excluirUpload(registro.uploadId);
      setPendente(null);
      setArquivo(null);
      setEnviados(file.size);
      setEstado("concluido");
      setMensagem("Upload concluído e tamanho verificado com sucesso.");
      onConcluido(
        conclusao.filme as Filme,
        typeof conclusao.chaveAnterior === "string"
          ? conclusao.chaveAnterior
          : null,
      );
    } catch (erro) {
      if (erro instanceof DOMException && erro.name === "AbortError") return;
      setEstado("erro");
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Falha inesperada durante o upload.",
      );
    } finally {
      bloqueioRef.current = false;
    }
  };

  const cancelar = async () => {
    const registro = pendente;
    if (!registro || bloqueioRef.current) return;
    canceladoRef.current = true;
    sinalRef.current?.abort();
    setMensagem("Cancelando o upload…");
    try {
      await chamarApi("/api/upload/cancelar", csrf, {
        chave: registro.chave,
        uploadId: registro.uploadId,
      });
      await excluirUpload(registro.uploadId);
      setPendente(null);
      setArquivo(null);
      setEnviados(0);
      setTotal(0);
      setEstado("ocioso");
      setMensagem("Upload cancelado. As partes temporárias foram removidas.");
    } catch (erro) {
      setEstado("erro");
      setMensagem(
        erro instanceof Error ? erro.message : "Falha ao cancelar o upload.",
      );
    }
  };

  const estatisticas = calcularProgresso({
    enviados,
    total,
    iniciadaEm,
    agora,
  });
  return (
    <section className="card-cinema p-5 sm:p-7" aria-labelledby="titulo-upload">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-cinema">Arquivo principal</p>
          <h2
            id="titulo-upload"
            className="font-display mt-2 text-2xl font-bold"
          >
            Upload do filme
          </h2>
        </div>
        <CloudUpload className="text-[#d52c3b]" />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#aaa9a6]">
        Para maior compatibilidade com navegadores e celulares, recomendamos MP4
        com vídeo H.264 e áudio AAC. Limite: 5 GB.
      </p>
      {pendente && estado === "ocioso" ? (
        <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <p className="font-bold text-amber-200">
            Upload incompleto encontrado
          </p>
          <p className="mt-1 text-sm text-[#b8b6b0]">
            {pendente.nome} · {formatarBytes(pendente.tamanho)} ·{" "}
            {pendente.partes.length} parte(s) concluída(s)
          </p>
          <input
            ref={retomarInput}
            type="file"
            accept="video/mp4,video/webm,.mp4,.webm"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setArquivo(file);
                void executar(file, pendente);
              }
            }}
          />
          <button
            type="button"
            className="button-primary mt-4"
            onClick={() => retomarInput.current?.click()}
          >
            <RefreshCw size={17} /> Continuar envio
          </button>
        </div>
      ) : null}
      {!pendente && !ativo ? (
        <div className="mt-5">
          <label htmlFor="arquivo-filme" className="field-label">
            Selecione MP4 ou WebM
          </label>
          <input
            ref={arquivoInput}
            id="arquivo-filme"
            type="file"
            accept="video/mp4,video/webm,.mp4,.webm"
            className="input-cinema file:mr-4 file:rounded-full file:border-0 file:bg-[#262a31] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setArquivo(file);
              if (file) {
                setTotal(file.size);
                setMensagem(`${file.name} · ${formatarBytes(file.size)}`);
              }
            }}
          />
          {arquivo ? (
            <button
              type="button"
              className="button-primary mt-4"
              disabled={ativo}
              onClick={() => void executar(arquivo)}
            >
              <CloudUpload size={17} /> Iniciar upload
            </button>
          ) : null}
        </div>
      ) : null}
      {pendente ||
      ativo ||
      estado === "concluido" ||
      estado === "erro" ||
      estado === "pausado" ? (
        <div className="mt-6" aria-live="polite">
          <div className="flex items-center gap-2 text-sm font-bold">
            {estado === "concluido" ? (
              <CheckCircle2 className="text-emerald-400" size={18} />
            ) : estado === "erro" ? (
              <AlertCircle className="text-red-400" size={18} />
            ) : !online ? (
              <WifiOff size={18} />
            ) : (
              <span
                className={`status-dot ${estado === "pausado" ? "text-amber-400" : "text-[#d52c3b]"}`}
              />
            )}
            <span className="capitalize">{estado}</span>
          </div>
          <p className="mt-2 text-sm text-[#aaa9a6]">{mensagem}</p>
          {total > 0 ? (
            <>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#d52c3b] transition-[width]"
                  style={{
                    width: `${Math.min(100, estatisticas.percentual)}%`,
                  }}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[#8f918e] sm:grid-cols-4">
                <span>{estatisticas.percentual.toFixed(1)}%</span>
                <span>
                  {formatarBytes(enviados)} de {formatarBytes(total)}
                </span>
                <span>{formatarBytes(estatisticas.velocidade)}/s</span>
                <span>
                  Restante: {formatarTempo(estatisticas.segundosRestantes)}
                </span>
              </div>
            </>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            {estado === "enviando" || estado === "retomando" ? (
              <button
                type="button"
                className="button-secondary"
                onClick={() => pausar()}
              >
                <Pause size={17} /> Pausar
              </button>
            ) : null}
            {(estado === "pausado" || estado === "erro") &&
            pendente &&
            arquivo ? (
              <button
                type="button"
                className="button-primary"
                onClick={() => void executar(arquivo, pendente)}
              >
                <Play size={17} /> Continuar envio
              </button>
            ) : null}
            {pendente && estado !== "concluindo" ? (
              <button
                type="button"
                className="button-secondary text-red-200"
                onClick={() => void cancelar()}
              >
                <Trash2 size={17} /> Cancelar envio
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
