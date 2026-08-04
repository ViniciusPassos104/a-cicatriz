# A Cicatriz

Para assistir localmente no Chrome sem interferência de extensões, dê dois
cliques em `ABRIR A CICATRIZ NO CHROME.cmd`. O atalho inicia o servidor e abre
uma janela limpa do site com aparência de aplicativo.

Site oficial, responsivo e pronto para publicação do curta-metragem escolar **A Cicatriz**, sobre as consequências do bullying. A aplicação oferece página cinematográfica, player acessível, administração protegida e upload multipartes de vídeos de até 5.000.000.000 bytes diretamente do navegador para o Cloudflare R2.

## Tecnologias e arquitetura

- Next.js 16 com App Router, React 19 e TypeScript estrito;
- Tailwind CSS 4, componentes semânticos e animações que respeitam redução de movimento;
- Cloudflare R2 via SDK S3 oficial da AWS;
- upload em partes de 64 MiB, três envios simultâneos, retentativa progressiva e retomada pelo IndexedDB;
- sessão administrativa assinada em cookie HttpOnly, senha com bcrypt, CSRF, validação de origem e limitação de requisições;
- metadados em `configuracao/filme.json` no R2, com validação Zod e backup antes de cada atualização;
- Vitest para testes unitários/de integração e Playwright para navegação.

O vídeo nunca passa por uma Function do Next.js ou da Vercel. A API apenas autentica, valida, controla o multipart upload e emite URLs de curta duração. O navegador envia cada blob diretamente para o domínio S3 do R2.

## Requisitos

- Node.js 24 LTS e npm 11 ou mais recente;
- conta Cloudflare com R2 habilitado;
- bucket R2 e domínio público para reprodução;
- uma senha administrativa forte;
- FFmpeg somente se o vídeo precisar ser convertido.

## Instalação local

```bash
npm install
copy .env.example .env.local
npm run gerar-senha
npm run dev
```

No macOS ou Linux, use `cp .env.example .env.local`. Cole no `ADMIN_PASSWORD_HASH` somente a linha que começa com `$2`. Depois abra `http://localhost:3000`. A administração fica em `http://localhost:3000/admin/login` e não aparece no menu público.

Sem `.env.local`, a página pública abre com os dados iniciais e deixa o vídeo indisponível. Operações administrativas que dependem do R2 retornam uma mensagem clara; nenhuma credencial fictícia é usada.

## Variáveis de ambiente

| Variável               | Conteúdo                                                                   |
| ---------------------- | -------------------------------------------------------------------------- |
| `R2_ACCOUNT_ID`        | identificador da conta Cloudflare                                          |
| `R2_ACCESS_KEY_ID`     | Access Key ID do token limitado ao bucket                                  |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key, visto uma única vez                                     |
| `R2_BUCKET_NAME`       | nome exato do bucket                                                       |
| `R2_ENDPOINT`          | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`                            |
| `R2_PUBLIC_BASE_URL`   | domínio público do bucket, com `https://`                                  |
| `ADMIN_PASSWORD_HASH`  | hash produzido por `npm run gerar-senha`                                   |
| `SESSION_SECRET`       | segredo aleatório com no mínimo 32 caracteres; prefira 64 bytes aleatórios |
| `NEXT_PUBLIC_SITE_URL` | origem exata do site, sem caminho, por exemplo `http://localhost:3000`     |

Somente `NEXT_PUBLIC_SITE_URL` é público. Nunca prefixe uma chave do R2, o hash ou o segredo de sessão com `NEXT_PUBLIC_`.

Para gerar um segredo de sessão:

```bash
node -e "console.log(require('node:crypto').randomBytes(64).toString('base64url'))"
```

## Configuração do Cloudflare R2

1. Crie ou acesse uma conta no painel da Cloudflare e habilite **R2 Object Storage**.
2. Em **Storage & databases > R2 > Overview**, crie um bucket, por exemplo `a-cicatriz-producao`.
3. Em **Manage R2 API Tokens**, crie um token de conta ou usuário com **Object Read & Write**, limitado somente a esse bucket. Copie imediatamente Access Key ID e Secret Access Key.
4. Copie o Account ID e use o endpoint S3 informado pelo painel. O endpoint comum é `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`; jurisdições específicas têm endpoint próprio.
5. Em **Settings > Public access**, use o subdomínio `r2.dev` apenas para desenvolvimento. Em produção, conecte um domínio personalizado da mesma conta Cloudflare, como `midia.seudominio.com`. Coloque essa origem em `R2_PUBLIC_BASE_URL`.
6. Em **Settings > CORS**, aplique uma política como a seguinte, substituindo o domínio final:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://www.seudominio.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Range"],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Range",
      "Accept-Ranges"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

