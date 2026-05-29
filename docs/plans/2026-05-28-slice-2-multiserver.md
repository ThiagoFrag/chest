# Forja — Slice 2: Multi-server + Console + RCON + Files

**Spec:** [`2026-05-28-forja-slice2-design.md`](../specs/2026-05-28-forja-slice2-design.md)
**Ordem:** Backend primeiro (criar/destroy), depois Console/RCON, depois File manager.

## Tarefas

### Setup (T1-T4)

- **T1.** Estender schema DB (add modloader_type, mc_version, memory_mb, host_port_http, host_port_rcon, data_volume, drasl_enabled, slug, motd, max_players, difficulty)
- **T2.** Gerar migration `0001_slice2_servers`
- **T3.** Ampliar socket-proxy perms (IMAGES=1, VOLUMES=1)
- **T4.** Adicionar deps: `rcon-client`, `unzipper`, `@types/unzipper`

### Backend: criar/destroy server (T5-T11)

- **T5.** `lib/docker/image.ts` — wrapper pra pull imagem itzg via dockerode
- **T6.** `lib/docker/volume.ts` — create/delete volumes nomeados
- **T7.** `lib/docker/container.ts` — create container com config completa (env, ports, labels, network, volume)
- **T8.** `lib/mc/port-allocator.ts` — busca primeira porta livre no range 25565-25600
- **T9.** `lib/mc/modpack.ts` — extrai zip CurseForge/Modrinth/raw, valida paths, copia pro volume
- **T10.** API `POST /api/servers` — body validation Zod, orquestra criar volume → container → start
- **T11.** API `DELETE /api/servers/:slug` — stop + remove container + remove volume (com confirmação)

### Backend: WebSocket console + RCON (T12-T17)

- **T12.** `lib/mc/rcon.ts` — wrapper rcon-client com pool de conexões por server
- **T13.** `lib/ws/server.ts` — WS server attached ao SvelteKit (via adapter-node hook)
- **T14.** `lib/ws/console-channel.ts` — stream `docker logs -f` pro client
- **T15.** `lib/ws/rcon-channel.ts` — recebe cmd, envia via RCON, devolve resposta
- **T16.** `lib/ws/stats-channel.ts` — Docker stats stream a cada 2s
- **T17.** Hook auth WS: valida cookie de sessão no upgrade

### Backend: files (T18-T22)

- **T18.** `lib/mc/files.ts` — read/write server.properties via volume mount
- **T19.** `lib/mc/json-files.ts` — read/write whitelist/ops/banned (com lock)
- **T20.** API `GET /api/servers/:slug/properties`
- **T21.** API `PUT /api/servers/:slug/properties`
- **T22.** API `POST /api/servers/:slug/mods` — upload + validar magic bytes jar + copy via docker cp

### Backend: backups (T23-T25)

- **T23.** `lib/mc/backup.ts` — tar do volume via container ephemeral
- **T24.** API `POST /api/servers/:slug/backups` — cria snapshot
- **T25.** API `GET /api/servers/:slug/backups` — lista

### Frontend: wizard de criação (T26-T31)

- **T26.** Route `/servers/new/+page.svelte` — wizard com 4 steps usando state Svelte
- **T27.** Form `BasicInfoStep.svelte` (nome + slug auto)
- **T28.** Form `ModloaderStep.svelte` (dropdown type + version)
- **T29.** Form `ResourcesStep.svelte` (RAM slider + max players + difficulty + MOTD)
- **T30.** Form `ModpackStep.svelte` (dropzone + skip)
- **T31.** `ConfirmStep.svelte` (resumo + criar)

### Frontend: detalhe do server (T32-T40)

- **T32.** Route `/servers/[slug]/+page.svelte` — tabs nav (Overview/Console/Players/Arquivos/Backups/Settings)
- **T33.** `OverviewTab.svelte` — usa endpoint stats + SLP ping (do slice 1, já existe)
- **T34.** `ConsoleTab.svelte` — terminal com xterm.js (svelte-xterm) + WS client
- **T35.** `PlayersTab.svelte` — lista RCON + ações kick/op/ban
- **T36.** `ArquivosTab.svelte` — editor properties + lista mods + upload
- **T37.** `BackupsTab.svelte` — lista + create
- **T38.** `SettingsTab.svelte` — editar config + DELETE com confirmação
- **T39.** Componente `ConsoleTerminal.svelte` (reusable)
- **T40.** Botão "+ Novo server" na página `/servers` (link pro wizard)

### Fix MC monitor (T41-T42)

- **T41.** Trocar `127.0.0.1` por gateway docker (`172.17.0.1` ou `host.docker.internal`) no `monitor.ts`
- **T42.** Validar versão/players aparecem no card

### Deploy (T43-T46)

- **T43.** Rebuild image no Lin
- **T44.** Restart compose com novas envs socket-proxy
- **T45.** Validar criar server vanilla via UI (smoke test)
- **T46.** Validar console live + RCON num server existente

## Critério de "feito"

- [ ] Posso clicar "+ Novo server" no painel
- [ ] Wizard cria server MC vanilla 1.21.1 em < 90s
- [ ] Console live mostra boot do server
- [ ] Comando RCON `list` retorna resposta
- [ ] Players online aparecem
- [ ] Server.properties pode ser editado e salvo
- [ ] Backup criado aparece na lista
- [ ] Delete server remove container + volume
- [ ] Dungeon-heroes original continua funcionando intacto (regressão zero)

## Estimativa

40+ tarefas, 600-800 linhas de código novo. Vou trabalhar nelas em ordem, com commits lógicos por grupo.

## Riscos do plano

- WebSocket no SvelteKit adapter-node precisa de configuração específica do servidor HTTP (handler.js). Pode dar trabalho.
- `docker cp` via dockerode pra extrair modpack: API complexa, pode precisar fallback via volume direto.
- Modpack zip grande (>100MB) precisa stream upload no SvelteKit.
