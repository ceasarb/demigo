---
description: Top-of-funnel conversation. Drive product Q&A, then technical Q&A, committing decision records (PDRs/ADRs) as they emerge. No gates.
argument-hint: "<one-line idea or topic>"
---

# /brainstorm

Open-ended discovery conversation. You (Opus) drive — the user reacts.

The flow is **conversation → commit → next decision → commit → done**. There are no approval gates. The user can stop at any point; whatever's been committed is real.

## Usage

```
/brainstorm                                      # open-ended; ask what they want to build
/brainstorm "internal tool for cost dashboards"  # seeded with a topic
```

## Flow

### 1. Frame the conversation (one short message)

Tell the user how this works:

> "I'll ask product questions first to understand what we're building and why. Then we'll move into technical questions. As decisions surface, I'll draft a PDR (product) or ADR (technical) inline and ask you to commit it. Stop me whenever. No approvals, no gates."

### 2. Product discovery — drive the conversation

Ask one or two questions at a time. Do NOT dump a 10-question survey. Cover (in roughly this order, adapted to the topic):

- **Problem**: What's broken / missing / painful? Who feels it?
- **User**: Who's the primary user? Are they you, a team, a customer?
- **Today**: What do they do today instead? What's the workaround?
- **Success**: What does "this is working" look like in a sentence?
- **Non-goals**: What is this explicitly NOT? (the most underused question)
- **Constraints**: Budget, time, regulation, existing systems, team capability

After each answer, check whether a **product decision** has just surfaced. A product decision = a scoped commitment ("we're building for X user", "we're explicitly not supporting Y", "success is defined as Z"). When one surfaces:

1. Stop the broader conversation.
2. Hand off to the `/decide-product` flow inline (don't make the user re-invoke). Draft the PDR.
3. Ask: "Commit this as PDR-NNN? (y / edit / drop)"
4. On `y`: write the file to `.claude/docs/decisions/pdr-NNN-short-title.md`.
5. On `edit`: ask what to change, redraft, ask again.
6. On `drop`: discard. Note in conversation why.
7. Resume the broader conversation.

### 3. Technical discovery — only after product is roughly settled

Signal the shift explicitly: *"OK, I think we have enough product shape. Switching to technical questions."*

Cover (adapted):

- **Stack**: What's the platform / language / runtime? Constraints from existing infra?
- **Storage**: Where does state live? Durability requirements?
- **Boundaries**: What talks to what? Is there a UI? An API?
- **Deploy target**: Local, cloud, both? Which cloud(s)?
- **Risks**: What's the part that scares you / could fail?

Same loop: when a technical decision surfaces, hand off to `/decide-tech` inline, draft the ADR, ask to commit.

### 4. Wrap

When the user signals they're out of topics (or you've drafted ~3-5 decisions), wrap:

> "We've committed [list]. Next reasonable step is probably `/plan phase-1` to break the first chunk into CRAWL/WALK/RUN tasks, or `/rollup prd phase-1` to see the generated PRD view. Or just start building."

Do NOT push further questions. The user's job is to build, not to keep answering.

## Self-filter before commit

Before drafting any decision record, silently ask yourself: *"Is this actually a decision, or is it a preference / a fact / a non-load-bearing detail?"*

- **Real decision**: there was a meaningful alternative the user said no to (or could have). → Draft.
- **Preference**: "I like Postgres" with no alternative considered → inline as a note, don't commit.
- **Fact**: "We're using Python because that's what the existing system is in" → mention in conversation, but not a fresh decision worth its own file.
- **Trivial**: anything reversible in <1 hour of work → skip.

When skipping, say so briefly: *"Not committing this as a PDR — feels more like a preference than a load-bearing decision. Move on?"*

## Commit conventions

- File location: `.claude/docs/decisions/`
  - PDRs: `pdr-NNN-short-title.md`
  - ADRs: `adr-NNN-short-title.md`
- NNN is zero-padded sequential. Look at the highest existing number in the directory and increment.
- Numbers are NEVER reused.
- Use the templates from `/decide-product` and `/decide-tech` skills (or embedded here if those skills don't exist yet).

## What this command does NOT do

- It does NOT create a PRD, Roadmap, SAD, TDD, or Delivery Plan. Those are generated *views* (`/rollup`, `/plan`) over the committed PDRs/ADRs.
- It does NOT gate on approvals. Everything committed is "live" immediately.
- It does NOT enforce a particular order beyond product-then-tech. If the user wants to skip ahead, follow them.

## Tone

You are driving. Be direct. One or two questions at a time. Reflect back what you heard before drafting. The user came here to *think out loud*, not to fill in a form.
