<div align="center">

<img width="full" alt="Valence" src="apps/marketing/public/images/readme-hero.png" />

### AI Agent Observability & Orchestration Platform

[![GitHub stars](https://img.shields.io/github/stars/valence-sh/valence?style=flat&logo=github)](https://github.com/valence-sh/valence/stargazers)
[![GitHub release](https://img.shields.io/github/v/release/valence-sh/valence?style=flat&logo=github)](https://github.com/valence-sh/valence/releases)
[![License](https://img.shields.io/github/license/valence-sh/valence?style=flat)](LICENSE.md)
[![Twitter](https://img.shields.io/badge/@valence__sh-555?logo=x)](https://x.com/valence_sh)
[![Discord](https://img.shields.io/badge/Discord-555?logo=discord)](https://discord.gg/cZeD9WYcV7)

<br />

Orchestrate, observe, and analyze AI coding agents from a single desktop app.<br />
Deep session intelligence, context graphs, cost tracking, security monitoring, and more.

<br />

[**Download for macOS**](https://github.com/valence-sh/valence/releases/latest) &nbsp;&bull;&nbsp; [Documentation](https://docs.valence.sh) &nbsp;&bull;&nbsp; [Changelog](https://github.com/valence-sh/valence/releases) &nbsp;&bull;&nbsp; [Discord](https://discord.gg/cZeD9WYcV7)

<br />

</div>

## What Valence Does

Valence is a desktop-native platform that combines agent orchestration with deep observability. Run multiple coding agents in parallel across isolated git worktrees, while Valence automatically parses their sessions, tracks costs, monitors security, and builds a knowledge graph of everything they do.

### Orchestration
- **Run multiple agents simultaneously** across isolated git worktrees
- **Monitor all agents from one place** with real-time event streams and notifications
- **Review and edit changes** with the built-in diff viewer
- **Kanban and swim-lane views** for tracking agent task progress
- **One-click handoff** to your editor or terminal

### Observability
- **Session parsing engine** — automatically reads `~/.claude/` logs to reconstruct full conversation flows, tool executions, and subagent trees
- **Context graph** — Neo4j-powered knowledge graph linking sessions, repos, tools, and agents with community analysis
- **Cost analytics** — per-agent, per-model, per-tool cost breakdown with daily spend tracking
- **Live dashboard** — real-time event stream with human-in-the-loop intervention support
- **Cross-agent correlation** — map sessions to repos via git identity, compare agent effectiveness across projects

### Security & Safety
- **MCP Observatory** — track every tool call, run security validators, detect anomalies, flag secret leaks
- **Bash security hook** — block dangerous commands (rm /, kill system processes, git config identity changes)
- **Secret scanner** — detect API keys, tokens, and credentials in tool inputs before they're persisted
- **Path containment** — prevent agents from accessing files outside project boundaries

### Prompt & Workflow Management
- **Prompt CMS** — version-controlled prompt templates with variable extraction and visual editing
- **Workflow builder** — visual node-based workflow editor (XY-flow) with save/load persistence
- **Evaluation datasets** — create and manage test cases for prompt/agent evaluation

## Architecture

Valence is built on a fork of [Superset](https://github.com/superset-sh/superset), inheriting its desktop infrastructure (Electron + tRPC IPC, terminal daemon, git worktree management, mosaic layout) and extending it with observability, security, and AI-specific features.

```
valence/
├── apps/
│   ├── desktop/          # Electron app — the flagship application
│   ├── api/              # Lightweight backend
│   ├── streams/          # AI chat backend for trace analysis
│   ├── mobile/           # Expo mobile dashboard
│   ├── web/              # Browser client
│   └── docs/             # Documentation site
├── packages/
│   ├── observability/    # Session parsing, analysis, discovery, security
│   ├── adapters/         # Universal adapter layer for agent integrations
│   ├── db/               # PostgreSQL schema (Drizzle ORM)
│   ├── local-db/         # SQLite local-first data
│   ├── ui/               # Shared React components (shadcn/ui + Tailwind)
│   ├── auth/             # Authentication
│   └── ...               # shared, trpc, mcp, pane-layout, etc.
├── infrastructure/
│   └── docker-compose.yml  # Neo4j + ClickHouse
└── tooling/
```

### tRPC Routers (35+)

Valence exposes 35+ tRPC routers over Electron IPC:

| Category | Routers |
|:---------|:--------|
| **Inherited from Superset** | analytics, auth, auto-update, browser, browser-history, cache, changes, chat-runtime-service, chat-service, config, external, filesystem, host-service-manager, hotkeys, model-providers, notifications, permissions, ports, projects, resource-metrics, ringtone, settings, terminal, ui-state, window, workspaces |
| **Observability** | traces, context-graph, live-dashboard, cost-analytics, cross-agent, export, scheduled-reports |
| **Agent Management** | adapters, mcp-observatory, evals, prompts, workflows |

### Adapter Layer

Universal adapter pattern (inspired by [Composio](https://github.com/ComposioHQ/composio)) for connecting to any agent framework:

| Adapter | Type | Source |
|:--------|:-----|:-------|
| `ClaudeCodeLogAdapter` | Ingestion | Reads `~/.claude/` JSONL session logs |
| `ClaudeCodeHookAdapter` | Intercept | 12-hook real-time event system |
| `CodexOTelAdapter` | Ingestion | OpenTelemetry spans (stub) |
| `CursorLogAdapter` | Ingestion | Cursor log files (stub) |

### Observability Engine (`@valence/observability`)

Ported from [claude-devtools](https://github.com/matt1398/claude-devtools), this package provides:

- **Parsing** — `SessionParser`, `ClaudeMdReader`, `GitIdentityResolver`, `MessageClassifier`, `AgentConfigReader`
- **Analysis** — `ChunkBuilder`, `SubagentDetailBuilder`, `ToolExecutionBuilder`, `ConversationGroupBuilder`, `SemanticStepExtractor`
- **Discovery** — File watcher for `~/.claude/` that auto-discovers new sessions
- **Security** — Bash validator, secret scanner, path containment, tool input validation, command denylist
- **Export** — Trajectory exporter in ShareGPT JSONL format for RL training

### Infrastructure

| Service | Purpose | License |
|:--------|:--------|:--------|
| **Neo4j Community** | Context graph — sessions, repos, tools, agents, community analysis | GPL (free) |
| **ClickHouse** | High-volume trace analytics | Apache 2.0 (free) |
| **SQLite** | Local-first data (workspaces, settings, prompts, workflows) | Public domain |

## Supported Agents

| Agent | Status |
|:------|:-------|
| [Claude Code](https://github.com/anthropics/claude-code) | Full observability (log parsing + 12-hook real-time) |
| [OpenAI Codex CLI](https://github.com/openai/codex) | Orchestration supported, OTel adapter stubbed |
| [Cursor Agent](https://docs.cursor.com/agent) | Orchestration supported, log adapter stubbed |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | Orchestration supported |
| [GitHub Copilot](https://github.com/features/copilot) | Orchestration supported |
| Any CLI agent | Works in terminal — will run on Valence |

## Requirements

| Requirement | Details |
|:------------|:--------|
| **OS** | macOS (Windows/Linux untested) |
| **Runtime** | [Bun](https://bun.sh/) v1.0+ |
| **Version Control** | Git 2.20+ |
| **GitHub CLI** | [gh](https://cli.github.com/) |
| **Docker** | For Neo4j + ClickHouse (optional — core features work without) |
| **Caddy** | [caddy](https://caddyserver.com/docs/install) (for dev server) |

## Getting Started

### Quick Start (Pre-built)

**[Download Valence for macOS](https://github.com/valence-sh/valence/releases/latest)**

### Build from Source

<details>
<summary>Click to expand build instructions</summary>

**1. Clone the repository**

```bash
git clone https://github.com/valence-sh/valence.git
cd valence
```

**2. Set up environment variables** (choose one):

Option A: Full setup
```bash
cp .env.example .env
# Edit .env and fill in the values
```

Option B: Skip env validation (for quick local testing)
```bash
cp .env.example .env
echo 'SKIP_ENV_VALIDATION=1' >> .env
```

**3. Set up Caddy** (reverse proxy for Electric SQL streams):

```bash
# Install caddy: brew install caddy (macOS) or see https://caddyserver.com/docs/install
cp Caddyfile.example Caddyfile
```

**4. Start infrastructure** (optional — for context graph and analytics):

```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

**5. Install dependencies and run**

```bash
bun install
bun run dev
```

**6. Build the desktop app**

```bash
bun run build
open apps/desktop/release
```

</details>

## Keyboard Shortcuts

All shortcuts are customizable via **Settings > Keyboard Shortcuts** (`Cmd+/`). See [full documentation](https://docs.valence.sh/keyboard-shortcuts).

### Workspace Navigation

| Shortcut | Action |
|:---------|:-------|
| `Cmd+1-9` | Switch to workspace 1-9 |
| `Cmd+Option+Up/Down` | Previous/next workspace |
| `Cmd+N` | New workspace |
| `Cmd+Shift+N` | Quick create workspace |
| `Cmd+Shift+O` | Open project |

### Terminal

| Shortcut | Action |
|:---------|:-------|
| `Cmd+T` | New tab |
| `Cmd+W` | Close pane/terminal |
| `Cmd+D` | Split right |
| `Cmd+Shift+D` | Split down |
| `Cmd+K` | Clear terminal |
| `Cmd+F` | Find in terminal |
| `Cmd+Option+Left/Right` | Previous/next tab |
| `Ctrl+1-9` | Open preset 1-9 |

### Layout

| Shortcut | Action |
|:---------|:-------|
| `Cmd+B` | Toggle workspaces sidebar |
| `Cmd+L` | Toggle changes panel |
| `Cmd+O` | Open in external app |
| `Cmd+Shift+C` | Copy path |

## Configuration

Configure workspace setup and teardown in `.valence/config.json`. See [full documentation](https://docs.valence.sh/setup-teardown-scripts).

```json
{
  "setup": ["./.valence/setup.sh"],
  "teardown": ["./.valence/teardown.sh"]
}
```

| Option | Type | Description |
|:-------|:-----|:------------|
| `setup` | `string[]` | Commands to run when creating a workspace |
| `teardown` | `string[]` | Commands to run when deleting a workspace |

### Example setup script

```bash
#!/bin/bash
# .valence/setup.sh

# Copy environment variables
cp ../.env .env

# Install dependencies
bun install

# Run any other setup tasks
echo "Workspace ready!"
```

Scripts have access to environment variables:
- `VALENCE_WORKSPACE_NAME` — Name of the workspace
- `VALENCE_ROOT_PATH` — Path to the main repository

## Tech Stack

<p>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-191970?logo=Electron&logoColor=white" alt="Electron" /></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-%2320232a.svg?logo=react&logoColor=%2361DAFB" alt="React" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwindcss-%2338B2AC.svg?logo=tailwind-css&logoColor=white" alt="TailwindCSS" /></a>
  <a href="https://bun.sh/"><img src="https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white" alt="Bun" /></a>
  <a href="https://turbo.build/"><img src="https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white" alt="Turborepo" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-%23646CFF.svg?logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://biomejs.dev/"><img src="https://img.shields.io/badge/Biome-339AF0?logo=biome&logoColor=white" alt="Biome" /></a>
  <a href="https://orm.drizzle.team/"><img src="https://img.shields.io/badge/Drizzle%20ORM-FFE873?logo=drizzle&logoColor=black" alt="Drizzle ORM" /></a>
  <a href="https://neon.tech/"><img src="https://img.shields.io/badge/Neon-00E9CA?logo=neon&logoColor=white" alt="Neon" /></a>
  <a href="https://trpc.io/"><img src="https://img.shields.io/badge/tRPC-2596BE?logo=trpc&logoColor=white" alt="tRPC" /></a>
  <a href="https://neo4j.com/"><img src="https://img.shields.io/badge/Neo4j-008CC1?logo=neo4j&logoColor=white" alt="Neo4j" /></a>
  <a href="https://clickhouse.com/"><img src="https://img.shields.io/badge/ClickHouse-FFCC01?logo=clickhouse&logoColor=black" alt="ClickHouse" /></a>
</p>

## Acknowledgments

Valence builds on the work of several open-source projects:

- [Superset](https://github.com/superset-sh/superset) (ELv2) — Desktop infrastructure, terminal daemon, git worktree management, mosaic layout
- [claude-devtools](https://github.com/matt1398/claude-devtools) (MIT) — Session parsing engine, conversation analysis
- [Composio](https://github.com/ComposioHQ/composio) (MIT) — Universal adapter pattern for agent integrations
- [Aperant](https://github.com/AndyMik90/Aperant) (AGPL-3.0) — Security validators, orchestration pipeline patterns
- [Hermes Agent](https://github.com/NousResearch/hermes-agent) (Apache 2.0) — Trajectory export format, credential redaction
- [HolyClaude](https://github.com/CoderLuii/HolyClaude) (MIT) — Docker co-deployment patterns, Apprise notifications

## Private by Default

- **Source Available** — Full source is available on GitHub under Elastic License 2.0 (ELv2).
- **Local-first** — Your data stays on your machine. Neo4j, ClickHouse, and SQLite all run locally.
- **Explicit Connections** — You choose which agents, providers, and integrations to connect.

## Contributing

We welcome contributions! If you have a suggestion that would make Valence better:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

You can also [open issues](https://github.com/valence-sh/valence/issues) for bugs or feature requests.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions and code of conduct.

<a href="https://github.com/valence-sh/valence/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=valence-sh/valence" />
</a>

## Community

Join the Valence community to get help, share feedback, and connect with other users:

- **[Discord](https://discord.gg/cZeD9WYcV7)** — Chat with the team and community
- **[Twitter](https://x.com/valence_sh)** — Follow for updates and announcements
- **[GitHub Issues](https://github.com/valence-sh/valence/issues)** — Report bugs and request features
- **[GitHub Discussions](https://github.com/valence-sh/valence/discussions)** — Ask questions and share ideas

### Team

[![Avi Twitter](https://img.shields.io/badge/Avi-@avimakesrobots-555?logo=x)](https://x.com/avimakesrobots)
[![Kiet Twitter](https://img.shields.io/badge/Kiet-@flyakiet-555?logo=x)](https://x.com/flyakiet)
[![Satya Twitter](https://img.shields.io/badge/Satya-@saddle__paddle-555?logo=x)](https://x.com/saddle_paddle)

## License

Distributed under the Elastic License 2.0 (ELv2). See [LICENSE.md](LICENSE.md) for more information.
