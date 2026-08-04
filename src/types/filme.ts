import { z } from "zod";

const textoSeguro = (limite: number) =>
  z
    .string()
    .trim()
    .max(limite, `Use no máximo ${limite} caracteres.`)
    .refine(
      (valor) => !/[<>]/.test(valor),
      "O texto contém caracteres não permitidos.",
    );

const listaDeNomes = z.array(textoSeguro(120)).max(100);

export const arquivoVideoSchema = z.object({
  chave: z.string().min(1),
  url: z.url(),
  tamanho: z.number().int().positive().max(5_000_000_000),
  tipo: z.enum(["video/mp4", "video/webm"]),
  nomeExibicao: textoSeguro(180),
  enviadoEm: z.iso.datetime(),
});

export const dadosEditaveisFilmeSchema = z.object({
  titulo: textoSeguro(120).min(1, "Informe o título."),
  fraseImpacto: textoSeguro(220).min(1, "Informe a frase de impacto."),
  sinopse: textoSeguro(2_500).min(
    30,
    "A sinopse precisa ter ao menos 30 caracteres.",
  ),
  categoria: textoSeguro(160).min(1, "Informe a categoria."),
  idioma: textoSeguro(80).min(1, "Informe o idioma."),
  ano: textoSeguro(30),
  duracao: textoSeguro(40),
  classificacao: textoSeguro(40),
  elenco: listaDeNomes,
  creditos: z.object({
    direcao: listaDeNomes,
    producao: listaDeNomes,
    roteiro: listaDeNomes,
    edicao: listaDeNomes,
    direcaoFotografia: listaDeNomes,
    efeitosVisuais: listaDeNomes,
    captacaoSom: listaDeNomes,
    designSom: listaDeNomes,
    colorizacao: listaDeNomes,
    agradecimentos: listaDeNomes,
    instituicaoEnsino: textoSeguro(180),
  }),
});

export const filmeSchema = dadosEditaveisFilmeSchema.extend({
  versao: z.literal(1),
  publicado: z.boolean(),
  video: arquivoVideoSchema.nullable(),
  capaUrl: z.string().min(1),
  posterUrl: z.string().min(1),
  legendaUrl: z.url().nullable(),
  atualizadoEm: z.iso.datetime(),
});

export type ArquivoVideo = z.infer<typeof arquivoVideoSchema>;
export type DadosEditaveisFilme = z.infer<typeof dadosEditaveisFilmeSchema>;
export type Filme = z.infer<typeof filmeSchema>;

export const filmeInicial: Filme = {
  versao: 1,
  titulo: "A Cicatriz",
  fraseImpacto: "Nem toda cicatriz pode ser vista.",
  sinopse:
    "“A Cicatriz” acompanha as consequências silenciosas do bullying e mostra como palavras, agressões e humilhações podem deixar marcas que não desaparecem quando o sinal da escola toca.",
  categoria: "Drama escolar / Conscientização sobre bullying",
  idioma: "Português do Brasil",
  ano: "2026",
  duracao: "9 min",
  classificacao: "A definir",
  elenco: [
    "Victor",
    "Pedro Lucas",
    "Pedro H. Alves",
    "Yago",
    "Vinicius Passos",
    "Wendiny Coelho",
    "Jonas",
    "Calebe",
  ],
  creditos: {
    direcao: [],
    producao: [],
    roteiro: [],
    edicao: ["Vinicius Ramlow Cardoso dos Passos"],
    direcaoFotografia: ["Victor Ramlow Cardoso dos Passos"],
    efeitosVisuais: ["Victor Cardoso", "Vinicius Passos"],
    captacaoSom: [],
    designSom: [],
    colorizacao: [],
    agradecimentos: [],
    instituicaoEnsino: "",
  },
  publicado: false,
  video: null,
  capaUrl: "/api/capa",
  posterUrl: "/api/capa",
  legendaUrl: null,
  atualizadoEm: "2026-07-27T12:00:00.000Z",
};
