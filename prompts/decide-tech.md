---
description: Focused technical-decision interview. Drives Q&A to fill an ADR (Architecture Decision Record), then commits it. Can be called directly or inline from /brainstorm.
argument-hint: "<the decision being made, in a phrase>"
---

# /decide-tech

Capture ONE technical decision as an ADR. Nygard-format, but with the Tandem lifecycle (in-place edit pre-ship, supersede post-ship — no approval gate).

## Usage

```
/decide-tech                                              # ask user what decision they want to capture
/decide-tech "use Postgres for primary store"
/decide-tech "deploy target is GKE, not Cloud Run"
```

## When to write an ADR

Write one when:
- There were two or more viable technical options and you picked one.
- The decision will be expensive to reverse (>1 day of work, or affects multiple components).
- Future-you or another engineer will ask *"why did we do this?"*
- The decision is structural (data model, deploy target, language, framework, auth approach, integration point).

Don't write one for:
- Variable naming, code style, formatting
- Reversible-in-an-hour decisions
- Decisions covered by existing org policy that you're just inheriting
- Library choices where the alternatives are essentially equivalent

## Flow

### 1. Identify the decision

If invoked with an argument, restate: *"Capturing this decision: [phrase]. Walk me through it."*

If no argument: *"What technical decision are we capturing?"*

### 2. Interview to fill the template

One question at a time. Cover:

- **Context**: What forces this decision? Existing constraints? Prior decisions in the repo? What changed?
- **Options**: What were the realistic alternatives? At least two. If only one, flag it (might not be a real decision).
- **Choice**: One-sentence commitment, present-tense "will".
- **Why this**: Decisive factor — not all factors, just what tipped it.
- **Consequences**: What this makes easy. What it makes hard. What new questions it surfaces.
- **Blast radius**: If we're wrong, what does fixing it cost? (cheap / moderate / expensive)
- **Touches**: Which files / components / phases does this affect? (helps `/depends-on` and rollups later)

### 3. Self-filter

Before drafting, check:

- Is there a real alternative? If the user can't name one, push: *"What's the second-best option? If you don't have one, this might not need an ADR."*
- Is this load-bearing? If consequences are trivial and blast radius is `cheap`, suggest inlining as a code comment instead of an ADR.

If skipping: *"This feels lightweight — I'd put it as a comment in the code rather than its own ADR. Sound right?"*

### 4. Draft inline

Show the full drafted ADR in chat. Use the template below.

### 5. Ask to commit

> "Commit as ADR-NNN-<short-title>? (y / edit / drop)"

- **y**: write to `.claude/docs/decisions/adr-NNN-short-title.md`. Confirm with the path.
- **edit**: ask what to change. Redraft. Ask again.
- **drop**: discard with a brief note on why.

## ADR Template

```markdown
---
artifact: adr
id: ADR-NNN
version: v0.1
status: active
created: YYYY-MM-DD
phase: phase-1
tags: [technical]
touches: []
supersedes: ~
superseded_by: ~
---

# ADR-NNN: <Short Title>

## Status

`active` | `superseded by ADR-XXX` | `deprecated`

## Context

<What forces this decision? Be specific about constraints and triggers.>

## Decision

<One-sentence commitment, present-tense "will".>

## Alternatives Considered

- **<Option A>**: <Why not.>
- **<Option B>**: <Why not.>

## Consequences

**Enables**: <What this makes easy.>

**Costs**: <What this makes harder or impossible.>

**New questions**: <What this surfaces that we now need to answer.>

## Blast Radius

`cheap` | `moderate` | `expensive` — <one line on what reversal would require>
```

## File naming

`adr-NNN-short-title.md` in `.claude/docs/decisions/`. Sequential, never reused.

## Iteration model (no gates)

- **Before code ships against the decision**: in-place edit. Update the same file.
- **After code ships against the decision**: meaningful changes create a NEW ADR that supersedes the old one. Update `superseded_by` / `supersedes` cross-links. Old file stays for history.

`/refine ADR-NNN` handles both cases — it checks shipped status and routes accordingly.

## Tone

Be a thoughtful tech-lead interviewer. Push on weak alternatives — if the user says "we'll use X, the alternatives are bad," ask *which* alternatives and *why* they're bad. The "why not" lines are often the most useful part of the ADR a year later.
