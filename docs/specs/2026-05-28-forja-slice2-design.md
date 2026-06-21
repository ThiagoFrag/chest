# Forja — Slice 2: Multi-server + Console live + RCON + Files

**Data:** 2026-05-28
**Spec base:** [`2026-05-28-forja-design.md`](2026-05-28-forja-design.md)
**Objetivo:** Forja deixa de ser "painel que lista servers existentes" e vira **plataforma self-service de hosting MC**. Admin cria/gerencia múltiplos servers via UI, com console live, RCON, file manager básico e backups.

## Decisões alinhadas com o usuário

| Decisão    | Escolha                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| Modloaders | **Todos** suportados via `itzg/minecraft-server` (Vanilla, Paper, Fabric, Forge, NeoForge, Purpur, Spigot, Quilt) |
| Modpack    | **Upload .zip** (CurseForge/Modrinth export)                                                                      |
| Permissão  | **Só admin** (multi-user fica pro slice 3+)                                                                       |
| Auth       | Mantém Drasl (toggle por server)                                                                                  |

## Features

### 1. Wizard de criação (4 steps)

**Step 1 — Info básica**

- Nome de exibição
- Slug auto-gerado (`forja-<slug>` vira nome do container)

**Step 2 — Modloader & versão**

- Tipo: dropdown (Vanilla / Paper / Fabric / Forge / NeoForge / Purpur / Spigot / Quilt)
- Versão MC: text input (com sugestões 1.21.1, 1.20.4, etc.)
- (Se Fabric) Loader version: opcional

**Step 3 — Recursos**

- RAM (slider 1-16 GB, default 4)
- Max players (default 10)
- Difficulty (peaceful/easy/normal/hard)
- MOTD
- Port: auto-aloca primeira livre a partir de 25566 (mostra qual ficou)

**Step 4 — Mods (opcional)**

- "Pular" → cria server limpo
- Upload `.zip`: aceita formato CurseForge (`flame/manifest.json` + `minecraft/mods/`) ou Modrinth (`modrinth.index.json` + `overrides/`) ou zip simples (mods soltos)
- Backend extrai pasta `mods/` e `config/` do zip pro volume do server

**Confirmação final**

- Resumo das escolhas
- Botão "Criar e iniciar" → cria container + sobe + redireciona pro detalhe

### 2. Detalhe do server (rota `/servers/[slug]`)

**Tabs:**

**a) Overview** (já tem da slice 1, melhorada)

- Status pill + uptime + versão real (via SLP ping)
- CPU% / RAM% / Players via WebSocket (atualiza a cada 2s)
- Botões Start/Stop/Restart (já tem)

**b) Console**

- Terminal estilo xterm com cores ANSI
- Stream live via WebSocket de `docker logs -f --tail 200`
- Input no rodapé com histórico ↑↓ (last 50 cmds)
- Comandos vão via RCON
- Filtros: nível (INFO/WARN/ERROR), busca textual

**c) Players**

- Lista online (RCON `list`)
- Ações: kick, op/deop, whitelist add/remove (RCON)
- Histórico join/leave (parsing do log)

**d) Arquivos**

- Editor de `server.properties` (form com fields conhecidos + raw)
- Editor de `whitelist.json` / `ops.json`
- Upload de mods individuais (drag-drop)
- Listar/baixar `world/` (limitado, sem editar)

**e) Backups**

- Lista snapshots (tar do volume)
- Botão "Criar backup agora" → snapshot ephemeral (server precisa estar parado, ou usa `save-off`/`save-all flush` via RCON antes)
- Botão "Restaurar" (com confirmação dupla)

**f) Settings**

- Renomear server
- Editar RAM/MOTD/players (requer restart)
- Toggle "usar Drasl" (adiciona/remove authlib-injector)
- **Delete server** (vermelho, confirmação digitando o slug)

### 3. Não-funcionais

- WebSocket auth via cookie de sessão
- File uploads max 200MB (modpack zip pode ser grande)
- Container creation idempotente (se já existe com mesmo nome, erro 409)
- Port allocation: range 25565-25600 reserved pra MC, busca primeira livre

## Stack adicionada

