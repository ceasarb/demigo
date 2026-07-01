---
description: List concepts pulled into the current project (or, with --library, list all concepts in the central library). Shows confidence ratings and links to rendered HTML.
argument-hint: "[--library] [--topic <topic>] [--confidence <shaky|solid|teach-it>]"
---

# /tandem:concepts

List and inspect concepts — either the ones pulled into the current project, or the full central library.

## Usage

```
/tandem:concepts                              # list this project's pulled concepts
/tandem:concepts --library                    # list everything in the central library
/tandem:concepts --topic networking           # filter by topic
/tandem:concepts --confidence shaky           # filter by confidence (study targets)
/tandem:concepts --library --confidence shaky # cross-cut
```

Filters compose. Default scope is project-pulled; `--library` switches to the full library.

## Library location

Default: `~/Developer/concepts/`. Override with `TANDEM_CONCEPTS_DIR`.

## Flow

### Project scope (default)

1. Read `.claude/docs/concepts.yaml`. If it doesn't exist or `pulled:` is empty:
   > "No concepts pulled into this project yet. Use `/tandem:pull <topic/slug>` to add one, or `/tandem:concepts --library` to browse the central library."

2. For each pulled ID, read the corresponding `~/Developer/concepts/<topic>/<slug>.md` frontmatter. Collect: `concept:`, `confidence:`, `last_refined:`, and (computed) the path to the rendered HTML.

3. Apply filters (`--topic`, `--confidence`).

4. Render the list grouped by topic, sorted by confidence (shaky first — they're the study targets):

```
networking/
  shaky    →  BGP path selection           (refined 2026-06-15)   [open]
  solid    →  TCP three-way handshake      (refined 2026-06-12)   [open]
  teach-it →  OSI layers                   (refined 2026-06-08)   [open]

gcp/
  shaky    →  VPC peering vs Shared VPC    (refined 2026-06-20)   [open]
```

Where `[open]` is a clickable `file://` URL to the rendered HTML in the user's browser. Use `~/Developer/concepts/<topic>/_html/<slug>.html` resolved to absolute path.

5. Footer line:
   > "N pulled (M shaky, K solid, L teach-it). Use `/tandem:rollup study-guide <topic>` to generate a combined HTML study guide."

### Library scope (--library)

Same as project scope but walks `~/Developer/concepts/<topic>/` directories directly. Ignore concepts that are orphan-formatted (no frontmatter or malformed) — surface them in a footer warning.

### Filters

- **`--topic <name>`** — only show concepts under `<topic>/`. Multiple uses are OR (`--topic networking --topic gcp`).
- **`--confidence <level>`** — only show concepts at that confidence (`shaky`, `solid`, or `teach-it`).

When filters reduce the set to zero, say so and suggest a related search:
> "No concepts match `--topic gcp --confidence teach-it` in this project. The library has 3 such concepts under `gcp/` — try `--library`."

## Quick actions

After the list, offer a one-line menu:

> "Actions:
> - Open all shaky concepts in browser? (y)
> - Generate a study guide for the most-shaky topic? (`/tandem:rollup study-guide <topic>`)
> - Pull more concepts? (`/tandem:pull`)
>
> Or just done."

Don't auto-execute. The user picks.

## What this command does NOT do

- It does NOT modify any files. Pure read.
- It does NOT regenerate HTML. If a concept's HTML is missing or stale, surface it in the list (`[no render]`) and suggest re-running `/tandem:study <concept>` in refine mode.
- It does NOT open files automatically. It prints links/paths; the user clicks.

## Tone

Operational, scannable, no narration. The output is meant to be glanced at to plan the next study session. Keep prose minimal.
