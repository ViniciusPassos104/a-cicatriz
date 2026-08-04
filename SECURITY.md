# Segurança

Relate vulnerabilidades de forma privada ao responsável pelo projeto. Não abra uma issue pública com credenciais, URLs pré-assinadas, dados de sessão ou detalhes que facilitem exploração.

Inclua versão, rota afetada, impacto, passos mínimos de reprodução e uma sugestão de correção. Remova senhas, cookies e chaves dos registros enviados.

## Controles implementados

- senha em hash bcrypt e comparação resistente a temporização;
- JWT HMAC com expiração de oito horas em cookie HttpOnly, Secure em produção e SameSite Strict;
- CSRF vinculado à sessão, verificação de origem e limites de requisição;
- Zod em todo JSON recebido e chaves R2 restritas por formato;
- URLs pré-assinadas por dez minutos e credenciais somente no servidor;
- CSP, proteção contra enquadramento, MIME sniffing e política de permissões;
- React escapa conteúdo textual; os esquemas também recusam `<` e `>` em campos editáveis;
- confirmação forte antes da exclusão e preservação do arquivo anterior na troca;
- logs sem senhas, tokens ou chaves.

## Operação segura

- use token R2 limitado a um único bucket;
- troque `SESSION_SECRET` e a senha após qualquer suspeita;
- restrinja origens CORS e nunca use `*` em produção;
- habilite proteção adicional no firewall para `/admin` e `/api`;
- execute `npm audit` e a suíte completa em cada atualização;
- não compartilhe URLs pré-assinadas: elas funcionam como credenciais temporárias.

O limitador em memória atua por instância. Em implantação com muitas instâncias, complemente-o com WAF ou armazenamento distribuído.
