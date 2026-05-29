# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/).
Versionamento [Semver](https://semver.org/).

## [Unreleased]

### Pilar B (em construção)
- Cloudflare API integration pra DNS auto
- Playit.gg API integration pra túnel auto
- SRV record auto pra conectar sem porta

### Pilar C (em construção)
- LICENSE AGPL-3.0 ✓
- README com features e docs ✓
- CONTRIBUTING.md ✓
- GitHub Actions CI ✓
- Publicação ghcr.io
- i18n estrutura (pt-BR)
- Testes vitest

## [0.1.0] — 2026-05-28

### Adicionado

#### Slice 1 — MVP esqueleto
- Login admin com Argon2id + sessions httpOnly
- Listagem de servers MC via Docker label `forja.managed=true`
- Status (running/stopped) + uptime + versão MC via SLP ping
- Start/Stop/Restart via dockerode (socket-proxy)
- Deploy completo via `docker compose up -d`
- HTTPS via Nginx Proxy Manager + cert wildcard
- Validação Zod em todo input
- AES-256-GCM cifra passwords RCON no DB

#### Slice 2 — Multi-server + Console + RCON + Tema MC
- Tema visual Minecraft completo: font Monocraft, paleta MC, botões 3D vanilla
- Wizard "Novo Server" com 5 steps (info, modloader, recursos, acesso, confirmar)
- Suporte 8 modloaders: Vanilla, Paper, Fabric, Forge, NeoForge, Purpur, Spigot, Quilt
- Detalhe do server com 4 tabs (Overview, Console, Players, Settings)
- Console live via SSE (`docker logs -f` streaming)
- Input RCON com histórico ↑↓ (pool de conexões)
- Métricas tempo real via SSE Docker stats (CPU/RAM)
- Lista players online via RCON `list`
- Settings com Danger Zone (delete server + remove volume)
- Port allocation automático (range 25565-25600)
- Schema DB estendido (modloader, version, memory, ports, drasl, status)

#### Slice 3 — Community Edition (em andamento)
- Ícones MC custom SVG (grass, diamond, pickaxe, chest, sword, redstone torch)
- Player avatars via mc-heads.net
- Texturas estilo stone pattern no background
- Animações: torch flicker, redstone pulse
- Dashboard com stats reais (servers, players, status)
