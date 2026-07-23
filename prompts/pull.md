---
description: Add a concept from the central library (~/Developer/concepts/) into the current project's concepts.yaml manifest. The concept file itself stays in the library — projects only declare relevance.
argument-hint: "<topic/concept-slug>"
---

# /demi:pull

Declare that a concept from the central library is relevant to the current project. Adds the concept's ID to `.claude/docs/concepts.yaml`. The concept file itself stays in `~/Developer/concepts/` — projects don't store copies.

## Usage

```
/demi:pull networking/bgp-path-selection
/demi:pull gcp/vpc-peering-vs-shared-vpc
/demi:pull                                  # interactive — list library, ask which
```

## Library location

Default: `~/Developer/concepts/`. Override with `DEMI_CONCEPTS_DIR`.

## Flow

### 1. Resolve the concept

If invoked with an ID (`<topic>/<concept-slug>`):
- Check that `~/Developer/concepts/<topic>/<concept-slug>.md` exists.
- If not: surface the closest matches by topic/slug fuzzy match. Suggest `/demi:study` if it's not yet captured:
  > "No concept found at `<topic>/<concept-slug>`. Closest matches: [list]. Or capture it now with `/demi:study <concept>`?"

If invoked with no argument:
- List the library: walk `~/Developer/concepts/<topic>/` and show `<topic>/<concept-slug>` + the first-line summary (or the `concept:` frontmatter field).
- Ask: *"Which concept(s) to pull? You can name multiple."*
- Allow multi-pull in one invocation.

### 2. Update the manifest

Ensure `.claude/docs/concepts.yaml` exists. If not, create it with this skeleton:

```yaml
# Concepts pulled into this project from ~/Developer/concepts/
# Edit via /demi:pull, /demi:concepts. Source files live in the central library.
pulled: []
```

For each concept being pulled:
- If already in `pulled:`, note it: *"`<topic>/<slug>` already pulled — skipping."*
- Otherwise append to `pulled:` as a single string `<topic>/<slug>`.

Confirm: *"Pulled <N> concept(s) into `<project>`. Use `/demi:concepts` to list, or `/demi:rollup study-guide <topic>` to render a project-scoped study guide."*

### 3. Cross-reference (optional)

If the user has decisions in this project tagged with `learn` and the topic of the pulled concept matches, surface:

> "FYI — this project has plan decisions tagged `learn:<topic>` (e.g., PDR-005). The pulled concept may be load-bearing for the learning goal. No action needed; just noting the connection."

## Unpull

If the user wants to remove a concept from the project (without deleting the source):

```
/demi:pull --remove <topic/concept-slug>
```

Removes the entry from `pulled:` in `concepts.yaml`. Does NOT touch the central library.

## What this command does NOT do

- It does NOT copy the concept file into the project. Single source of truth — the library owns the content.
- It does NOT modify the concept itself. To edit a concept, use `/demi:study <concept>` and pick "Refine" when prompted.
- It does NOT pull concepts that don't exist yet. Use `/demi:study` to capture first, then `/demi:pull` if you want it in the project's manifest.
- It does NOT regenerate HTML or update views. Those are separate commands.

## Tone

Brief and operational. This is a manifest-edit command, not a conversation. Get in, confirm, get out. Show the resulting `concepts.yaml` if anything changed.
