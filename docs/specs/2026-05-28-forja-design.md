# Forja — Painel de Servidores Minecraft

**Data:** 2026-05-28
**Status:** Design aprovado, aguardando review escrito antes do plano de implementação
**Autor:** Chest maintainers

---

## 1. Objetivo

Construir um painel web de controle de servidores Minecraft self-hosted que substitua o Crafty Controller, eliminando suas dores:

- **Não polui o host** — tudo containerizado, zero deps Python/scripts/users no host
- **UI moderna** — bundle pequeno, navegação rápida, design tipo Linear/Vercel (sem cara de painel admin 2018)
- **Integração nativa** com Drasl (auth server self-hosted), Discord e Docker
- **Otimizado** — Bun runtime, SQLite local, WebSocket pra realtime, sem polling
- **Reprodutível** — `docker compose up -d` e pronto

### Não-objetivos (explícitos)

- Suporte a múltiplos jogos (Valheim, Palworld, etc.) — só Minecraft Java no MVP
- Marketplace de mods (Modrinth/CurseForge integration) — release 2+
- Multi-tenancy / billing / SaaS — uso pessoal/comunitário
- Mobile app nativo — web-only, responsivo

---

## 2. Stack

### Decisões e razões

| Camada | Escolha | Alternativas consideradas | Razão da escolha |
|---|---|---|---|
| **Runtime** | Bun 1.x | Node 22 LTS, Deno | 3-4× mais rápido, builtin TS, smaller Docker image. Fallback Node 22 se aparecer incompat em lib crítica |
| **Framework** | SvelteKit | Next.js, Nuxt, Remix | Menos boilerplate, bundle 3× menor que Next, fullstack (UI + API + WS num só app) |
| **UI** | Tailwind 4 + shadcn-svelte | Material, Mantine, Park UI | Componentes copy-paste (zero dep), full control, sem cara de AI |
| **DB** | SQLite + Drizzle ORM | Postgres, MariaDB | Zero infra, file-based, backup = `cp`. Migrar pra PG depois é trivial com Drizzle |
| **Realtime** | WebSocket nativo (`ws` package) | SSE, Socket.IO | Bidirecional (precisa enviar comandos), padrão, menos overhead |
| **Docker API** | dockerode | docker CLI subprocess, raw HTTP | Lib mais madura Node/Bun, stream nativo de logs/stats |
| **MC RCON** | rcon-client (npm) | Implementar do zero | Já testado, suporta 1.21, fire-and-forget |
| **Auth admin** | better-auth | Lucia (deprecated), Auth.js, custom | Substituto moderno do Lucia, sessions httpOnly cookie, simples |
| **Drasl integration** | Cliente HTTP da API REST do Drasl | Reimplementar | Drasl expõe REST documentada |
| **Discord** | discord.js v14 | Webhook puro, Eris | Quer eventos bidirecionais (slash commands futuros) |
| **Métricas MC** | Spark mod + `/spark tps` via RCON | mod custom, mc-monitor | Padrão da comunidade; Spark instalado no MC server, Forja invoca `/spark tps` via RCON e parseia. Quando Spark indisponível, fallback pra apenas Docker stats (CPU/RAM) sem TPS |
| **Backup** | restic em sidecar container | borg, duplicati, custom | Snapshot incremental + dedup + S3/B2 opcional |
| **Build & deploy** | Docker multi-stage | Compose puro, Nix | Imagem final <80MB, deploy `docker compose up -d` |

### Versões pinadas

- Bun: `1.x` (latest na build)
- SvelteKit: `2.x`
- Drizzle: `0.36+`
- shadcn-svelte: `latest`
- Tailwind: `4.x`
- Docker: ≥27 (suporte rootless e network IPv6 nativo)

---

## 3. Escopo do MVP (Release 1)

### Inclui

1. **Login admin**
   - 1 user fixo definido em `.env` (hash bcrypt da senha)
   - Sessão httpOnly cookie, expira em 7 dias
   - Sem cadastro público

2. **Listagem de servers MC**
   - Auto-discovery de containers com label `forja.managed=true`
   - Card por server: nome, status (running/stopped/crashed), versão MC, players, uptime

