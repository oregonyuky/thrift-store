# Thrift Store

Monorepo com duas aplicações ASP.NET Core independentes: o administrativo/API e a loja pública (antiga Alie Brechó, agora Thrift Brechó). Cada aplicação mantém sua solução, camadas, processo, autenticação e imagem Docker. Não há referências de projeto entre `admin/` e `web/`.

## Loja e painel novos em Next.js (Thrift Brechó)

A loja e o painel da equipe foram refeitos em **Next.js 16 + TypeScript + Tailwind CSS 4**, com o visual descrito em [DESIGN.md](DESIGN.md). Os dois ficam no **mesmo app**, em `storefront/`, e usam a **mesma API .NET** de `admin/`, que não mudou.

| Endereço | O que é |
| --- | --- |
| `/` | Loja: vitrine, peça, carrinho e sacolinha, checkout com Pix, minhas compras, conta, ajuda, fale conosco. |
| `/painel` | Painel da equipe: visão geral, pedidos, sacolinhas, clientes, mensagens, produtos, categorias, drops, caixas e embalagens, site e usuários. Login separado do das clientes. |

No Render, o serviço `thrift-store-web` agora publica `storefront/` (veja `render.yaml`). A loja Razor antiga continua em `web/` só como referência; ela não é mais publicada.

Como funciona:

- Todas as chamadas à API saem do **servidor** Next.js (`src/lib/api.ts`). Os tokens ficam em cookies `httpOnly` assinados com `SESSION_SECRET` e nunca chegam ao JavaScript do navegador, por isso não há mudança de CORS.
- Clientes entram por `api/Customer/Login`; a equipe por `api/Security/Login`, e o token da equipe é renovado sozinho com `api/Security/RefreshToken` (`src/proxy.ts`).
- O carrinho fica num cookie do navegador e vai junto quando a cliente entra na conta.
- Endereços antigos da loja (`/Products/Details?id=…`, `/Cart`, `/Account/Login`…) redirecionam para os novos.
- O painel cobre tudo do painel antigo: pedidos (status, etiqueta e recarga de saldo do Melhor Envio), sacolinhas (prazos e configurações), clientes, mensagens, produtos, categorias, drops, caixas e categorias de embalagem, banner do site, minha empresa (remetente das etiquetas), formas de pagamento, usuários com áreas de acesso, meu perfil e "esqueci minha senha". Cada área respeita o mesmo perfil de acesso (role) do painel antigo; quem tem o perfil `Admin` vê todas.
- As telas antigas (Razor/AdminLTE) foram removidas do `admin/`: o serviço da API só responde em `/api`, `/healthz` e `/swagger` (em desenvolvimento). Abrir o endereço da API no navegador leva para `STORE_URL/painel`. `STORE_URL` (padrão `https://thrift-store-web.onrender.com`) também é usado no link do e-mail de "esqueci minha senha".
- O tempo real via SignalR virou consulta: o status do Pix é verificado a cada 5 segundos e as páginas buscam dados novos a cada visita.

### Rodar localmente

Com a API rodando em `http://localhost:5000` (seção abaixo):

```bash
cd storefront
cp .env.example .env.local   # preencha SESSION_SECRET (openssl rand -hex 32)
npm install
npm run dev                  # loja em http://localhost:5002 e painel em http://localhost:5002/painel
```

| Variável | Uso |
| --- | --- |
| `THRIFT_API_URL` (ou `ThriftStoreApi__BaseUrl`, o nome já usado no Render) | URL da API terminada em `/`. Precisa ser pública (HTTPS): o navegador carrega as fotos dela. |
| `SESSION_SECRET` | 32+ caracteres aleatórios. Obrigatório em produção; no Render é gerado pelo Blueprint. |
| `INSTAGRAM_URL`, `INSTAGRAM_ACCOUNT_ID`, `INSTAGRAM_ACCESS_TOKEN` | Opcionais: link do perfil e feed real na home. |

Imagem Docker local: `docker build -t thrift-storefront ./storefront` e `docker run -p 5002:3000 --env-file storefront/.env.local thrift-storefront`.

## Estrutura e tecnologias

