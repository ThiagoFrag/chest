# Forja — Slice 1: MVP Esqueleto

**Data:** 2026-05-28
**Spec ref:** [`2026-05-28-forja-design.md`](../specs/2026-05-28-forja-design.md)
**Objetivo:** primeiro deploy funcional. Login + listar servers + start/stop/restart + status básico.

## Acceptance criteria

Quando essa fatia estiver pronta, o usuário deve conseguir:

1. Acessar `https://panel.example.com` via HTTPS (NPM proxy)
2. Logar com user/senha (senha gerada aleatória mostrada 1x)
3. Ver lista de containers MC com label `forja.managed=true`
4. Ver status (running/stopped), uptime, versão MC (do MOTD via mc-monitor)
5. Clicar start/stop/restart e ver mudança refletida
6. Logout que invalida sessão

Tudo em **um container Docker** rodando no Lin, sem poluir host.

## Out of scope (próximas fatias)

- Console / RCON (slice 2)
- Players / Drasl (slice 3)
- Mods / Config (slice 4)
- Backups / Métricas históricas (slice 5)
- Discord (slice 6)

## Decomposição em tarefas

Tarefas listadas em **ordem de execução**. Cada uma idealmente é commitável e testável isolada.

### Setup do projeto

- **T1.** Init repo: `package.json`, `tsconfig.json`, `bun.lockb`, `.gitignore`, `.editorconfig`, `.prettierrc`
- **T2.** Scaffold SvelteKit + Bun adapter (`@sveltejs/adapter-node` com Bun runtime)
- **T3.** Tailwind 4 + shadcn-svelte init (components/ui base)
- **T4.** Drizzle + SQLite setup (`db.ts`, primeira migration)
- **T5.** Estrutura de pastas conforme spec seção 6 (placeholder vazios)

### Auth & sessão

- **T6.** Schema `users` + `sessions` tables (Drizzle)
- **T7.** `lib/auth/password.ts` — bcrypt hash/verify
- **T8.** `lib/auth/session.ts` — create/validate/invalidate
- **T9.** `hooks.server.ts` — middleware que lê cookie `forja_session`, popula `locals.user`
- **T10.** Rota `(auth)/login` — form + POST handler + redirect
- **T11.** Rota `(auth)/logout` — POST que invalida sessão
- **T12.** Rota guard: `(app)/+layout.server.ts` redireciona pra `/login` se sem user

### Bootstrap admin (primeira run)

- **T13.** Script `scripts/seed-admin.ts` que:
  - Checa se já existe admin no DB
  - Se não: gera senha 24-char base64, cria user com hash bcrypt, **imprime senha no stdout do container** (visível em `docker logs forja`)
  - Idempotente (não regenera se já existir)
- **T14.** Adicionar `seed-admin` ao startup do container (Dockerfile CMD)

### Docker integration

- **T15.** `lib/docker/client.ts` — dockerode singleton apontando pro socket-proxy (`tcp://socket-proxy:2375`)
- **T16.** `lib/docker/server-actions.ts`:
  - `listManagedServers()` — `docker ps` filtrado por label `forja.managed=true`
  - `getServerStatus(id)` — `inspect` + parse de state
  - `startServer(id)` / `stopServer(id)` / `restartServer(id)`
- **T17.** Mock do Docker pra testes (sem precisar Docker rodando)

### MC integration (mínimo)

- **T18.** `lib/mc/monitor.ts` — wrapper de `mc-monitor` (CLI ou impl HTTP do protocol MC SLP)
  - `getStatus(host, port)` retorna `{online, motd, version, players}`
- **T19.** Cache de status (10s TTL) pra evitar martelar o server MC

### API routes

- **T20.** `GET /api/servers` — lista servers managed com status agregado
- **T21.** `POST /api/servers/:id/control` — body `{action: 'start'|'stop'|'restart'}`, valida com Zod, chama dockerode
- **T22.** `GET /api/servers/:id` — detalhe de 1 server

### UI

- **T23.** Layout shell: sidebar (logo Forja + nav + logout) + main content area
- **T24.** Página `/login` — form simples, error states
- **T25.** Página `/dashboard` — placeholder com "bem-vindo"
- **T26.** Página `/servers` — grid de cards
- **T27.** Componente `<ServerCard>` — nome, status pill, players count, botões action
- **T28.** Componente `<StatusPill>` — verde/cinza/vermelho conforme estado
- **T29.** Toast notifications (shadcn) pra feedback de ações

### Deploy

- **T30.** `Dockerfile` multi-stage:
  - Stage 1: install deps com bun
  - Stage 2: build SvelteKit
  - Stage 3: runtime Bun com só `build/` + `node_modules` prod
- **T31.** `docker-compose.yml` com `forja` + `socket-proxy` na rede `proxy` + `forja-internal`
- **T32.** `.env.example` com SESSION_SECRET, RCON_KEY, etc.
- **T33.** README com instruções de setup

### Validação no Lin

- **T34.** Build local + push imagem pro Lin via `docker save | ssh | docker load` OU build remoto
- **T35.** Subir compose no Lin
- **T36.** Configurar NPM: `panel.example.com` → `forja:3000` com SSL
- **T37.** Adicionar label `forja.managed=true` no container `dungeon-heroes` existente
- **T38.** Smoke test: abrir https://panel.example.com, logar, ver dungeon-heroes na lista, start/stop funciona

## Riscos da Slice 1

| Risco | Mitigação |
|---|---|
| Bun + dockerode incompatível | Validar T15 cedo; fallback Node 22 |
| docker-socket-proxy não tem endpoints necessários | Listar endpoints exatos antes de T31, ajustar env vars |
| Primeira deploy quebra dungeon-heroes | Label `forja.managed=true` é só leitura; ações vão por API com confirmação UI |

## Ordem de validação

1. **Local first**: T1-T29 em dev local com Docker do laptop
2. **Build container**: T30-T33 + rodar local
3. **Deploy Lin**: T34-T38

## Critério de "feito"

- [ ] Todas as 38 tarefas completas
- [ ] `https://panel.example.com` acessível
- [ ] Login funcionando
- [ ] dungeon-heroes aparece na lista com status correto
- [ ] Start/stop/restart funciona e reflete em <5s
- [ ] Senha admin foi entregue ao usuário
- [ ] Sem erros no console do browser / log do server