3. **Detalhe do server — abas:**

   **a) Visão geral**
   - Status, uptime, versão, players online, MOTD
   - CPU%, RAM (uso/limite), TPS, MSPT
   - Botões: Start / Stop / Restart (com confirmação)

   **b) Console**
   - Logs em tempo real via WebSocket (`docker logs -f`)
   - Input pra enviar comandos via RCON
   - Filtro por nível (INFO/WARN/ERROR), busca textual
   - Botão "limpar tela" (visual, não apaga histórico)

   **c) Players**
   - Lista de online (via RCON `list`)
   - Histórico (joins/quits últimos 30 dias)
   - Ações: kick, op/deop, ban/unban, whitelist add/remove

   **d) Mods**
   - Lista os `.jar` de `/data/mods` do container
   - Upload drag-drop (valida extensão, tamanho, escreve no volume)
   - Toggle enabled/disabled (renomeia pra `.jar.disabled`)
   - Botão "restart pra aplicar"

   **e) Config**
   - Editor de `server.properties` com schema validation
   - Editor de `whitelist.json` / `ops.json` / `banned-players.json`
   - Save → restart automático (com aviso)

   **f) Logs**
   - Histórico completo (paginação)
   - Filtros (data range, level, busca)
   - Download como `.log.gz`

   **g) Backups**
   - Lista de snapshots restic
   - Botão "criar backup agora" (snapshot)
   - Botão "restaurar" (com confirmação dupla, para o server, restaura)

4. **Drasl panel**
   - Lista de players cadastrados
   - Criar player (nome + senha inicial)
   - Banir / desbanir
   - Reset senha (gera link temporário)
   - Configuração: invite-only on/off

5. **Métricas globais (dashboard)**
   - Gráfico TPS últimas 24h (Chart.js ou recharts)
   - RAM total usada pelos servers
   - Players totais online agora

6. **Discord integration (opcional, configurável)**
   - Webhook URL ou bot token nas settings
   - Notifica: server crash, server up, novo player joined, backup completed

### Não inclui (release 2+)

- Multi-user com roles (admin/operator/viewer)
- Scheduling (cron-like pra restart/backup auto)
- Marketplace de mods (download direto Modrinth/CurseForge)
- Auto-update do MC ou mods
- Suporte a outros jogos
- Templates de novos servers (one-click "criar server Fabric 1.21.1 com pack X")
- API pública / webhooks de saída

---

## 4. Arquitetura

### Visão geral

```
┌───────────────────────────────────────────────────────────┐
│  Browser → https://panel.example.com                    │
│  (HTTPS via Nginx Proxy Manager + LetsEncrypt já existente)│
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │ Container: forja (rede "proxy")    │
        │                                    │
        │  SvelteKit app (Bun)               │
        │   ├─ /            UI Svelte        │
        │   ├─ /api/*       REST endpoints   │
        │   ├─ /ws          WebSocket        │
        │   └─ /auth/*      Login/session    │
        │                                    │
        │  ▼ libs internas                   │
        │   ├─ lib/docker/  dockerode wrap   │
        │   ├─ lib/mc/      RCON + log tail  │
        │   ├─ lib/drasl/   REST client      │
        │   ├─ lib/db/      Drizzle + SQLite │
        │   └─ lib/ws/      WS handlers      │
        │                                    │
        │  Volumes:                          │
        │   ├─ ./data/db.sqlite              │
        │   ├─ ./data/uploads/               │
        │   └─ /var/run/docker.sock:ro       │
        │       (via socket-proxy)           │
        └────────────────┬───────────────────┘
                         │
        ┌────────────────┴──────────────────────────────┐
        │                                               │
        ▼                                               ▼
┌─────────────────────┐                ┌──────────────────────┐
│ docker-socket-proxy │                │  Drasl API           │
│ (Tecnativa)         │                │  https://mc.example.com │
│ Limita endpoints    │                │                      │
└──────────┬──────────┘                └──────────────────────┘
           │
           ▼  (Docker API filtrada)
┌──────────────────────────────────────────────┐
│  Containers MC (labels forja.managed=true)   │
│   ├─ dungeon-heroes                          │
│   ├─ <futuros servers>                       │
│   └─ ...                                     │
└──────────────────────────────────────────────┘
```

### Segurança do Docker socket

Mountar `/var/run/docker.sock` direto no container Forja = poder de root no host se a app for comprometida. Mitigação obrigatória: **`docker-socket-proxy`** (Tecnativa) como sidecar, expondo só:

- `CONTAINERS=1` (read/list)
- `EXEC=1` (executar comando dentro do MC)
- `POST=1` + `START=1` + `STOP=1` + `RESTART=1` (lifecycle)
- `LOGS=1` (stream logs)
- `INFO=0` `IMAGES=0` `VOLUMES=0` `NETWORKS=1` `BUILD=0` `COMMIT=0`

Forja conecta no socket-proxy via rede interna, nunca no socket direto.

### Comunicação realtime (WebSocket)