```text
thrift-store/
├── admin/
│   ├── Core/
│   ├── Infrastructure/
│   ├── Presentation/ASPNET/
│   ├── Tests/Application.Tests/
│   ├── ThriftStore.sln
│   ├── Dockerfile
│   └── .dockerignore
├── web/
│   ├── src/
│   │   ├── AlieBrecho.Application/
│   │   ├── AlieBrecho.Domain/
│   │   ├── AlieBrecho.Infrastructure/
│   │   └── AlieBrecho.Presentation/
│   ├── AlieBrechoFront.slnx
│   ├── Dockerfile
│   └── .dockerignore
├── storefront/          (loja + /painel em Next.js — publicado no Render)
├── docs/history/
├── scripts/smoke.py
├── render.yaml
├── .gitignore
├── AGENTS.md
├── DESIGN.md
└── README.md
```

Todos os nove projetos foram inspecionados e usam `net10.0`. O administrativo usa EF Core 10, Npgsql/PostgreSQL, ASP.NET Identity, JWT, Razor Pages, SignalR, MediatR e AutoMapper. A loja usa Razor Pages, HttpClient, cookies e sessão em memória. **A loja não acessa PostgreSQL nem executa migrations.**

Requisitos: SDK .NET 10; Docker para as imagens; Python 3 opcional para o smoke test. Dockerfiles completos: [admin/Dockerfile](admin/Dockerfile) e [web/Dockerfile](web/Dockerfile).

## Executar localmente

Execute os comandos da raiz do monorepo. Use portas `5000` (admin) e `5002` (loja) e credenciais locais. Não reutilize configurações de produção nos testes.

### Administrativo — PowerShell

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:DatabaseProvider = 'Sqlite'
$env:ConnectionStrings__DefaultConnection = 'Data Source=app.db'
$env:DatabaseInitialization__Enabled = 'true'
$env:Jwt__Key = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$env:AspNetIdentity__DefaultAdmin__Email = 'admin@example.invalid'
$env:AspNetIdentity__DefaultAdmin__Password = [guid]::NewGuid().ToString('N') + '!aA1'
$env:Cors__AllowedOrigins__0 = 'http://localhost:5002'
dotnet restore admin/ThriftStore.sln
dotnet run --project admin/Presentation/ASPNET/ASPNET.csproj --no-launch-profile --urls http://localhost:5000
```

Guarde a senha gerada no seu gerenciador de senhas para usar o painel. Ela permanece disponível na variável desse terminal. `DATABASE_URL` e `JWT_KEY`, quando definidos, têm precedência: use um terminal de desenvolvimento sem essas variáveis de produção.

### Administrativo — Linux/macOS

```bash
export ASPNETCORE_ENVIRONMENT=Development
export DatabaseProvider=Sqlite
export ConnectionStrings__DefaultConnection='Data Source=app.db'
export DatabaseInitialization__Enabled=true
export Jwt__Key="$(openssl rand -hex 32)"
export AspNetIdentity__DefaultAdmin__Email=admin@example.invalid
export AspNetIdentity__DefaultAdmin__Password="$(openssl rand -hex 24)!aA1"
export Cors__AllowedOrigins__0=http://localhost:5002
dotnet restore admin/ThriftStore.sln
dotnet run --project admin/Presentation/ASPNET/ASPNET.csproj --no-launch-profile --urls http://localhost:5000
```

O bootstrap acima cria somente SQLite local. Para testar PostgreSQL, use um banco **descartável**, `DatabaseProvider=PostgreSQL` e `ConnectionStrings__DefaultConnection`, ou a `DATABASE_URL` desse banco. Os modelos, migrations e provedores EF existentes foram preservados.

### Loja pública — outro terminal

PowerShell:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ThriftStoreApi__BaseUrl = 'http://localhost:5000/'
dotnet restore web/AlieBrechoFront.slnx
dotnet run --project web/src/AlieBrecho.Presentation/AlieBrecho.Presentation.csproj --no-launch-profile --urls http://localhost:5002
```

Linux/macOS:

```bash
export ASPNETCORE_ENVIRONMENT=Development
export ThriftStoreApi__BaseUrl=http://localhost:5000/
dotnet restore web/AlieBrechoFront.slnx
dotnet run --project web/src/AlieBrecho.Presentation/AlieBrecho.Presentation.csproj --no-launch-profile --urls http://localhost:5002
```

