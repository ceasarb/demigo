# Claude Code adapter

Installs Tandem prompts as Claude Code slash commands under the `/tandem:*` namespace.

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

The installer creates symlinks (or copies) from `prompts/*.md` into `~/.claude/commands/tandem/`. After install, restart Claude Code; commands are live everywhere as `/tandem:<command>`.

## What gets installed

```
~/.claude/commands/tandem/
├── brainstorm.md   →  prompts/brainstorm.md
├── concepts.md     →  prompts/concepts.md
├── decide-product.md
├── decide-tech.md
├── design.md
├── discovery.md
├── learn.md
├── plan.md
├── pull.md
├── refine.md
├── retro.md
├── rollup.md
├── scaffold.md
└── study.md
```

## Namespacing

Commands install under `tandem/` so they appear as `/tandem:brainstorm`, `/tandem:study`, etc. This avoids collisions with:

- Claude Code built-ins (`/init`, `/run`, etc.)
- Any other command set you may have installed
- The original `4D Framework` slash commands if you used those

## Uninstall

```bash
./install.sh --uninstall
```

Removes `~/.claude/commands/tandem/` and nothing else.

## Customizing the concept library location

Tandem's `/tandem:learn` and `/tandem:study` commands use a central concept library at `~/Developer/concepts/` by default. Override with an environment variable in your shell rc file:

```bash
export TANDEM_CONCEPTS_DIR="$HOME/my-knowledge"
```