Canais:
- `/ws/server/:id/logs` — stream de `docker logs -f` filtrado pra esse container
- `/ws/server/:id/stats` — CPU%/RAM% a cada 2s via Docker stats API
- `/ws/server/:id/rcon` — entrada de comandos + resposta

Auth: cookie de sessão valida na connection upgrade.

---

## 5. Modelo de dados (SQLite + Drizzle)

```typescript
// servers.ts
{
  id: string (uuid),
  containerName: string (unique),
  displayName: string,
  rconHost: string,           // geralmente 127.0.0.1 se network_mode: host
  rconPort: number,
  rconPasswordEncrypted: string, // AES-256, key em .env
  draslPlayerSyncEnabled: boolean,
  discordChannelId: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}

// users.ts (admin do painel)
{
  id: string,
  username: string (unique),
  passwordHash: string (bcrypt),
  createdAt: timestamp,
  lastLoginAt: timestamp | null
}

// sessions.ts
{
  id: string,
  userId: string (fk),
  expiresAt: timestamp,
  createdAt: timestamp
}

// player_events.ts (histórico join/leave/kick/ban)
{
  id: string,
  serverId: string (fk),
  playerName: string,
  event: 'join' | 'leave' | 'kick' | 'ban' | 'unban' | 'op' | 'deop',
  reason: string | null,
  performedBy: string | null,  // null se foi natural
  timestamp: timestamp
}

// metric_snapshots.ts (TPS/RAM/CPU histórico, ring buffer 30 dias)
{
  id: integer (autoincrement),
  serverId: string (fk),
  timestamp: timestamp,
  tps: real,
  mspt: real,
  cpuPercent: real,
  ramUsedMb: integer,
  playersOnline: integer
}

// backups.ts
{
  id: string,
  serverId: string (fk),
  resticSnapshotId: string,
  sizeBytes: integer,
  createdAt: timestamp,
  notes: string | null
}

// settings.ts (key-value pra config global)
{
  key: string (pk),
  value: text (JSON)
}
```

### Migrations

- Drizzle Kit, migrations versionadas em `src/lib/db/migrations/`
- Auto-aplicar na inicialização do app (idempotente)
- Rollback manual via `bun run db:rollback`

---

## 6. Estrutura de pastas

```
forja/
├── docker-compose.yml              # painel + socket-proxy + restic
├── Dockerfile                      # multi-stage build (deps → build → runtime)
├── .dockerignore
├── .env.example                    # template de variáveis
├── package.json
├── bun.lockb
├── tsconfig.json
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
├── drizzle.config.ts
│
├── src/
│   ├── app.html                    # template HTML SvelteKit
│   ├── app.d.ts                    # types globais
│   ├── hooks.server.ts             # session middleware
│   │
│   ├── routes/                     # SvelteKit file-based routing
│   │   ├── +layout.svelte          # shell global (sidebar, nav)
│   │   ├── +layout.server.ts       # auth guard
│   │   ├── (auth)/                 # rotas sem auth
│   │   │   └── login/+page.svelte
│   │   ├── (app)/                  # rotas autenticadas
│   │   │   ├── dashboard/+page.svelte
│   │   │   ├── servers/
│   │   │   │   ├── +page.svelte    # lista
│   │   │   │   └── [id]/
│   │   │   │       ├── +page.svelte         # overview
│   │   │   │       ├── console/+page.svelte
│   │   │   │       ├── players/+page.svelte
│   │   │   │       ├── mods/+page.svelte
│   │   │   │       ├── config/+page.svelte
│   │   │   │       ├── logs/+page.svelte
│   │   │   │       └── backups/+page.svelte
│   │   │   ├── drasl/+page.svelte
│   │   │   └── settings/+page.svelte
│   │   └── api/
│   │       ├── servers/+server.ts          # CRUD via Docker API
│   │       ├── servers/[id]/control/+server.ts  # start/stop/restart
│   │       ├── servers/[id]/rcon/+server.ts
│   │       ├── drasl/players/+server.ts
│   │       └── ws/+server.ts               # WebSocket upgrade
│   │
│   ├── lib/
│   │   ├── docker/
│   │   │   ├── client.ts           # dockerode singleton
│   │   │   ├── server-actions.ts   # start/stop/restart/logs/stats
│   │   │   └── socket-proxy.ts     # config socket-proxy
│   │   ├── mc/
│   │   │   ├── rcon.ts             # rcon-client wrapper
│   │   │   ├── log-parser.ts       # extrai TPS/eventos dos logs
│   │   │   ├── spark.ts            # interface com mod Spark
│   │   │   └── properties.ts       # parse/serialize server.properties
│   │   ├── drasl/
│   │   │   ├── client.ts           # REST client
│   │   │   └── types.ts
│   │   ├── db/
│   │   │   ├── index.ts            # Drizzle setup
│   │   │   ├── schema/
│   │   │   │   ├── servers.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── player-events.ts
│   │   │   │   ├── metric-snapshots.ts
│   │   │   │   ├── backups.ts
│   │   │   │   └── settings.ts
│   │   │   └── migrations/
│   │   ├── auth/
│   │   │   ├── session.ts
│   │   │   └── password.ts
│   │   ├── ws/
│   │   │   ├── server.ts           # WS handler principal
│   │   │   ├── log-stream.ts       # canal de logs
│   │   │   ├── stats-stream.ts     # canal de stats
│   │   │   └── rcon-channel.ts     # canal de comandos
│   │   ├── discord/
│   │   │   └── notifier.ts
│   │   ├── backup/
│   │   │   └── restic.ts
│   │   └── utils/
│   │       ├── crypto.ts           # AES pra RCON password
│   │       └── format.ts
│   │
│   └── components/                 # shadcn-svelte + custom
│       ├── ui/                     # shadcn-svelte (button, dialog, etc.)
│       └── forja/                  # custom (ServerCard, ConsolePane, etc.)
│
├── docs/
│   └── specs/
│       └── 2026-05-28-forja-design.md   # este doc
│
├── tests/
│   ├── unit/                       # vitest
│   └── e2e/                        # playwright
│
├── data/                           # gitignore — SQLite + uploads
│   └── .gitkeep
│
└── README.md
```