Acesse `http://localhost:5002/`. Ambos os serviços oferecem `/healthz` anônimo. Esse endpoint verifica o processo HTTP, não certifica banco ou provedores externos. `PORT`, quando definido, tem precedência sobre `--urls` e liga o processo em `0.0.0.0`.

## Variáveis de ambiente

O separador `__` representa `:` na configuração ASP.NET Core. Segredos ficam no painel Render ou no ambiente local; nunca no Git. A loja não carrega `.env` automaticamente. O administrativo mantém DotNetEnv; prefira variáveis do processo e não copie `.env` para imagens.

### Administrativo

| Variável | Uso |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` no Render. |
| `PORT` | `10000` no Blueprint; Docker local usa `8080` sem override. |
| `ASPNETCORE_FORWARDEDHEADERS_ENABLED` | `true` atrás do proxy Render para reconhecer HTTPS. Não habilite indiscriminadamente em hosts expostos diretamente. |
| `DATABASE_URL` | URL PostgreSQL do **banco existente**; tem precedência sobre connection string. |
| `DatabaseProvider` + `ConnectionStrings__DefaultConnection` | Alternativa: `PostgreSQL` e connection string Npgsql; permite opções TLS específicas. |
| `DatabaseInitialization__Enabled` | `false` no Render. Default: `true` em Development, `false` nos demais ambientes. Controla criação/ajustes de esquema e seeds existentes. |
| `Jwt__Key` ou `JWT_KEY` | Chave existente, ao menos 32 caracteres. `JWT_KEY` tem precedência. Preserve-a na migração para manter tokens válidos. |
| `Jwt__Issuer`, `Jwt__Audience` | Preserve os valores atuais; o Blueprint não os presume. |
| `AspNetIdentity__DefaultAdmin__Email` | Conta existente; também usada na configuração da origem de envio. |
| `AspNetIdentity__DefaultAdmin__Password` | Somente para criar usuário pelo bootstrap. Não altera a senha de uma conta existente. |
| `AspNetIdentity__DefaultAdmin__PostCode` | CEP da origem para frete. |
| `Cors__AllowedOrigins__0` | Origem pública HTTPS da loja, sem caminho nem barra final. |
| `Cors__AllowedOrigins__1`, etc. | Outros domínios autorizados. Não use `*` com credenciais. |
| `IsDemoVersion` | `false` em produção. |
| `AllowedHosts` | Opcional: hosts públicos aceitos, separados por `;`. |

Integrações opcionais, conforme o uso atual:

| Integração | Variáveis |
| --- | --- |
| Google do cliente | `CUSTOMER_CLIENT_ID` ou `Google__Customer__ClientId`. A branch de origem já não possui login Google administrativo. |
| Melhor Envio | `MELHOR_ENVIO_BASE_URL`, `MELHOR_ENVIO_TOKEN` ou `MelhorEnvio__BaseUrl`, `MelhorEnvio__Token`. Preserve a URL atual com barra final. |
| Mercado Pago | `MERCADO_PAGO_ACCESS_TOKEN` ou `MercadoPago__AccessToken`; opções `MercadoPago__BaseUrl`, `MercadoPago__ExpirationMinutes`. |
| InfinitePay | `INFINITE_PAY_HANDLE`, `INFINITE_PAY_REDIRECT_URL`, `INFINITE_PAY_WEBHOOK_URL`; ou chaves equivalentes `InfinitePay__Handle`, `InfinitePay__RedirectUrl`, `InfinitePay__WebhookUrl`. Retorno e webhook usam URLs públicas. |
| Supabase Storage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`. Chave de serviço somente no admin. |
| SMTP | `SmtpSettings__Host`, `SmtpSettings__Port`, `SmtpSettings__UserName`, `SmtpSettings__Password`, `SmtpSettings__FromAddress`, `SmtpSettings__FromName`. Use essas chaves; SMTP não resolve automaticamente os placeholders legados. |

Novos uploads de imagens já usam Supabase na implementação original e exigem suas três variáveis. O disco conserva imagens locais legadas, documentos e configurações; ele não substitui o bucket Supabase.

### Loja pública

