# Testes

## Suíte automatizada

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Os testes de integração substituem o cliente R2 por mocks determinísticos. Eles verificam autenticação, rejeição sem sessão, início, assinatura, listagem, conclusão e cancelamento sem transferir arquivos grandes.

O Playwright gera o build e testa o servidor de produção usando Microsoft Edge instalado no Windows em perfis desktop e celular. Em CI Linux, retire `channel: "msedge"` do `playwright.config.ts` e instale o Chromium com `npx playwright install --with-deps chromium`.

## Verificação manual com arquivo grande

- [ ] configure um bucket exclusivo de teste e CORS para `http://localhost:3000`;
- [ ] gere e configure senha/sessão, entre no painel e abra as ferramentas de rede;
- [ ] selecione MP4 próximo de 5 GB e confirme que nenhum POST para `/api` contém o blob;
- [ ] confirme três PUTs simultâneos diretamente ao R2 e partes próximas de 64 MiB;
- [ ] pause durante o envio e verifique que requisições ativas são abortadas;
- [ ] continue e confirme que partes concluídas não são reenviadas;
- [ ] desligue a rede, religue e continue;
- [ ] atualize a página, clique em **Continuar envio** e escolha o mesmo arquivo;
- [ ] provoque uma URL expirada e confirme nova assinatura apenas para a parte pendente;
- [ ] cancele outro upload e confirme no R2 que o multipart foi abortado;
- [ ] conclua e compare `Content-Length` do objeto com o tamanho local;
- [ ] substitua um vídeo publicado e confirme que o anterior permanece até a pergunta de exclusão;
- [ ] teste vídeo em desktop, iOS e Android, inclusive intervalo, volume, velocidade e tela cheia;
- [ ] feche o player, volte e confirme a pergunta de retomada;
- [ ] tente arquivo com 5.000.000.001 bytes, MIME incorreto e extensão trocada.

Não use o vídeo de produção em testes destrutivos. Remova o bucket de teste ou seus objetos ao concluir.
