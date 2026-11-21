# Relatório da migração — 21/11/2026

## Entrega local

Novo repositório Git independente em `C:\Users\felip\thrift-store-admin\thrift-store`, branch `main`, sem remote. A localização interna à pasta de trabalho permite preservar os dois checkouts originais. Abra essa pasta como workspace para trabalhar no monorepo.

Origens importadas:

| Aplicação | Branch | Commit original | Commits |
| --- | --- | --- | --- |
| `oregonyuky/thrift-store-admin` | `Render` | `ccfd3b2c5d8a2a0a5492c0278862a95778a31f1e` | 99 |
| `oregonyuky/thrift-store-web` | `main` | `72956aedfce995d41785360e2fe0a9f20ef562ec` | 29 |

Autores, datas, mensagens e commits foram preservados por importação com `git filter-repo` e merges de históricos independentes. Hashes foram reescritos para adicionar prefixos e sanear conteúdo. Consulte [admin-commit-map.txt](history/admin-commit-map.txt) e [web-commit-map.txt](history/web-commit-map.txt).

Havia credenciais literais em configurações históricas. Foram esvaziados os valores sensíveis, mantidos placeholders de ambiente, retirados `appsettings.Development.json` históricos, dados de execução/chaves e publicações compiladas. Também foi retirado o gitlink temporário `web/.tmp-projetoHtmlJs`, que não era referenciado por nenhum projeto. As imagens públicas e `site-settings.json` da versão administrativa importada foram preservados com o mesmo conteúdo. A auditoria examinou 902 blobs de texto não vendorizados, padrões de credenciais e os literais das configurações originais, sem ocorrências remanescentes nos padrões inspecionados. Isso não revoga credenciais nos provedores: valores antigos ainda válidos precisam de rotação.

Os arquivos versionados dos repositórios originais e seus remotes não foram alterados. Os arquivos locais `AGENTS.md`/`DESIGN.md` foram copiados para o monorepo. Nenhum push, criação remota, deploy, acesso ao PostgreSQL de produção ou migration em produção foi realizado.

## Arquivos entregues

A importação criou `admin/` e `web/` com suas soluções, código, testes e recursos originais. Sobre essas cópias, as mudanças são:

| Arquivo | Alteração |
| --- | --- |
| `README.md` | Estrutura, execução Windows/Linux, variáveis, Docker, conexão ao Render e procedimento de atualização. |
| `render.yaml` | Dois Web Services Docker, contextos separados, filtros incluindo o YAML, health checks, discos e entradas de ambiente sem segredos. |
| `.gitignore` | Exclui builds, configurações privadas, bancos, chaves, dados de execução e ferramentas temporárias. |
| `.gitattributes` | Normalização de texto e LF para Docker/YAML/scripts shell. |
| `AGENTS.md`, `DESIGN.md` | Diretrizes locais preservadas. |
| `docs/MIGRATION.md` | Este relatório. |
| `docs/history/admin-commit-map.txt`, `docs/history/web-commit-map.txt` | Correspondência de commits. |
| `scripts/smoke.py` | Teste HTTP repetível com publicações independentes, credenciais aleatórias e SQLite descartável. |
| `admin/Dockerfile` | Dockerfile multiestágio .NET 10 existente, com porta local 8080 explícita; mantém usuário não root e diretórios persistentes. |
| `admin/.dockerignore` | Impede inclusão de configurações locais, segredos, documentos de execução e chaves na imagem. |
| `admin/Presentation/ASPNET/Program.cs` | Respeita connection strings de ambiente; fallback SQLite somente em Development. |
| `admin/Presentation/ASPNET/BackEnd/BackEndConfiguration.cs` | Bootstrap de esquema/seeds condicionado por `DatabaseInitialization:Enabled`; produção não altera esquema por padrão. |
| `admin/Presentation/ASPNET/appsettings.json` | Remove valores de banco/admin sensíveis e defaults de provedor/CORS específicos de ambiente. |
| `admin/RENDER.md` | Aponta para o Blueprint único e elimina a orientação anterior de criar outro banco. |
| `admin/render.yaml` | Removido; substituído pelo arquivo na raiz. |
| `web/Dockerfile`, `web/.dockerignore` | Imagem própria SDK/runtime .NET 10, publicação apenas da loja e chaves persistentes fora de `wwwroot`. |
| `web/src/AlieBrecho.Infrastructure/DependencyInjection.cs` | Aceita `ThriftStoreApi` sobre a seção original `AlieBrechoApi`; valida URL HTTP(S) absoluta com `/` final. |
| `web/src/AlieBrecho.Presentation/Program.cs` | Escuta `PORT` em `0.0.0.0` e acrescenta `/healthz` anônimo. |

Nenhum `.csproj`, modelo, migration, controller de negócio, tela, CSS ou fluxo de pagamento foi alterado. As referências internas continuam relativas a cada solução. As configurações e DLLs publicadas permanecem separadas.

## Validação executada

Ambiente: Windows, SDK .NET `10.0.401`, runtime `10.0.12`. Os comandos foram executados da raiz do monorepo. Restore utilizou uma configuração temporária contendo apenas a fonte pública NuGet e cache local isolado. A primeira tentativa do admin no sandbox falhou por autenticação TLS; a repetição fora do sandbox concluiu.

