---
description: End-of-phase retrospective. Captures learnings, proposes consolidating related decisions, and routes to whatever comes next (next phase, re-decide, rebrainstorm).
argument-hint: <phase>
---

# /retro

Run a retrospective for a completed phase. The retro itself is a short artifact, but its real job is to **decide what happens next** — and to surface "we should consolidate these N related decisions into one canonical record."

## Usage

```
/retro phase-1
```

## Where it goes

`.claude/docs/retros/retro-<phase>.md`

## Flow

### 1. Confirm the phase is actually done

Ask:

> "What 'done' looks like for this retro:
> - Is the phase deployed (or its non-deployable equivalent shipped)?
> - Are the CRAWL tasks all checked off in the delivery plan?
> - Did anything ship to real users / get used in real work?
>
> Quick read on each?"

If the answer is "not really done yet," ask whether the user wants to:
- **Defer the retro** until truly shipped
- **Run a mid-phase reset retro** (different shape — explicitly about scope changes mid-flight)

### 2. Three-question interview

Drive a tight conversation around three questions. **One question at a time.**

1. **What worked?** What about the phase you'd repeat. Be specific — name the decision, the task, the moment.
2. **What didn't?** What surprised you, what cost more than expected, what you'd do differently.
3. **What did you learn that *changes a decision*?** This is the load-bearing question. If a learning would change a PDR or ADR, that's the most important thing to capture.

Push gently on thin answers, but accept "I don't know" — retros lose value when they become interrogations.

### 3. Propose decision actions

Based on the conversation, propose actions on existing decisions:

- **Supersede**: "PDR-003 said X, but you learned Y. Want to `/refine PDR-003` and supersede with the new framing?"
- **Consolidate**: "PDR-002, PDR-004, and PDR-006 all touched the same scope question. Want to consolidate into a single canonical PDR? (I'd draft the merged PDR, mark the originals superseded, keep them in repo as history.)"
- **Deprecate**: "ADR-005 turned out not to apply — you went with a different approach in practice. Want to mark it deprecated?"

Each action is a separate y/n. The user can take all, some, or none.

### 4. Decide what's next

Ask explicitly: *"What's the next move?"* Offer the menu:

- **Start phase-N+1** — usually the default. Suggest `/brainstorm` if no phase-N+1 PDRs exist yet, or `/plan phase-N+1` if they do.
- **Revisit roadmap** — phase ordering changed. Suggest `/decide-product "do X before Y because..."` then `/rollup roadmap`.
- **Re-decide scope** — phase showed the original PDRs were wrong. Suggest `/refine` cycles on specific PDRs.
- **Stop here** — the project is done, paused, or pivoting. That's a valid outcome.

The next-move call goes into the retro file as a one-liner so future-you knows where the trail picks up.

### 5. Draft the retro file

Use this short template — retros are deliberately tight:

```markdown
---
artifact: retro
phase: <phase>
date: YYYY-MM-DD
next_move: <one-liner — start phase-N+1 | revisit roadmap | re-decide scope | stop>
---

# Retro: <Phase>

## Shipped

<One-paragraph plain-language description of what actually shipped. Concrete.>

## What Worked

- <bullet>
- <bullet>

## What Didn't

- <bullet>
- <bullet>

## Decisions Changed

- <PDR/ADR-NNN: superseded / consolidated / deprecated — one-liner why>

## Next

<The next-move call, expanded to a sentence or two.>
```

### 6. Commit

Show the user the full retro. Ask:

> "Commit to `<path>`? (y / edit / drop)"

On `y`: write file. Also execute any decision actions the user agreed to in step 3 (supersede / consolidate / deprecate).

## Retro depth scales to the project

The retro shape above is the **standard** form. If the project is heavyweight (client-grade), the user may want to add sections for stakeholder feedback, metrics review, etc. — that's their call, not a framework rule. Don't gate.

For lightweight one-shot projects, the retro can collapse to a single paragraph. Ask: *"This was a small one — short paragraph retro, or the full template?"*

## What this command does NOT do

- It does NOT score the phase.
- It does NOT generate per-decision review checklists.
- It does NOT auto-create the next phase's stubs — the user invokes the next command explicitly.

## Tone

Reflective, not evaluative. The retro's job is to capture *what we now know* and decide *what to do next*. Don't grade.
