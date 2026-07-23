# Skill adapter

Translate an **existing** Demigo prompt (`prompts/<name>.md`) into a Claude Code
**Skill** (`SKILL.md`). The prompt is the single source of truth; a skill is a
*projection* of it — regenerate, don't hand-edit.

> **Not to be confused with `/demi:skill-forge`.** This adapter mechanically
> projects a prompt Demigo already has into a skill. `/demi:skill-forge` is the
> opposite motion: a conversation that *authors a brand-new, bespoke* agent skill
> from scratch (with its own decision trail) as a deliverable. Reach for the forge
> to design an agent; reach for this adapter to mirror an existing command.

## Why this exists

Demigo capabilities are user-invoked slash commands. Some environments (e.g. an
org skill registry) want auto-invocable **skills** instead. Rather than fork the
capability, we author once in `prompts/` and project to a `SKILL.md` here.

## Usage

```bash
node adapters/skill/build-skill.mjs prompts/onboard.md            # → dist/demi-onboard/SKILL.md
node adapters/skill/build-skill.mjs prompts/onboard.md --out DIR   # custom output root
```

Output is `dist/<skill-name>/SKILL.md`. Copy that directory into a Claude Code
skills location (personal `~/.claude/skills/` or an org registry) to install.

## Field mapping

| Demigo prompt | → | Skill (`SKILL.md`) |
|---|---|---|
| filename `onboard.md` | → | `name: demi-onboard` (`demi-<cmd>`) |
| `description:` (one-line) | → | `description:` — the **trigger** text skills auto-invoke on |
| `argument-hint:` | → | folded into an **Arguments** note in the body (skills have no slash-arg convention) |
| `# /onboard` H1 | → | `# Demigo: Onboard` title |
| prompt body | → | skill instructions (verbatim) |

## Invariants

- **No external dependencies** — plain Node, mirroring `renderer/build.mjs` and the
  bash installers.
- **Requires a `description`** — skills are useless without trigger text; the
  adapter errors if the prompt lacks one.
- **Idempotent** — re-running overwrites `dist/<name>/SKILL.md`.
- **One-directional** — prompt → skill only. Never edit `SKILL.md` and expect it to
  flow back.