| Verificação | Resultado |
| --- | --- |
| `dotnet restore admin/ThriftStore.sln` | Sucesso; avisos de dependências existentes. |
| `dotnet build admin/ThriftStore.sln --configuration Release --no-restore` | Sucesso, 0 erros, 14 avisos NuGet. |
| `dotnet test admin/ThriftStore.sln --configuration Release --no-build --no-restore` | **32 passaram, 0 falhas, 0 ignorados.** |
| `dotnet restore web/AlieBrechoFront.slnx` | Sucesso. |
| `dotnet build web/AlieBrechoFront.slnx --configuration Release --no-restore` | Sucesso, 0 erros, 0 avisos. |
| `dotnet publish` de cada projeto principal, Release | Sucesso; saídas `artifacts/publish/admin` e `artifacts/publish/web`. |
| `python scripts/smoke.py` | **22 verificações passaram** com as aplicações publicadas em Production e banco local descartável. |
| `render.yaml` | Validado com o JSON Schema oficial obtido de `https://render.com/schema/render.yaml.json`, além da conferência da documentação atual. |
| `git diff --check` | Sem erros de whitespace. |
| Comparação com as fontes originais | Mudanças limitadas aos arquivos operacionais descritos; código de negócio e projetos preservados. |
| `docker build -f admin/Dockerfile -t thrift-store-admin ./admin` | Tentado; daemon Docker não respondeu. Encerrado após 25 segundos. |
| `docker build -f web/Dockerfile -t thrift-store-web ./web` | Tentado; mesmo bloqueio. |

O smoke test cobre:

- Inicialização dos dois processos em Production, `PORT`, health checks e reconhecimento de HTTPS encaminhado pelo proxy.
- Catálogo da API, CSS de ambas as aplicações, imagens servidas pela API e rota de catálogo da loja.
- Preflight CORS com credenciais e rejeição de origem não configurada; negociação do hub público e proteção do hub autenticado.
- Criação de cliente apenas no SQLite descartável; login da loja com antiforgery, obtenção de JWT na API e cookie local; acesso à rota autenticada.
- Gravação das chaves Data Protection e leitura do cookie após reinício da loja.
- Igualdade de esquema e dados antes/depois de reiniciar o administrativo com bootstrap desativado.
- Rejeição explícita de banco ausente em Production e de URL inválida da API.

Artefatos locais ignorados: logs em `.migration/`, publicações em `artifacts/publish/` e resultado xUnit em `artifacts/TestResults/admin.trx`. As primeiras execuções do smoke identificaram ajustes necessários na cópia dos recursos e no fechamento de conexões SQLite do próprio script; foram corrigidos antes da execução final.

## Limitações e pontos pendentes de ambiente

1. **Docker/Linux:** Docker Desktop estava em execução, mas o daemon não respondeu mesmo fora do sandbox. Não foi reiniciado, para não interromper workloads existentes. As imagens precisam ser construídas e iniciadas com um daemon funcional antes do deploy. Build/publicação .NET em Windows não substituem esse teste.
2. **Dependências existentes:** NuGet reportou AutoMapper `15.1.1` (NU1903: GHSA-6vhm-j9h7-f9gh e GHSA-gpwp-5797-mjff) e a dependência transitiva System.Security.Cryptography.Pkcs `10.0.0` (NU1902/NU1903: GHSA-2fmv-rv2c-59x7 e GHSA-846f-f764-76mx). Versões foram mantidas para evitar mudanças de comportamento fora da migração; precisam de atualização em trabalho próprio.
3. **PostgreSQL real:** os testes existentes incluem verificação de modelo SQL/Npgsql, mas não foi feita conexão a um banco PostgreSQL ativo. O teste HTTP usa somente SQLite descartável. A configuração do banco existente deve ser copiada no Render sem modificar o esquema.
4. **Integrações externas:** Google, Supabase, Melhor Envio, Mercado Pago, InfinitePay, SMTP e Instagram não foram acionados com credenciais reais. Seus callbacks, tokens e domínios devem ser conferidos na validação do ambiente. Novos uploads já dependem de Supabase na implementação original.
5. **Persistência:** copiar chaves/arquivos entre serviços e verificar permissões no disco real continua necessário caso sejam criados serviços novos. Os discos não são compartilhados automaticamente. A sessão/carrinho da loja continua em memória e pode se perder no restart.
6. **Saúde:** `/healthz` é um teste do processo; não atesta disponibilidade do banco nem dos provedores. Use também os fluxos funcionais após a migração.
7. **Render:** região, planos, tamanho real dos discos, domínios e IDs atuais não foram presumidos. O README orienta preservar os valores existentes e evitar que um novo Blueprint crie serviços duplicados por coincidência de nomes.

## Publicação

As instruções completas estão em [README — Conectar ao Render](../README.md#conectar-ao-render-após-autorização). O próximo passo externo depende de autorização explícita: criar o GitHub `thrift-store`, fazer push e conectar/sincronizar o Blueprint. Os Dockerfiles e o YAML entregues são os arquivos completos para revisão, não modelos omitindo etapas de build.

Referências oficiais consultadas: [Blueprint](https://render.com/docs/blueprint-spec), [monorepos](https://render.com/docs/monorepo-support), [discos](https://render.com/docs/disks), [recursos existentes](https://render.com/docs/infrastructure-as-code), [forwarded headers ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0).