As origens precisam coincidir exatamente e não podem terminar em `/`. Não use `*` em produção. `ETag` é indispensável para concluir o multipart upload; `Range`, `Content-Range` e `Accept-Ranges` ajudam o navegador a buscar trechos do vídeo. URLs pré-assinadas funcionam no domínio S3 do R2, não no domínio personalizado, por isso a CSP permite ambos quando as variáveis estão preenchidas.

O R2 aborta uploads multipartes incompletos depois de sete dias por padrão. A rota administrativa `/api/upload/limpar` também pode encerrar uploads antigos. Confira a regra em **Object lifecycle rules**.

Referências oficiais: [autenticação S3](https://developers.cloudflare.com/r2/api/tokens/), [CORS](https://developers.cloudflare.com/r2/buckets/cors/), [buckets públicos](https://developers.cloudflare.com/r2/buckets/public-buckets/) e [detalhes do multipart upload](https://developers.cloudflare.com/r2/objects/upload-objects/).

## Primeiro upload

1. Inicie o site e entre em `/admin/login` com a senha cujo hash foi configurado.
2. Revise título, sinopse, duração, classificação, elenco e créditos; salve.
3. Em **Upload do filme**, escolha MP4 ou WebM com no máximo 5 GB e clique em **Iniciar upload**.
4. Mantenha a aba aberta. A tela mostra bytes, porcentagem, velocidade, tempo estimado e estado real.
5. Se a rede cair, o envio pausa. Após reconectar, clique em **Continuar envio**. Se fechar o navegador, volte ao painel, clique em **Continuar envio** e selecione exatamente o mesmo arquivo. O arquivo inteiro não é salvo no IndexedDB; somente upload ID, chave, tamanho das partes e ETags são armazenados.
6. Após a conclusão, o servidor consulta o objeto e confere seu tamanho. Só então associa o novo vídeo. Se for uma substituição, o painel pergunta se o arquivo anterior deve ser excluído.
7. Confira em **Assistir** e clique em **Publicar filme**.

Pausar ou falhar não reinicia partes concluídas. Cancelar chama `AbortMultipartUpload` e limpa o estado local. Cada parte tenta no máximo cinco vezes e obtém uma URL nova, inclusive após expiração.

## Capa e pôster

No painel, envie JPG, PNG ou WebP de até 10 MiB. A imagem também vai diretamente ao R2 por URL pré-assinada. O servidor confirma que o objeto existe antes de atualizar os metadados. Recomendações: capa 1920 × 1080 e pôster 1200 × 1800.

## Compatibilidade e conversão com FFmpeg

MP4 com vídeo H.264 e áudio AAC oferece a melhor compatibilidade. Verifique o arquivo:

```bash
ffprobe -hide_banner filme-original.mp4
```

Converta localmente, nunca em uma Function serverless:

```bash
ffmpeg -i filme-original.ext -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart filme-web.mp4
```

`-movflags +faststart` posiciona os metadados no início e melhora o início da reprodução. A conversão pode demorar e exige espaço livre para o novo arquivo. O upload não recomprime o original selecionado.

## Comandos

```bash
npm run dev          # desenvolvimento
npm run format       # formatação
npm run lint         # ESLint sem avisos
npm run typecheck    # TypeScript estrito
npm run test         # unitários e integração
npm run test:e2e     # navegação desktop e celular
npm run build        # produção
npm run start        # servidor do build
npm run gerar-senha  # hash administrativo sem exibir a senha
```

Veja [TESTING.md](TESTING.md) para a verificação manual com arquivo grande.

## Publicação na Vercel

1. Instale Git, execute `git init`, `git add .` e confira cuidadosamente `git status`. Os vídeos e `.env*` já estão ignorados.
2. Crie um repositório privado e envie a branch principal.
3. Na Vercel, importe o repositório como projeto Next.js.
4. Em **Settings > Environment Variables**, cadastre todas as nove variáveis para Production e, quando necessário, Preview. Mudanças só afetam novos deployments.
5. Publique e conecte o domínio em **Settings > Domains**.
6. Atualize `NEXT_PUBLIC_SITE_URL` para a origem final, faça novo deployment e inclua a mesma origem no CORS do R2.
7. Acesse `/admin/login`, faça o primeiro upload, reproduza em computador e celular, então publique.

O domínio de preview muda a cada deployment. Para testar upload em Preview, adicione explicitamente a origem de preview ao CORS; não libere curingas. Consulte [DEPLOYMENT.md](DEPLOYMENT.md).

Para rollback, escolha um deployment anterior no painel ou execute `vercel rollback <url-do-deployment>`. Metadados e vídeos permanecem no R2; o código anterior voltará a lê-los. Se um metadado precisar ser restaurado, copie uma versão de `configuracao/historico/` para `configuracao/filme.json` com uma ferramenta S3 autorizada.

## Investigação de erros

- **Configuração do R2 incompleta:** compare `.env.local` com `.env.example` e reinicie o servidor.
- **CORS ou ETag ausente:** confira origem exata, método PUT, `Content-Type` e `ExposeHeaders: ETag`; limpe o cache do navegador após alterar CORS.
- **URL expirada:** continue o envio; uma assinatura nova será solicitada.
- **Sessão expirada:** entre novamente. A sessão dura oito horas.
- **Falha na reprodução:** abra a URL pública diretamente, confirme acesso público, Content-Type e suporte a byte ranges; converta para H.264/AAC.
- **Tamanho final diferente:** não publique o objeto; cancele, confira o arquivo local e reinicie.
- **Erros do servidor:** os logs usam rótulos como `[R2]`, `[Filme]` e `[API]` sem registrar senhas, tokens ou chaves.

## Manutenção e atualização segura

1. Crie uma branch de manutenção.
2. Execute `npm outdated` e leia os avisos oficiais, principalmente Next.js e AWS SDK.
3. Atualize uma família de dependências por vez, sem `--force`.
4. Execute `npm audit`, todos os comandos de qualidade e o checklist manual.
5. Revise o `package-lock.json`, publique em Preview e somente então promova para produção.

O projeto fixa a versão do Next e usa overrides para versões transitivas corrigidas de `postcss`, `sharp`, `minimatch` e `brace-expansion`. Reavalie esses overrides ao atualizar o Next; remova-os somente quando a árvore normal já usar versões seguras.

## Custos e limitações conhecidas

- Cloudflare R2 pode cobrar armazenamento, operações e, conforme o plano, recursos de domínio/segurança. Vercel e domínio próprio também podem ter custos.
- A taxa de login e APIs é limitada em memória por instância. Para tráfego administrativo distribuído ou alvo de ataques, complemente com Vercel Firewall/Cloudflare WAF ou um limitador distribuído.
- O bucket público permite acesso a quem conhece a URL do vídeo. Para conteúdo privado, seria necessário acrescentar autorização no domínio de mídia sem encaminhar o arquivo pela Vercel.
- A duração e a classificação começam como “Em finalização” e “A definir”; a equipe deve confirmar esses dados antes de publicar.
- A integração real com R2 depende das credenciais e do CORS do proprietário. Os testes automatizados usam um mock estrito do SDK e não enviam 5 GB.
- Legendas já são suportadas pelo player quando `legendaUrl` existir nos metadados, mas o painel ainda não envia arquivos VTT.

## Checklist antes da publicação

- [ ] dados, créditos, duração e classificação revisados;
- [ ] senha forte, `SESSION_SECRET` distinto e token R2 restrito ao bucket;
- [ ] CORS contém somente origens conhecidas e expõe ETag;
- [ ] domínio público R2 abre o vídeo e aceita intervalos de bytes;
- [ ] upload grande pausado e retomado com sucesso;
- [ ] filme testado em Chrome/Edge, Firefox, Safari/iOS e Android;
- [ ] capa e pôster com textos alternativos adequados;
- [ ] `npm audit`, formatador, lint, tipos, testes e build aprovados;
- [ ] vídeo publicado somente após a verificação final;
- [ ] deployment anterior identificado para rollback.

## Estrutura principal

```text
src/app/                 páginas e rotas HTTP
src/components/          interface pública, player, painel e uploader
src/lib/auth/            sessão e proteção administrativa
src/lib/r2/              cliente, multipart upload e repositório de metadados
src/lib/upload/          validação, partes, progresso, retentativa e IndexedDB
src/lib/seguranca/       origem e rate limiting
tests/unit/              regras puras
tests/integration/       autenticação e APIs com R2 mockado
tests/e2e/               navegação desktop e celular
```

Projeto privado. Consulte [SECURITY.md](SECURITY.md) para relatar vulnerabilidades e [CONTRIBUTING.md](CONTRIBUTING.md) antes de alterar o código.
