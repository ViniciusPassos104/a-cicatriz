# Publicação e rollback

## Preparação

1. Execute `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e` e `npm run build`.
2. Confira que nenhum vídeo, `.env.local`, token ou relatório foi adicionado ao Git.
3. Restrinja o token R2 ao bucket de produção e mantenha Preview separado quando possível.

## Git e Vercel

```bash
git init
git add .
git status
git commit -m "Publica o site oficial de A Cicatriz"
git branch -M main
git remote add origin URL_DO_REPOSITORIO_PRIVADO
git push -u origin main
```

Importe o repositório na Vercel. O framework será detectado como Next.js. Cadastre todas as variáveis de `.env.example` em **Settings > Environment Variables** e faça um novo deployment após qualquer mudança. Configure o domínio em **Settings > Domains**.

Defina `NEXT_PUBLIC_SITE_URL` como a origem canônica, por exemplo `https://www.acicatriz.com.br`, e acrescente exatamente essa origem ao CORS do R2. Não use barra final, caminho ou curinga.

## Verificação pós-publicação

1. Abra a página pública e navegue por teclado.
2. Confirme que `/admin` redireciona para login.
3. Entre, envie uma imagem pequena e reproduza um vídeo de teste.
4. Inspecione a rede: as requisições PUT do arquivo devem ir a `r2.cloudflarestorage.com`, nunca a uma Function da Vercel.
5. Faça o upload final, confira o tamanho e publique.
6. Teste busca no player, tela cheia, volume e retomada em celular.

## Rollback

No painel da Vercel, escolha um deployment saudável e promova-o. Pela CLI:

```bash
vercel rollback URL_OU_ID_DO_DEPLOYMENT
vercel rollback status
```

Um rollback de código não exclui objetos do R2. Antes de restaurar metadados, copie o JSON atual e identifique o backup correto em `configuracao/historico/`. Nunca apague o vídeo atual durante uma investigação.

Referências: [variáveis de ambiente](https://vercel.com/docs/environment-variables) e [rollback](https://vercel.com/docs/cli/rollback).
