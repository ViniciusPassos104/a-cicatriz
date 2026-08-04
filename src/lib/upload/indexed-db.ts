export type PartePersistida = { numero: number; etag: string; tamanho: number };

export type UploadPersistido = {
  uploadId: string;
  chave: string;
  tamanhoParte: number;
  nome: string;
  tamanho: number;
  tipo: "video/mp4" | "video/webm";
  ultimaModificacao: number;
  partes: PartePersistida[];
  criadoEm: string;
};

const BANCO = "a-cicatriz-uploads";
const VERSAO = 1;
const ARMAZENAMENTO = "uploads";

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(BANCO, VERSAO);
    requisicao.onupgradeneeded = () => {
      if (!requisicao.result.objectStoreNames.contains(ARMAZENAMENTO))
        requisicao.result.createObjectStore(ARMAZENAMENTO, {
          keyPath: "uploadId",
        });
    };
    requisicao.onsuccess = () => resolve(requisicao.result);
    requisicao.onerror = () => reject(requisicao.error);
  });
}

async function transacao<T>(
  modo: IDBTransactionMode,
  operacao: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const banco = await abrirBanco();
  return new Promise((resolve, reject) => {
    const tx = banco.transaction(ARMAZENAMENTO, modo);
    const requisicao = operacao(tx.objectStore(ARMAZENAMENTO));
    requisicao.onsuccess = () => resolve(requisicao.result);
    requisicao.onerror = () => reject(requisicao.error);
    tx.oncomplete = () => banco.close();
  });
}

export const salvarUpload = (upload: UploadPersistido) =>
  transacao("readwrite", (store) => store.put(upload));
export const excluirUpload = (uploadId: string) =>
  transacao("readwrite", (store) => store.delete(uploadId));
export const listarUploads = () =>
  transacao<UploadPersistido[]>("readonly", (store) => store.getAll());