| Lib                      | Função                                 |
| ------------------------ | -------------------------------------- |
| `ws`                     | WebSocket server-side (já vem com bun) |
| `rcon-client`            | Conectar/enviar comandos RCON          |
| `adm-zip` ou `unzipper`  | Extrair modpack zip                    |
| `xterm-svelte` ou custom | Terminal UI                            |
| `chart.js` ou skip       | Gráfico de stats (opcional)            |

## Schema changes (Drizzle migration)

```ts
// Adicionar colunas em `servers`:
modloaderType: text('modloader_type'),  // 'VANILLA' | 'PAPER' | 'FABRIC' | etc.
mcVersion: text('mc_version'),
memoryMb: integer('memory_mb'),
maxPlayers: integer('max_players').default(10),
difficulty: text('difficulty').default('normal'),
motd: text('motd'),
hostPortHttp: integer('host_port_http'),   // 25565+
hostPortRcon: integer('host_port_rcon'),
dataVolume: text('data_volume'),            // nome do volume Docker
draslEnabled: integer('drasl_enabled', { mode: 'boolean' }).default(false),
slug: text('slug').unique(),
```

## Socket-proxy: ampliar perms

Adicionar ao compose:

```yaml
environment:
  IMAGES: 1 # pra pull da itzg
  VOLUMES: 1 # pra criar volumes
  # POST=1 já tem
  # CONTAINERS=1 já tem
  # NETWORKS=1 já tem
  # POST + CONTAINERS = create
```

## Fluxo: criar server (passo a passo)

1. POST `/api/servers` com body validado (Zod)
2. Backend:
   a. Cria registro DB (status='creating')
   b. Pulls imagem `itzg/minecraft-server:java21` se necessário (via socket-proxy)
   c. Cria volume nomeado `forja-server-<slug>`
   d. Cria container `forja-<slug>` com:
   - Labels: `forja.managed=true`, `forja.display=<nome>`, `forja.slug=<slug>`
   - Env vars: `EULA=TRUE`, `TYPE=<type>`, `VERSION=<ver>`, `MEMORY=<X>G`, etc.
   - Port mapping: `<host_port>:25565`, `<host_rcon>:25575`
   - Volume mount: `forja-server-<slug>:/data`
   - Network: `proxy` (pra forja conseguir falar RCON)
     e. Se tem modpack zip: extrai e copia mods/config pro volume via `docker cp`
     f. Start container
     g. Atualiza status='running'
3. Retorna 201 com `{id, slug, hostPort}`
4. Frontend redireciona pra `/servers/<slug>`

## Fluxo: console live (WebSocket)

1. Browser abre `wss://panel.example.com/ws/server/<slug>/console`
2. Server upgrade WS, valida sessão via cookie
3. Server faz `docker.getContainer(name).logs({follow:true, stdout:true, stderr:true, tail:200})` (stream)
4. Cada chunk vira `{type:'log', data:string}` no WS
5. Browser recebe e renderiza no terminal
6. Quando user envia comando:
   - Browser send `{type:'cmd', data:'list'}` via WS
   - Server abre RCON (rcon-client), envia, recebe resposta
   - Server send `{type:'rcon-response', data:string}` via WS
7. Fechar WS = fechar logs stream + RCON

## Riscos / Mitigações

| Risco                                       | Mitigação                                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| Socket-proxy + IMAGES+VOLUMES amplia ataque | Container Forja roda non-root, sem capabilities extras                             |
| Port collision MC                           | Auto-aloca primeira livre, valida com `docker ps` antes                            |
| Modpack zip malicioso (path traversal)      | Validar paths extraídos com `path.resolve` + `startsWith(destDir)`                 |
| RCON password leak                          | Cada server tem RCON pwd random armazenado encrypted no DB (já tem `RCON_KEY` env) |
| Server zumbi (criou mas falhou)             | Status 'failed' com motivo, botão "limpar" deleta tudo                             |

## Métricas de sucesso

- Criar novo server MC vanilla via UI em < 60s (excluindo download da imagem)
- Console live: latência log < 200ms
- RCON: round-trip < 500ms
- WebSocket suporta 5+ servers abertos simultâneos no mesmo painel
