# Claude Code adapter

Installs Demigo prompts as Claude Code slash commands under the `/demi:*` namespace.

## Install

From the repo root:

```bash
./install.sh                  # symlink mode (recommended — edits to prompts are live)
./install.sh --copy           # copy mode (stable; edits require reinstall)
./install.sh --uninstall      # remove
```

Or directly:

```bash
./adapters/claude-code/install.sh
```

The installer creates symlinks (or copies) from `prompts/*.md` into `~/.claude/commands/demi/`. After install, restart Claude Code; commands are live everywhere as `/demi:<command>`.

## What gets installed

```
~/.claude/commands/demi/
├── brainstorm.md   →  prompts/brainstorm.md
├── concepts.md     →  prompts/concepts.md
├── decide-product.md
├── decide-tech.md
├── design.md
├── discovery.md
├── learn.md
├── onboard.md
├── plan.md
├── pull.md
├── refine.md
├── render.md
├── retro.md
├── rollup.md
├── scaffold.md
├── skill-forge.md
├── study.md
└── teach.md
```

## Namespacing

Commands install under `demi/` so they appear as `/demi:brainstorm`, `/demi:study`, etc. This avoids collisions with:

- Claude Code built-ins (`/init`, `/run`, etc.)
- Any other command set you may have installed
- The original `4D Framework` slash commands if you used those

## Uninstall

```bash
./install.sh --uninstall
```

Removes `~/.claude/commands/demi/` and nothing else.

## Customizing the concept library location

Demigo's `/demi:learn` and `/demi:study` commands use a central concept library at `~/Developer/concepts/` by default. Override with an environment variable in your shell rc file:

```bash
export DEMI_CONCEPTS_DIR="$HOME/my-knowledge"
```
