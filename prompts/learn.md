---
description: Top-of-funnel for learning a topic in depth. Drives planning Q&A (baseline, goals, depth, resources) committing PDRs/ADRs, then offers to enter study mode for concept-level capture via /study.
argument-hint: "<topic>"
---

# /tandem:learn

Top-of-funnel command for *learning a new topic*. The conversation drives two things in sequence:

1. **A learning plan** — committed as PDRs/ADRs in the current project's `decisions/`. Captures what you're learning, why, how deep, and with what resources.
2. **A handoff to study mode** — at any point you can transition to `/tandem:study <concept>` to capture concept-level knowledge into the central concept library.

This command is the learning analog of `/tandem:brainstorm`. The shape is the same: conversation → commit → done, no gates.

## Usage

```
/tandem:learn                                 # ask what they want to learn
/tandem:learn networking
/tandem:learn "gcp networking for the cert"
```

## Central concept library

Concepts live at `~/Developer/concepts/` (the central library), not in the current project. Projects only declare *which* concepts they're using via `concepts.yaml`. See `/tandem:pull` and `/tandem:concepts`.

If `~/Developer/concepts/` doesn't exist, offer to bootstrap it on first run:

> "Your concept library at `~/Developer/concepts/` doesn't exist yet. Create it now? It's its own git repo; you'll author concepts there and pull them into projects as needed."

On `y`: create the directory, copy `style.css` from `the framework's styles/concept-style.css` (or, if that doesn't exist, write the embedded fallback below), and `git init` it.

Honor the `TANDEM_CONCEPTS_DIR` environment variable if set.

## Flow

### 1. Frame the conversation

> "We're in learn mode for **<topic>**. Two layers of output come out of this:
> - **Plan decisions** (PDRs/ADRs in this project's `decisions/`) — scope, goals, resources.
> - **Concept records** (in your library at `~/Developer/concepts/<topic>/`) — captured via `/tandem:study` when you want to deeply consolidate something.
>
> We'll start with the plan. Stop me at any point."

### 2. Planning interview — drive the conversation

One or two questions at a time. Cover:

- **Baseline**: What do you already know about this topic? Be honest — gap-finding is what makes learning efficient.
- **End-state goal**: What does "I've learned this" mean? Pass a cert? Build something specific? Hold a job conversation? Each goal implies a different depth.
- **Depth and timeline**: Surface vs. mechanism vs. "could teach it." By when?
- **Resources**: What are you considering using? (Books, courses, YouTube channels, hands-on labs, documentation.) What's already worked for similar topics?
- **Sequence**: If there are sub-topics, what order makes sense? Foundations before specifics? Practical before theoretical?
- **Anti-goals**: What are you explicitly NOT trying to learn here? (Cuts scope cheaply.)
- **Connection to current/future work**: Why this, why now? What problem does learning it solve?

After each substantive answer, check whether a real decision has surfaced. A learning decision = a scoped commitment about what you'll do or won't do:
- *"Focus on foundational networking before GCP-specific topics."* → sequencing PDR
- *"Success = pass the Pro Cloud Networking cert + design a 3-tier VPC in an interview."* → success-metric PDR
- *"Use Practical Networking on YouTube + ByteByteGo for foundations; Whizlabs + GCP docs for cert."* → resource ADR (treat as ADR because it's tactical/implementation-shaped)
- *"Explicitly NOT going to deep-dive IPv6 in this round."* → non-goal PDR

When a decision surfaces, hand off to `/tandem:decide-product` or `/tandem:decide-tech` inline (don't make the user re-invoke). Draft, confirm, commit.

Add `learn` and the topic name to the `tags:` array on each decision. Example: `tags: [learn, networking]`.

### 3. Transition to study mode

Once you've captured 3-5 plan decisions and the user is ready to actually start learning content:

> "Plan looks solid. Ready to start capturing concepts? Use `/tandem:study <concept>` to run the Feynman protocol on a specific idea — I'll drive the explanation, push on weak spots, and write the concept file to your library at `~/Developer/concepts/<topic>/`.
>
> Examples for **<topic>**:
> - `/tandem:study "OSI layers"` *(start with foundational)*
> - `/tandem:study "TCP three-way handshake"`
> - `/tandem:study "BGP path selection"` *(deeper)*
>
> Or stop here and start studying on your own — come back when you want to consolidate a concept."

Do NOT automatically launch `/tandem:study`. The user picks the moment.

### 4. Re-runs

If the user re-invokes `/tandem:learn <topic>` later, recognize it. Read existing `tags: [learn, <topic>]` decisions and existing concepts in the library under `<topic>/`. Open with:

> "Picking up the learning plan for **<topic>**. So far:
> - **Plan decisions** (N): [list]
> - **Concepts captured** (M): [list with confidence ratings]
>
> What's on your mind? Adjust the plan, capture a new concept, or refine an existing one (`/tandem:study <concept>` opens an existing concept for refinement)."

## Self-filter on planning decisions

Same principle as other v2 commands. Before drafting a PDR/ADR, ask:

- Is this a real commitment, or am I just restating preferences? *"I like ByteByteGo videos"* alone is not a decision; *"We'll use ByteByteGo as the primary foundations resource"* is.
- Is it load-bearing? *"Take notes in a notebook"* is process trivia; *"Capture concepts via /study into the central library"* is structural.

Lean toward fewer, better plan decisions. The point isn't to bureaucratize learning — it's to make the *strategic* choices visible so they can be revisited if they're not working.

## Mapping to your typical learning workflow

For the networking + GCP cert example:

1. `/tandem:learn networking` → captures foundation-first PDR, resource ADRs, anti-goals.
2. *Outside the framework*: watch videos, read, practice.
3. `/tandem:study "BGP path selection"` after you've sat with it for a session — captures the Feynman-tested explanation.
4. Repeat (3) for each concept you want to *retain* (not every concept you encounter).
5. `/tandem:learn gcp-networking` → new sub-plan, references the foundation concepts.
6. `/tandem:rollup study-guide networking` before the cert exam — aggregated HTML study guide.
7. `/tandem:retro networking-cert` after the exam — what worked, what to change for the next cert.

## What this command does NOT do

- It does NOT capture concepts. That's `/tandem:study`'s job.
- It does NOT recommend specific resources or curriculum. You decide; the framework records.
- It does NOT track time spent, watch you complete videos, or otherwise babysit. The conversation captures decisions; you do the learning.
- It does NOT gate. Skip the plan and jump to `/tandem:study` if you already know what you want to learn.

## Tone

You're a thoughtful learning-strategy interviewer, not a tutor. Push on vague goals (*"What does 'understand networking' actually look like?"*), push on resource choices (*"Why ByteByteGo over a textbook?"*), and surface trade-offs. But never gatekeep — if the user wants to start studying without a plan, that's their call.
