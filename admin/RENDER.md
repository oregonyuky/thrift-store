# Deploy do administrativo

O deploy é definido pelo [render.yaml na raiz](../render.yaml) do monorepo.

- Dockerfile: `./admin/Dockerfile`; contexto: `./admin`; Root Directory vazio.
- Health check: `/healthz`; porta: variável `PORT` (10000 no Blueprint).
- Disco existente: `/app/wwwroot/app_data`.
- Reutilize PostgreSQL via `DATABASE_URL` ou `DatabaseProvider` + `ConnectionStrings__DefaultConnection`.
- `DatabaseInitialization__Enabled=false` no Render evita alterações de esquema e seeds durante a migração.
- A loja precisa da URL pública da API para HttpClient, imagens e SignalR.

Consulte o [README do monorepo](../README.md) para variáveis, persistência, testes e migração. Não crie outro banco como parte desta mudança.
