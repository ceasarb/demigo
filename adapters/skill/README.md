# Skill adapter

Translate a Tandem prompt (`prompts/<name>.md`) into a Claude Code **Skill**
(`SKILL.md`). Per ADR-001, the prompt is the single source of truth; a skill is a
*projection* of it — regenerate, don't hand-edit.

## Why this exists

Tandem capabilities are user-invoked slash commands. Some environments (e.g. an
org skill registry) want auto-invocable **skills** instead. Rather than fork the
capability, we author once in `prompts/` and project to a `SKILL.md` here.

## Usage

```bash
node adapters/skill/build-skill.mjs prompts/onboard.md            # → dist/tandem-onboard/SKILL.md
node adapters/skill/build-skill.mjs prompts/onboard.md --out DIR   # custom output root
```

Output is `dist/<skill-name>/SKILL.md`. Copy that directory into a Claude Code
skills location (personal `~/.claude/skills/` or an org registry) to install.

## Field mapping

| Tandem prompt | → | Skill (`SKILL.md`) |
|---|---|---|
| filename `onboard.md` | → | `name: tandem-onboard` (`tandem-<cmd>`) |
| `description:` (one-line) | → | `description:` — the **trigger** text skills auto-invoke on |
| `argument-hint:` | → | folded into an **Arguments** note in the body (skills have no slash-arg convention) |
| `# /onboard` H1 | → | `# Tandem: Onboard` title |
| prompt body | → | skill instructions (verbatim) |

## Invariants

- **No external dependencies** — plain Node, mirroring `renderer/build.mjs` and the
  bash installers.
- **Requires a `description`** — skills are useless without trigger text; the
  adapter errors if the prompt lacks one.
- **Idempotent** — re-running overwrites `dist/<name>/SKILL.md`.
- **One-directional** — prompt → skill only. Never edit `SKILL.md` and expect it to
  flow back.