---

## 7. Fluxos críticos

### Login

1. User abre `/`, sem sessão → redirect `/login`
2. POST `/api/auth/login` com `{username, password}`
3. Server valida via bcrypt, cria sessão no DB, retorna cookie httpOnly
4. Redirect `/dashboard`
5. Toda request subsequente passa por `hooks.server.ts` que valida cookie → sessão → user

### Start server

1. User clica "Start" no card
2. POST `/api/servers/:id/control` com `{action: 'start'}`
3. Backend chama socket-proxy → `POST /containers/:name/start`
4. Em paralelo, abre conexão WS `/ws/server/:id/logs` pra mostrar boot live
5. Quando RCON responde (poll a cada 2s), marca status = "running"

### Envio de comando RCON

1. User digita comando no console + Enter
2. Frontend envia via WS no canal `/ws/server/:id/rcon`
3. Backend lê comando, conecta RCON, envia, recebe resposta
4. Backend devolve resposta no mesmo WS (echo)
5. Frontend renderiza no console (com cor distinta pra inputs vs outputs)

### Upload de mod

1. User arrasta `.jar` no dropzone
2. Frontend valida extensão + tamanho (max 100MB)
3. POST multipart `/api/servers/:id/mods` com o arquivo
4. Backend:
   - Valida MIME (`application/java-archive`) + magic bytes do .jar (PK zip signature)
   - Inspeciona o container (`docker inspect`) pra descobrir o bind mount de `/data/mods` no host (lookup em `Mounts[].Destination`)
   - Escreve o arquivo diretamente no caminho host equivalente (forja roda no mesmo host então tem acesso ao path via volume bind do compose) — **fallback**: `docker cp` se path não acessível
   - Retorna lista atualizada
5. UI mostra toast "mod adicionado, restart pra aplicar"

### Backup

1. User clica "Criar backup agora"
2. POST `/api/servers/:id/backups`
3. Backend:
   - Resolve o caminho do volume `/data` do container target via `docker inspect` (auto-discovery)
   - Spawn de um container restic ephemeral (`docker run --rm -v <path>:/source:ro restic/restic backup /source --tag=server=<name>`)
   - Captura `snapshot_id` do output JSON
4. Registra snapshot na tabela `backups` com `resticSnapshotId`, `sizeBytes`, `notes`
5. Notifica via WS no canal `/ws/server/:id/stats` quando completa
6. Repositório restic default: `./data/backup-repo/` (volume da Forja); configurável pra S3/B2/SFTP via settings

---

## 8. Error handling

### Princípios

- **Boundaries**: validação rigorosa em entrada (body, query, params) com Zod
- **Falhas Docker**: socket-proxy down → mensagem clara "infra indisponível", não 500 críptico
- **Falhas RCON**: timeout 5s, mensagem "server não respondeu", não trava UI
- **Falhas DB**: SQLite raramente falha, mas wrap em try/catch e log estruturado
- **Erros 500**: nunca mostrar stack trace ao user, sempre genérico + log no backend

### Status codes

