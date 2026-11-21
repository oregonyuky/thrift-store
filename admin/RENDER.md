# Deploy do ThriftStore no Render

O projeto usa o `Dockerfile` da raiz, escuta a porta fornecida pelo Render e converte `DATABASE_URL` automaticamente para a configuração PostgreSQL do Entity Framework Core.

## Serviços

1. Crie um projeto no Render e adicione um banco Render Postgres.
2. Crie o serviço web da API a partir deste repositório usando o runtime Docker.
3. No serviço da API, defina as variáveis abaixo.
4. Use o domínio `onrender.com` fornecido pelo serviço ou configure um domínio personalizado.
5. Anexe um Persistent Disk em `/app/wwwroot/app_data` para preservar uploads e chaves criptográficas.

Mantenha uma única réplica deste serviço: o startup atualiza o esquema do banco e o volume de uploads é exclusivo da instância.

## Variáveis obrigatórias

```text
DATABASE_URL=<internal-database-url-do-render-postgres>
DatabaseProvider=PostgreSQL
Jwt__Key=<segredo-aleatorio-com-pelo-menos-32-caracteres>
Jwt__Issuer=ThriftStore
Jwt__Audience=ThriftStore
AspNetIdentity__DefaultAdmin__Email=<email-do-admin>
AspNetIdentity__DefaultAdmin__Password=<senha-forte>
AspNetIdentity__DefaultAdmin__PostCode=<cep-da-loja>
IsDemoVersion=false
Google__Customer__ClientId=<oauth-client-id-da-loja>.apps.googleusercontent.com
Cors__AllowedOrigins__0=https://<dominio-publico-do-painel>
Cors__AllowedOrigins__1=https://<dominio-publico-da-loja>
```

Use a URL interna exibida pelo Render Postgres para `DATABASE_URL`. O Render fornece `PORT` automaticamente ao serviço web. `DatabaseProvider` é explicitado por clareza, embora a presença de `DATABASE_URL` já selecione PostgreSQL no aplicativo.

## Integrações opcionais

Configure apenas as integrações usadas:

```text
MELHOR_ENVIO_TOKEN=...
MERCADO_PAGO_ACCESS_TOKEN=...
INFINITE_PAY_HANDLE=...
INFINITE_PAY_REDIRECT_URL=https://<dominio-front>/obrigado
INFINITE_PAY_WEBHOOK_URL=https://<dominio-api>/<rota-do-webhook>
```

O health check `/healthz` já está configurado em `render.yaml`. O startup cria/atualiza a estrutura do banco antes de começar a responder, portanto o primeiro deploy pode levar mais tempo.

## Ligação com o front

Mantenha API e front no mesmo projeto e região do Render. No serviço do front, use o endereço interno exibido em **Connect > Internal** para configurar:

```text
ThriftStoreApi__BaseUrl=http://<hostname-interno-da-api>:10000/
```

Substitua o placeholder pelo hostname interno informado pelo Render. Para serviços web, a porta privada `10000` encaminha para o servidor HTTP principal.
