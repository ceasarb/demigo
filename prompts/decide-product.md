---
description: Focused product-decision interview. Drives Q&A to fill a PDR (Product Decision Record), then commits it. Can be called directly or inline from /brainstorm.
argument-hint: "<the decision being made, in a phrase>"
---

# /decide-product

Capture ONE product decision as a PDR. Same shape as an ADR, but for product/scope decisions instead of technical ones.

A **PDR (Product Decision Record)** captures: who this is for, what we're committing to deliver, what we're explicitly NOT doing, why now.

## Usage

```
/decide-product                                  # ask user what decision they want to capture
/decide-product "primary user is platform engineers, not data scientists"
/decide-product "we will NOT support multi-tenant in phase 1"
```

## When to write a PDR vs. an ADR

| Looks like... | Write... |
|---|---|
| "We're committing to X user / scope / feature" | **PDR** |
| "We're explicitly NOT doing Y" | **PDR** |
| "Success means Z" | **PDR** |
| "We'll use technology / pattern X" | **ADR** |
| "We will architect this as Y" | **ADR** |

If unsure: ask "would future-me ask *what* did we promise users, or *how* did we build it?" The first is a PDR, the second an ADR.

## Flow

### 1. Identify the decision

If invoked with an argument, restate it: *"Capturing this decision: [phrase]. Walk me through it."*

If no argument, ask: *"What product decision are we capturing?"*

### 2. Interview to fill the template

Ask **one question at a time**, max two. Wait for an answer before the next. Cover:

- **Context**: What's the situation that forces this decision? What changed? What constraint surfaced?
- **Options**: What were the realistic alternatives? (At least two. If there's only one, this might not be a real decision — flag it.)
- **Choice**: What are we committing to? Phrase it as a one-sentence commitment.
- **Why this over the others**: What tipped it?
- **Consequences**: What does this make easy? What does this rule out? What new questions does it create?
- **Reversibility**: If we change our mind in 6 months, how hard is it to reverse? (cheap / moderate / expensive)

### 3. Self-filter

Before drafting, silently check:

- Is there really an alternative the user is rejecting? If not, this is a preference — say so, skip the commit.
- Is the consequence list non-trivial? If consequences are all "none / minor", this isn't load-bearing — say so.
- Could this be inlined as a one-line note in another existing PDR? If yes, suggest that instead.

If the decision doesn't pass: *"This feels more like [preference / fact / minor detail] than a load-bearing decision. I'd skip the PDR and just note it in the conversation. Sound right?"*

### 4. Draft inline

Show the user the drafted PDR in chat, in full. Use the template below.

### 5. Ask to commit

> "Commit as PDR-NNN-<short-title>? (y / edit / drop)"

- **y**: write to `.claude/docs/decisions/pdr-NNN-short-title.md`. Confirm with the path.
- **edit**: ask what to change. Redraft. Ask again.
- **drop**: discard. Note the reasoning briefly so the user has a record in chat.

## PDR Template

```markdown
---
artifact: pdr
id: PDR-NNN
version: v0.1
status: active
created: YYYY-MM-DD
phase: phase-1
tags: [product, scope]
supersedes: ~
superseded_by: ~
---

# PDR-NNN: <Short Title>

## Status

`active` | `superseded by PDR-XXX` | `deprecated`

## Context

<What situation forces this decision? What changed? Be specific.>

## Decision

<One-sentence commitment, present-tense "will". Example: "We will build for platform engineers as the sole primary user in phase 1.">

## Alternatives Considered

- **<Option A>**: <Why not.>
- **<Option B>**: <Why not.>

## Consequences

**Enables**: <What this makes easy / unblocks.>

**Rules out**: <What this explicitly cuts.>

**New questions**: <What this surfaces that we now need to answer.>

## Reversibility

`cheap` | `moderate` | `expensive` — <one line on what reversal would require>
```

## File naming

`pdr-NNN-short-title.md` where NNN is zero-padded sequential, scoped to `.claude/docs/decisions/`.

Numbers are shared across PDRs and ADRs OR separate, depending on project convention. Default: **separate sequences** (`pdr-001`, `adr-001` coexist) — easier to scan at a glance.

## Iteration model (no gates)

- **Before any code ships against this decision**: in-place edit is fine. Update the file, bump nothing.
- **After code ships against this decision**: any meaningful change creates a NEW PDR that supersedes the old one. Set `superseded_by: PDR-XXX` on the old, `supersedes: PDR-old` on the new. Old file stays in the repo as history.

`/refine PDR-NNN` handles this lifecycle.

## Tone

You're a thoughtful interviewer, not a form. If the user gives a thin answer, push once: *"Say more about that — what's actually driving it?"* If they push back, accept the thinner version and move on.
