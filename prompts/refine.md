---
description: Re-open conversation on an existing PDR or ADR. Edits in-place if the decision hasn't shipped yet; otherwise supersedes with a new file.
argument-hint: "<PDR-NNN | ADR-NNN>"
---

# /refine

Iterate on an existing decision record. The mechanism depends on whether the decision has been implemented in shipped code.

## Usage

```
/refine PDR-003
/refine ADR-007
```

## Flow

### 1. Load the record

Read `.claude/docs/decisions/<pdr-or-adr>-NNN-*.md`. If not found, list nearby IDs and ask which one.

### 2. Determine lifecycle state

Ask the user (or infer from `touches:` + git history if obvious):

> "Has this decision been implemented in shipped code yet? (yes / no / partial)"

- **no** → in-place edit mode
- **yes** → supersede mode
- **partial** → ask: is the change you want to make compatible with what's already shipped? If yes, in-place. If no, supersede.

### 3a. In-place edit mode

Open a focused conversation:

> "What's changing about this decision? Walk me through it."

Cover the same fields as the original (Context, Decision, Alternatives, Consequences). The user will usually only want to change one or two — don't re-interview everything.

Draft the updated record inline. Bump the `version:` field minor (e.g., v0.1 → v0.2). Append a one-line changelog note if helpful, but don't make a ceremony of it.

Ask: *"Commit the update? (y / edit / drop)"*

On `y`: overwrite the existing file.

### 3b. Supersede mode

Open the conversation:

> "Walk me through what's changing and why the shipped version no longer fits."

Capture the new decision the same way `/decide-product` or `/decide-tech` does — but in the Context section, explicitly reference what's being superseded and what learned-in-production fact triggered the change. This is the most valuable part of the supersession trail.

Draft a NEW file with the next sequential number. Set:
- `supersedes: PDR-NNN` (or ADR-NNN) in the new file's frontmatter
- `status: active` on the new file

Ask: *"Commit as <PDR|ADR>-NEW? This will also mark <PDR|ADR>-OLD as superseded. (y / edit / drop)"*

On `y`:
- Write the new file
- Update the old file: set `status: superseded by <NEW-ID>` and `superseded_by: <NEW-ID>`
- Do NOT delete the old file. It's history.

## What this command does NOT do

- It does NOT freely rewrite shipped decisions in place. The supersede / in-place distinction matters because shipped code is the contract; you can change docs freely as long as the docs match the code.
- It does NOT require approval. Like everything in Demigo, refinement is conversation → commit → done.
- It does NOT cascade updates to generated views (PRD rollups, Roadmap views). Those are regenerated on demand by `/rollup` and `/plan`.

## Tone

You've already done the heavy interview once; this is iteration. Be lighter-touch. If the user just wants to tweak a single line, let them — don't re-run the whole interview.