- `400` validação de input
- `401` não autenticado
- `403` não autorizado (futuro com roles)
- `404` recurso não existe
- `409` conflito (ex: container já tem nome usado)
- `500` erro interno
- `503` infra indisponível (Docker offline, etc.)

### Logging

- Pino (fast, JSON structured) com level configurável
- Erros sempre com contexto (userId, serverId, requestId)
- Sem PII em logs

---

## 9. Testes

### Unitários (vitest)
- `lib/mc/properties.ts` — parser/serializer
- `lib/mc/log-parser.ts` — extração de eventos
- `lib/auth/password.ts` — bcrypt wrap
- `lib/utils/crypto.ts` — AES encrypt/decrypt

### Integração
- Drizzle queries com SQLite em memória
- Drasl client com mock server

### E2E (playwright)
- Fluxo de login
- Listar servers (com Docker socket mockado)
- Enviar comando RCON e ver resposta

### Coverage alvo

- `lib/*`: 80%+
- `routes/*`: smoke tests, sem alvo rígido

---

## 10. Deploy

### docker-compose.yml (do próprio Forja, simplificado)

```yaml
services:
  forja:
    build: .
    container_name: forja
    restart: unless-stopped
    networks:
      - proxy           # rede externa do NPM
      - forja-internal  # interna pra falar com socket-proxy
    environment:
      DATABASE_URL: file:./data/db.sqlite
      ADMIN_USERNAME: ${ADMIN_USERNAME}
      ADMIN_PASSWORD_HASH: ${ADMIN_PASSWORD_HASH}
      SESSION_SECRET: ${SESSION_SECRET}
      RCON_KEY: ${RCON_KEY}
      DRASL_BASE_URL: https://mc.example.com
      DOCKER_HOST: tcp://socket-proxy:2375
      DISCORD_WEBHOOK_URL: ${DISCORD_WEBHOOK_URL:-}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    depends_on:
      - socket-proxy

  socket-proxy:
    image: tecnativa/docker-socket-proxy:latest
    container_name: forja-socket-proxy
    restart: unless-stopped
    networks:
      - forja-internal
    environment:
      CONTAINERS: 1
      POST: 1
      EXEC: 1
      LOGS: 1
      INFO: 1
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

networks:
  proxy:
    external: true
  forja-internal:
    driver: bridge
```

### Configuração no NPM

- Proxy Host: `panel.example.com` → `forja:3000`
- Force SSL + HTTP/2 + LetsEncrypt

### Variáveis de ambiente obrigatórias

| Var | Descrição |
|---|---|
| `ADMIN_USERNAME` | nome do admin |
| `ADMIN_PASSWORD_HASH` | bcrypt da senha (gerado fora) |
| `SESSION_SECRET` | random 32+ bytes pra assinar sessões |
| `RCON_KEY` | random 32 bytes pra cifrar passwords RCON no DB |
| `DRASL_BASE_URL` | URL do Drasl |
| `DOCKER_HOST` | endpoint do socket-proxy |

---

## 11. Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Socket Docker comprometido = RCE no host | baixa | crítico | socket-proxy com endpoints mínimos, container forja sem capabilities extras |
| SQLite corrompido | baixa | médio | Backup automático do DB junto com server backups, WAL mode ligado |
| Bun com bug em lib crítica | média | alto | Fallback documentado pra Node 22 LTS, tests rodam em ambas |
| WebSocket scaling com muitos servers | baixa (uso pessoal) | baixo | MVP single-process, se escalar futuramente: Redis pub/sub |
| Drasl mudando API breaking | baixa | médio | Pin de versão do Drasl no compose, testes contra versão fixa |
| Upload de mod malicioso | média | alto | Validar magic bytes do jar, sandbox de leitura, sem execução no painel |

---

## 12. Métricas de sucesso

Após release 1:

1. **Funcional**: gerenciar 100% do ciclo de vida do `dungeon-heroes` sem precisar SSH no Lin
2. **Performance**:
   - First contentful paint < 800ms
   - Console WS latency < 200ms
   - Bundle JS < 200KB gzipped
3. **Footprint**:
   - Imagem Docker < 80MB
   - Idle RAM < 100MB
4. **DX**: setup de um novo server MC via UI em < 2 minutos
5. **Estabilidade**: 7 dias rodando sem crash não-recuperável

---

## 13. Próximos passos

Após aprovação deste design:
1. Invocar skill `writing-plans` pra criar plano de implementação detalhado (issues, ordem, milestones)
2. Setup do repo (init git, GitHub privado)
3. Scaffold do projeto (SvelteKit + Bun + shadcn-svelte)
4. Primeiro vertical slice: login + lista de servers + start/stop
