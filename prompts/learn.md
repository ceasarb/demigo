---
description: Top-of-funnel for learning a topic in depth. Self-contained in the concept library — drives planning Q&A (baseline, goals, depth, resources) committing PDRs/ADRs under the library's per-topic decisions folder, optionally scaffolds a curriculum in study/, then hands off to /teach (acquire) and /study (consolidate). No external project needed.
argument-hint: "<topic>"
---

# /demi:learn

Top-of-funnel command for *learning a new topic*. It's the **plan** layer of a three-stage learning stack:

```
/demi:learn   →   /demi:teach   →   /demi:study   →   /demi:rollup study-guide
   plan               acquire             consolidate          exam prep
 (decisions)      (curriculum)         (concept atoms)       (study guide)
```

The conversation drives:

1. **A learning plan** — committed as PDRs/ADRs *in the concept library, under the topic* (`<library>/.claude/docs/decisions/<topic>/`). Captures what you're learning, why, how deep, with what resources, and in what sequence.
2. **A handoff to acquire mode** — once the plan is solid, it optionally scaffolds a curriculum (in your library's `study/` tree) from your sequence decision and hands off to `/demi:teach <topic>`, which teaches the topic layer by layer. `/demi:study` then consolidates individual concepts into Feynman-tested atoms.

This command is the learning analog of `/demi:brainstorm`. The shape is the same: conversation → commit → done, no gates. It plans; it does not teach (that's `/demi:teach`) or grade your understanding (that's `/demi:study`).

**The learning track is self-contained in the library.** `/demi:learn`, `/demi:teach`, and `/demi:study` all read and write the concept library and *only* the concept library — plan decisions, curricula, and atoms, each organized by topic. There is **no external project repo** for learning. (This is the opposite of the software-building commands like `/demi:brainstorm` and `/demi:plan`, which are per-project.) A learning topic *is* the unit of work, and its entire footprint lives under the library:

```
<library>/                            # default ~/Developer/concepts/ (DEMI_CONCEPTS_DIR)
  .claude/docs/decisions/<topic>/     # /demi:learn — plan decisions (PDRs/ADRs)
  study/<topic>/                      # /demi:teach — curricula (anchor + layers + README)
  <topic>/                            # /demi:study — atoms (+ _html/)
```

## Usage

```
/demi:learn                                 # ask what they want to learn
/demi:learn networking
/demi:learn "gcp networking for the cert"
```

## The library is the home — no project needed

Everything this command produces lives in the concept library (`<library>`, default `~/Developer/concepts/`, override `DEMI_CONCEPTS_DIR`). You do **not** need to be inside a project, and you do **not** scaffold `.claude/docs/` into some other repo. The library is the single home for the whole learning track.

Plan decisions go to `<library>/.claude/docs/decisions/<topic>/` — the familiar Demigo decisions convention, but *inside the library and broken out per topic*. Create the folder if it doesn't exist. Curricula and atoms live at `<library>/study/<topic>/` and `<library>/<topic>/` respectively.

(Separately, a *software* project can still declare which atoms it leans on via its own `concepts.yaml` — see `/demi:pull` and `/demi:concepts`. That's a consumer of the library, not part of the learning track itself.)

If the library doesn't exist, offer to bootstrap it on first run:

> "Your concept library at `~/Developer/concepts/` doesn't exist yet. Create it now? It's its own git repo — the single home for your learning plans, curricula, and concepts."

On `y`: create the directory, copy `style.css` from the framework's `styles/concept-style.css` (or, if that doesn't exist, write the embedded fallback below), and `git init` it.

## Flow

### 1. Frame the conversation

> "We're in learn mode for **<topic>**. This is the plan layer. It feeds two things downstream:
> - **A curriculum** (`<library>/study/<topic>/`) — layered teaching content authored by `/demi:teach` from the plan we're about to make.
> - **Concept records** (your library at `~/Developer/concepts/<topic>/`) — Feynman-tested atoms captured via `/demi:study` as you internalize each concept.
>
> Right now we just make the plan — scope, goals, resources, sequence. We'll start there. Stop me at any point."

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

When a decision surfaces, draft it, confirm it, and commit it directly to `<library>/.claude/docs/decisions/<topic>/` in the standard PDR/ADR format. Do **not** delegate to `/demi:decide-product` or `/demi:decide-tech` here — those target a software project's repo; the learning track writes to the library instead.

Add `learn` and the topic name to the `tags:` array on each decision. Example: `tags: [learn, networking]`.

### 3. Scaffold the curriculum (optional)

Once you've captured 3-5 plan decisions — especially a *sequence* decision and a *connection-to-work* decision — offer to scaffold the curriculum so `/demi:teach` has somewhere to build:

> "Plan's solid. Want me to scaffold the curriculum for **<topic>**? I'll create `<library>/study/<topic>[/<lens>]/` with a README whose **Planned** layer list comes straight from your sequence decision. `/demi:teach` will author the anchor and each layer from there — one at a time. (y / n)"

Curricula live in your concept library's `study/` tree — `<library>/study/`, where `<library>` defaults to `~/Developer/concepts/` (override: `DEMI_CONCEPTS_DIR`, the same variable `/demi:study` uses). A lens (`gcp`, `azure`, …) is optional — ask if the topic is platform-specific. If the library or its `study/` tree doesn't exist, offer to create it.

On **y**:
1. Create `<library>/study/<topic>[/<lens>]/`.
2. Seed the shared renderer if it's missing. Curricula render to HTML with one topic-agnostic renderer per library at `<library>/study/_assets/`. If `<library>/study/_assets/build.mjs` isn't there yet, copy it from the staged Demigo install: `mkdir -p "<library>/study/_assets" && cp ~/.claude/commands/demi/_assets/{build.mjs,template.html,style.css} "<library>/study/_assets/"` (fall back to the framework repo's `renderer/` dir if that path is absent). Seed it once — every topic in the library shares it.
3. Write `README.md` with a short intro line and a **Planned** curriculum of 4–7 layers derived from the sequence decision (drop anything a *non-goal* decision excludes). Use the `study/networking/gcp/README.md` format. Leave a **Written** section empty — `/demi:teach` fills it as layers land.
4. Do **not** author the anchor or any layer here — that's `/demi:teach`'s job (anchor-first, one layer per invoke). This step only lays down the folder and the plan.

Skip the scaffold if the curriculum already exists or the user declines — `/demi:teach` can scaffold on its own from the same decisions.

### 4. Hand off to acquire mode (/teach)

When the user is ready to actually start learning content:

> "Ready to start learning? Use `/demi:teach <topic>` — it authors the anchor and the first layer from this plan, then teaches one layer at a time. As you internalize a concept, `/demi:study "<concept>"` runs the Feynman test and writes an atom to your library, citing the layer as its source.
>
> - `/demi:teach <topic>` *(author the anchor + first layer)*
> - later: `/demi:study "<concept>"` *(consolidate a specific idea)*
>
> Or stop here — the plan's committed. Come back to `/demi:teach` whenever you're ready."

Do NOT automatically launch `/demi:teach` or `/demi:study`. The user picks the moment.

### 5. Re-runs

If the user re-invokes `/demi:learn <topic>` later, recognize it. Read existing plan decisions at `<library>/.claude/docs/decisions/<topic>/`, the curriculum state (`<library>/study/<topic>/README.md` — Written vs Planned layers), and existing atoms in the library under `<topic>/`. Open with:

> "Picking up the learning plan for **<topic>**. So far:
> - **Plan decisions** (N): [list]
> - **Curriculum** (`study/`): [X written / Y planned layers, or "not scaffolded yet"]
> - **Concepts captured** (M): [list with confidence ratings]
>
> What's on your mind? Adjust the plan, scaffold/extend the curriculum (`/demi:teach <topic>`), or consolidate a concept (`/demi:study <concept>`)."

## Self-filter on planning decisions

Same principle as other v2 commands. Before drafting a PDR/ADR, ask:

- Is this a real commitment, or am I just restating preferences? *"I like ByteByteGo videos"* alone is not a decision; *"We'll use ByteByteGo as the primary foundations resource"* is.
- Is it load-bearing? *"Take notes in a notebook"* is process trivia; *"Capture concepts via /study into the central library"* is structural.

Lean toward fewer, better plan decisions. The point isn't to bureaucratize learning — it's to make the *strategic* choices visible so they can be revisited if they're not working.

## Mapping to your typical learning workflow

For the networking + GCP cert example:

1. `/demi:learn networking` → captures foundation-first PDR, resource ADRs, anti-goals; scaffolds the curriculum from the sequence decision.
2. `/demi:teach networking/gcp` → authors the anchor, then the first layer. Read it. Invoke again for the next layer, one at a time.
3. `/demi:study "BGP path selection"` after a layer teaches it — captures the Feynman-tested atom, citing the layer as its source.
4. Repeat (2)–(3): teach the next layer, consolidate the concepts worth retaining (not every concept you encounter).
5. `/demi:learn gcp-networking` → new sub-plan, references the foundation concepts.
6. `/demi:rollup study-guide networking` before the cert exam — aggregated HTML study guide.
7. `/demi:retro networking-cert` after the exam — what worked, what to change for the next cert.

## What this command does NOT do

- It does NOT teach the topic. Authoring layered curriculum content is `/demi:teach`'s job.
- It does NOT capture concepts. Feynman-testing an idea into an atom is `/demi:study`'s job.
- It does NOT recommend specific resources or curriculum content. You decide; the framework records. (It *does* seed a Planned layer list from your sequence decision, but the teaching is `/demi:teach`'s.)
- It does NOT track time spent, watch you complete videos, or otherwise babysit. The conversation captures decisions; you do the learning.
- It does NOT gate. Skip the plan and jump to `/demi:teach` (or straight to `/demi:study`) if you already know what you want.
- It does NOT need or create an external project. The whole learning track — plan, curriculum, atoms — lives in the concept library, organized by topic.

## Tone

You're a thoughtful learning-strategy interviewer, not a tutor. Push on vague goals (*"What does 'understand networking' actually look like?"*), push on resource choices (*"Why ByteByteGo over a textbook?"*), and surface trade-offs. But never gatekeep — if the user wants to start studying without a plan, that's their call.
