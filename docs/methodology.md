# Methodology

> **Draft.** This document is a placeholder for the long-form treatment of Demigo's philosophy. The blog post covering the same material is (or will be) linked here once published.

## The pitch

Templates are a monologue. Demigo is a dialogue.

Traditional documentation frameworks give you a template to fill in. You stare at the blank sections. Executive dysfunction wins. Nothing ships.

Demigo inverts it: the AI interviews you, structured artifacts fall out as a side effect. You don't fill in a PRD — you have a conversation, and the PRD is a *generated view* over the decisions you made in that conversation.

## The core insight

**Decisions are the atomic unit of a project.** Not documents. Not phases. Not tasks. *Decisions*.

Every meaningful piece of thinking in a project is a decision:
- *Product decisions* — who this is for, what we're committing to, what we explicitly won't do
- *Technical decisions* — what stack, what pattern, what tradeoff
- *Learning decisions* (in the concept library) — what a concept actually means, how it works, where it breaks

Everything else — PRDs, Roadmaps, SADs, TDDs, Delivery Plans, study guides — is a *view* over decisions. Views are read-only. Views are regenerated. Views are never stale, because staleness is impossible in something you always recompute.

## Why no gates

Approval gates exist for two reasons:
1. To force sequential thinking (finish A before B)
2. To create audit trails (this was signed off by X on date Y)

In a personal or small-team context, both fail. Sequential thinking becomes procrastination on the first artifact. Audit trails become bureaucracy that nobody reads.

Demigo drops gates because:
- The self-filter at draft time catches noise upstream
- Supersession preserves history without formal state tracking
- Retrospectives close the loop naturally by naming the next move

If you need a formal approval trail (client engagement, compliance work), Demigo plays with heavier frameworks — generate the PRD view from your PDRs and hand *that* to the approver.

## Why AI-as-interviewer works

Two things:

1. **Cognitive load.** Filling in a template forces you to hold the whole structure in your head. The interviewer holds the structure; you hold one answer at a time.

2. **Better questions.** A template asks "what are the non-goals?" and you write nothing because you don't have a non-goal on the tip of your tongue. An interviewer asks "what are you *explicitly not doing*, and why?" — and pushes when your answer is thin. The second one gets better material.

The model isn't smarter than you. It's just *asking*, which is a different cognitive task than *authoring*.

## The lifecycle rule

Every decision has one structural rule: *in-place edit until shipped, supersede after.*

This is the entire lifecycle. There's no "draft," "in review," "approved," "deprecated" workflow. There's just: has code shipped against this decision yet?

- **Before ship**: the decision is still forming. Edit freely.
- **After ship**: the decision is now load-bearing. Changes create a new decision that references the old one.

The rule is simple because it maps to something real (was this actually implemented?) instead of something bureaucratic (is this in the "approved" state?).

## The self-filter

Before drafting any decision, the model asks itself:

- Is there a real alternative the user rejected? If not, this is a preference — not a decision.
- Is the consequence non-trivial? If not, this is a fact — not a decision.
- Is this reversible in under an hour? If yes, this is a detail — not a decision.

When the answer is no, the model says so and suggests inlining as a code comment or dropping. This puts the filtering at draft time, not at commit time. The user never has to be the gatekeeper.

## Why the concept library is cross-project

Knowledge doesn't respect project boundaries. Learning BGP once should benefit every project you touch afterward.

Demigo's concept library lives at `~/Developer/concepts/` — separate from any project. Projects reference concepts via `concepts.yaml`; they don't copy the source. This means:

- Single source of truth for what you know
- Confidence ratings (`shaky | solid | teach-it`) drive study guide ordering
- The library becomes a personal knowledge portfolio you can push to GitHub

## The three-layer learning stack

Learning runs through three commands, each a different granularity:

```
/demi:learn   →   /demi:teach   →   /demi:study   →   /demi:rollup study-guide
   plan               acquire             consolidate          exam prep
```

- **`/demi:learn`** captures the *plan* — scope, goals, resources, sequence — as decisions in the project. It plans; it doesn't teach.
- **`/demi:teach`** *acquires* the material. It drives a layered, anchor-first curriculum in your library's `study/` tree (`<library>/study/`), authoring one prose layer at a time or delivering an existing layer and quizzing you on it. A curriculum is 4–7 layers that teach a whole topic.
- **`/demi:study`** *consolidates* a single idea into a Feynman-tested, confidence-rated **atom** at `<library>/<topic>/`. An atom cites its curriculum layer via `source: study/<topic>/<layer-slug>`, so provenance flows plan → layer → atom.

Two content types, **one library** — the same `~/Developer/concepts/` (override `DEMI_CONCEPTS_DIR`) that holds atoms also holds curricula, under a `study/` subtree. Curricula are topics taught in layers; atoms are single ideas. A layer teaches; an atom locks in one idea from it. There's no second repo — you name your library whatever you like (one user keeps theirs at `~/Developer/garden`), but Demigo only ever knows about the one.

**A note on the word "study."** It carries two unrelated meanings, so keep them straight:
- The library's `study/` *folder* is where curricula live — the output of `/demi:teach`.
- The `/demi:study` *command* is the Feynman consolidation test — it produces atoms, not curricula.

When in doubt: "the `study/` tree" = teaching content, "`/demi:study`" = the consolidation test.

## What this is not

- Not a project management tool
- Not a documentation generator (in the "write once, publish" sense)
- Not a replacement for shipping working code
- Not opinionated about your stack, your process, or your team structure

It's a workflow that runs *around* your work, capturing the decisions you make so future-you doesn't have to reconstruct them.

## Further reading

- [`../README.md`](../README.md) — command reference and install
- [Blog post: (link when published)] — the pitch as a narrative