| Variável | Uso |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT`, `PORT` | `Production`, `10000` no Render. Docker local usa `8080`. |
| `ASPNETCORE_FORWARDEDHEADERS_ENABLED` | `true` atrás do proxy Render, para reconhecer HTTPS e emitir cookies/URLs corretamente. |
| `ThriftStoreApi__BaseUrl` | URL **pública HTTPS** do admin terminada em `/`, sem credenciais, query ou fragmento. |
| `AlieBrechoApi__BaseUrl` | Nome original ainda suportado. `ThriftStoreApi__BaseUrl` tem precedência; caminhos originais dos endpoints permanecem. |
| `Instagram__AccessToken`, `Instagram__InstagramBusinessAccountId` | Opcionais para feed real; permanecem os posts de fallback existentes. |
| `Instagram__ApiBaseUrl`, `Instagram__Limit` | Opções do feed existente. |
| `AllowedHosts` | Opcional: hosts públicos aceitos. |

A loja não recebe senha PostgreSQL, chave de assinatura JWT nem tokens de pagamento/Supabase. O JWT obtido no login é encaminhado como Bearer pelo `AlieBrechoApiAuthorizationHandler`. Cookies e sessões pertencem a cada aplicação; não compartilhe chaves Data Protection ou domínios de cookie entre elas.

## Comunicação e persistência

As páginas da loja usam HttpClient no servidor. O JavaScript usa handlers da própria loja, mas o layout publica URLs de `/hubs/catalog` e `/hubs/orders`, e a API produz URLs absolutas de imagens. Um hostname exclusivamente privado quebraria esses recursos no navegador.

A configuração usa a URL pública HTTPS para HTTP, imagens e SignalR, com CORS explícito e credenciais. Rede privada exigiria separar URLs internas e públicas, uma refatoração evitada nesta migração. A rede privada Render exige região/workspace compatíveis. [Documentação](https://render.com/docs/private-network).

| Serviço | Disco | Conteúdo |
| --- | --- | --- |
| admin | `/app/wwwroot/app_data` | Imagens, documentos, logs, `site-settings.json`, `dataprotection-keys/`. |
| web | `/app/App_Data` | `DataProtectionKeys/` para cookies e antiforgery. |

Os Dockerfiles criam os diretórios para o usuário não root .NET. Ao importar um disco, preserve a escrita para `APP_UID` (normalmente 1654). Não monte todo `/app` ou `/app/wwwroot`. Um disco vazio oculta arquivos da imagem no ponto de montagem: copie os dados/chaves atuais antes de trocar tráfego, inclusive imagens e `site-settings.json`.

Os discos são separados por serviço e exigem plano pago. `starter` e `1 GB` são os valores iniciais do Blueprint; para serviços existentes, preserve plano e tamanho reais, sem reduzir discos. [Discos no Render](https://render.com/docs/disks).

A sessão/carrinho continuam em memória e podem ser perdidos ao reiniciar, mesmo com chaves persistidas. Uma instância por aplicação foi mantida. Escalar exigiria cache de sessão compartilhado e armazenamento apropriado.

## Docker

```bash
docker build -f admin/Dockerfile -t thrift-store-admin ./admin
docker build -f web/Dockerfile -t thrift-store-web ./web
```

Crie `.env.admin` e `.env.web` locais, ignorados pelo Git, com as variáveis das tabelas (sem aspas extras nos valores). Para testar, use banco descartável. Omita `PORT` para usar os mapeamentos abaixo. Execute em dois terminais; os comandos funcionam em PowerShell e Bash:

```bash
docker volume create thrift-store-admin-data
docker volume create thrift-store-web-data
docker run --rm --name thrift-store-admin -p 5000:8080 --env-file .env.admin -v thrift-store-admin-data:/app/wwwroot/app_data thrift-store-admin
docker run --rm --name thrift-store-web -p 5002:8080 --env-file .env.web -v thrift-store-web-data:/app/App_Data thrift-store-web
```

A URL da API deve ser alcançável pelo contêiner **e pelo navegador**: use um hostname/IP da máquina acessível por ambos. `localhost` no contêiner aponta para ele próprio; `host.docker.internal` não é necessariamente resolvido pelo navegador. No Render use o domínio público HTTPS.

## Conectar ao Render após autorização

Nenhum remote, push, banco ou serviço Render foi criado/alterado nesta preparação. O Git local está em `main`, sem remote.

1. Revise [docs/MIGRATION.md](docs/MIGRATION.md), testes e histórico saneado. Rotacione nos provedores as credenciais históricas removidas que ainda forem válidas; os originais não foram reescritos.
2. Após autorização, crie no GitHub o repositório vazio `oregonyuky/thrift-store`, com a visibilidade desejada, sem README/licença inicial. Da raiz do monorepo, somente após autorização:

   ```bash
   git remote add origin https://github.com/oregonyuky/thrift-store.git
   git push -u origin main
   ```

3. Registre IDs atuais, região, planos, discos, domínios, variáveis e callbacks. Preserve PostgreSQL e dados persistidos; tenha backup/snapshot para a janela de migração. Não execute `dotnet ef database update` automaticamente.
4. Ajuste `region` de ambos os serviços no YAML para a região do PostgreSQL existente, se diferente do default do Render. Preserve planos/tamanhos atuais. Região não pode mudar depois da criação. O Blueprint não contém `databases:`.
5. Para serviços novos: **New > Blueprint > Connect** em `thrift-store`, branch `main`, Blueprint Path `render.yaml`. Deixe **Root Directory vazio**: caminhos Docker são relativos à raiz.
6. Preencha `sync: false`: banco atual, chave/issuer/audience JWT existentes, email/CEP do administrador, origem pública da loja e URL pública da API com `/` final. Use domínios efetivamente atribuídos, não inferidos pelos nomes. Atualize API URL/CORS ao acrescentar domínios.
7. Copie as integrações utilizadas. `sync: false` solicita valores só na criação inicial; para Blueprint existente, adicione novos valores em **Environment**. [Referência](https://render.com/docs/blueprint-spec).
8. Para **reutilizar serviços existentes**, nomes iguais não garantem vinculação: um novo Blueprint pode criar sufixos. Exporte a configuração atual com **Generate Blueprint** e siga o fluxo de adicionar os recursos existentes a **um único** Blueprint, preservando IDs/discos e alterando a origem Git para este repo, branch `main`, e os caminhos Docker indicados. Se já existe outro Blueprint, transfira o gerenciamento antes de sincronizar. [Recursos existentes](https://render.com/docs/infrastructure-as-code#adding-an-existing-resource).
9. Revise a prévia e clique em **Deploy Blueprint** somente após aprovação. Em serviços novos, migre arquivos/chaves antes de trocar tráfego: discos não são compartilhados. Evite dois administrativos ativos no mesmo banco: ambos executam a expiração de reservas.
10. Valide `/healthz`, login, catálogo, imagens, SignalR, carrinho e pedidos. Verifique OAuth e callbacks dos provedores nos ambientes de teste. Transfira domínios após validar; mantenha os repos antigos para consulta/rollback.

O YAML foi validado pelo schema oficial. Filtros `admin/**` e `web/**` isolam builds; `render.yaml` está incluído em ambos. `rootDir` foi omitido para permitir o gatilho do arquivo na raiz. [Filtros de monorepos](https://render.com/docs/monorepo-support).

## Build, testes e atualizações

```bash
dotnet restore admin/ThriftStore.sln
dotnet build admin/ThriftStore.sln --configuration Release
dotnet test admin/ThriftStore.sln --configuration Release --no-build
dotnet restore web/AlieBrechoFront.slnx
dotnet build web/AlieBrechoFront.slnx --configuration Release
dotnet publish admin/Presentation/ASPNET/ASPNET.csproj -c Release -o artifacts/publish/admin
dotnet publish web/src/AlieBrecho.Presentation/AlieBrecho.Presentation.csproj -c Release -o artifacts/publish/web
python scripts/smoke.py
```

No Linux, use `python3` quando necessário. O smoke test usa processos locais, SQLite descartável, credenciais aleatórias e integrações externas desativadas. Resultados/limitações: [docs/MIGRATION.md](docs/MIGRATION.md).

Atualize cada aplicação em sua pasta e execute os checks correspondentes antes de publicar branch/PR. Mudanças de contrato da API exigem validar ambas. Após a transição, concentre alterações no monorepo. Não faça `subtree pull` diretamente dos antigos históricos com credenciais; commits tardios precisam de saneamento e revisão.

O histórico foi importado com `git filter-repo` e merges independentes: todos os 99 + 29 commits de origem, autores, datas e mensagens foram preservados. Os hashes mudaram pelos prefixos e remoção de configurações sensíveis/artefatos. Os mapas em `docs/history/` relacionam hashes antigos e novos. Os repositórios originais permanecem intactos.
