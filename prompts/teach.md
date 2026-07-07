---
description: Acquire a topic through a layered, anchor-first curriculum in your concept library's study/ tree. Reads curriculum state and either authors the next teaching layer or delivers an existing layer and quizzes you on it. The missing middle between /learn (plan) and /study (consolidate).
argument-hint: "<topic>[/<lens>]"
---

# /tandem:teach

The **acquire** layer of the learning stack. `/tandem:learn` plans *what* and *why*; `/tandem:teach` actually teaches you the material, layer by layer; `/tandem:study` consolidates the concepts you acquired into Feynman-tested atoms.

```
/tandem:learn   →   /tandem:teach   →   /tandem:study   →   /tandem:rollup study-guide
   plan               acquire             consolidate          exam prep
 (decisions)      (curriculum)         (concept atoms)       (study guide)
```

Content lives in your **concept library** — specifically its `study/` tree, a persistent set of layered curricula you return to over weeks — not in the chat. This command *drives* it: reads where you are and does the right next thing. The chat is scaffolding; the `.md` files are the database.

## Usage

```
/tandem:teach                       # ask what topic to work on
/tandem:teach networking            # topic with no platform lens
/tandem:teach networking/gcp        # topic + platform lens (gcp, azure, ...)
/tandem:teach "terraform/gcp"
```

## Library location

One library holds both kinds of learning content: **curricula** (layered study guides, authored here) and **atoms** (Feynman concepts, authored by `/tandem:study`). One env var for both.

Default: `~/Developer/concepts/`. Override with `TANDEM_CONCEPTS_DIR` — the *same* variable `/tandem:study` uses. (Some users point it at a differently-named repo; e.g. one user keeps their library at `~/Developer/garden`.)

Within the library:
- **Curricula** live at `<library>/study/<topic>/<lens>/` (with a platform lens like `gcp` or `azure`) or `<library>/study/<topic>/` (no lens). The lens lets one topic carry `gcp` and `azure` curricula side by side — the cloud-agnostic platform-engineer brand.
- **Atoms** live at `<library>/<topic>/<slug>.md` (see `/tandem:study`).

If the library or its `study/` tree doesn't exist, offer to create it — don't error out:

> "The `study/` tree in your library (`<library>/study/`) doesn't exist yet. Create it? It holds layered curricula you'll return to as you apply the material."

On `y`: create the directory. If the library isn't already a git repo, offer to `git init` it.

**Seed the shared renderer.** Curricula render to HTML with a shared, topic-agnostic renderer that lives once per library at `<library>/study/_assets/` (`build.mjs`, `template.html`, `style.css`). Whenever you create the `study/` tree — or find it missing `_assets/build.mjs` — seed it by copying the three files from the Tandem install, which the installer stages at `~/.claude/commands/tandem/_assets/`:

```bash
mkdir -p "<library>/study/_assets"
cp ~/.claude/commands/tandem/_assets/{build.mjs,template.html,style.css} "<library>/study/_assets/"
```

If that staged path doesn't exist (e.g. Tandem was installed some other way), fall back to the framework repo's `renderer/` directory. The renderer is shared across every topic — seed it once; every curriculum in the library uses it.

## The authoring contract

When this command **authors** a layer, it follows a study-strategy contract — the non-negotiables below, inlined so the command stands on its own. If your library carries a house-style playbook (e.g. `<library>/playbooks/study-strategy.md`) or a canonical example curriculum (`<library>/study/networking/gcp/` is a good one), read it first to match voice. The non-negotiables:

- **Concrete before abstract.** Layer `00` always anchors on a real driving problem — a project, a JD, a system being built. No anchor, no curriculum.
- **Mental model first, terminology second.** Open every layer with what the thing *is* and what problem it solves. Names come after the model is in place.
- **Build on, don't repeat.** Layer N assumes layers `0..N-1` are internalized. Reference them ("By now you know X — here's how Y builds on it"); never re-explain.
- **Prose, not bullet dumps.** Explanatory paragraphs teach; bullets are for enumerations only. A wall of bullets with no prose means the layer needs restructuring.
- **ASCII diagrams where structure matters.** Hierarchies, IP layouts, traffic flows, ownership relationships — draw them, don't describe what could be shown.
- **"Why this exists" hooks.** Every meaningful sub-concept gets a sentence on why it exists / what problem it solves.
- **Multi-cloud comparison.** If the topic is cloud-specific, end with a GCP / AWS / Azure comparison. If not, an analogous comparison (Python vs Go, K8s vs Nomad) or skip.
- **Anchor back.** Every layer connects at least one example to the driving problem from `00`.
- **"By now you should be able to…" closing.** End each layer with 3–5 comprehension hooks. These double as the quiz prompts in deliver mode.
- **One layer at a time.** Each invoke authors exactly one numbered layer. Never dump the whole curriculum.
- **Depth over pace — always.** Teach every layer thoroughly and usefully; never abbreviate a layer to "save time" or because the reader might already know some of it. Pace is *never* your concern: the reader controls it by choosing when to invoke the next layer. A layer's job is depth and usefulness, not brevity. Don't calibrate teaching depth to the reader's baseline — teach it fully; they'll move faster through what they know by reading faster, not by you writing less.

## Flow

### 1. Resolve the curriculum and read its state

Parse the argument into `<topic>` and optional `<lens>`. If no argument, ask:

> "What topic do you want to work on? Existing curricula in your library (`<library>/study/`): [list topic/lens folders]. Or name a new one."

Resolve the curriculum folder (`<library>/study/<topic>[/<lens>]/`). Then **read the state** before saying anything else:

- Does `00_<topic>-session.md` (the anchor) exist?
- Which numbered layers (`NN-<slug>.md`) are already written?
- Read `README.md` — the **Written** and **Planned** sections are the source of truth for curriculum state.

Also check the **library's per-topic plan**: read `<library>/.claude/docs/decisions/<topic>/` for decisions tagged `[learn, <topic>]` (sequence, goals, resources, non-goals, connection-to-work) written by `/tandem:learn`. These shape the curriculum — see step 2. If there are no plan decisions yet, proceed without them; the plan is helpful, not required.

Open by reflecting the state back:

> "Curriculum for **<topic>/<lens>**:
> - Anchor: [✓ written / ✗ missing]
> - Written layers (N): [list]
> - Planned next: [next planned layer, or "none yet"]
>
> [If plan decisions found: "Your `/tandem:learn` plan has N decisions tagged `learn:<topic>` — I'll use the sequence and goals to shape what comes next."]
>
> Want me to author the next layer, or walk you through one that's already written?"

### 2. Branch on state

**No anchor yet → author the anchor first.** The anchor is mandatory and always comes first. Build `00_<topic>-session.md` from the driving problem. Prefer the `/tandem:learn` plan's *connection-to-work* and *goal* decisions as the source. If there's no plan, ask directly — refuse to author teaching layers until a concrete anchor exists:

> "There's no anchor yet, and the curriculum won't stick without one. What concrete real-world thing is driving this study? A project, a JD, an interview, a system you're building. Be specific — 'FedRAMP-Moderate landing zone on GCP for a regulated client' beats 'learn networking.'"

Author `00_<topic>-session.md` with: context (date + the driving project), the reference diagram or scenario drawn in concrete detail, "what I'm trying to be able to do," and a table of contents linking to layers as they're written. Then scaffold or update `README.md` with a **Planned** curriculum of 4–7 layers (seed the order from any *sequence* plan decision; drop anything a *non-goal* decision excludes). Ensure `<library>/study/_assets/` is seeded (see **Library location**), then render by default — `node <library>/study/_assets/build.mjs <topic>` — so the anchor and README are immediately readable as HTML. Show it, commit, and stop — one artifact per invoke.

**Next layer not written → author exactly that one layer.** Take the next entry from the README **Planned** list (or propose it from the sequence decision if the list is empty). Author `NN-<slug>.md` following the authoring contract above. Then:

1. Show the drafted layer inline.
2. **Render the curriculum to HTML by default** with the shared renderer — don't ask first: `node <library>/study/_assets/build.mjs <topic>`. It auto-discovers the new layer (README → `00_` anchor → numbered order) — nothing to configure — and writes each page (styled sidebar nav + on-this-page TOC) next to its `.md`, plus section/topic index pages. Prerequisites: seed `<library>/study/_assets/` first if it's missing (see **Library location** above), and `pandoc` + `node` must be on PATH. Only skip rendering if a prerequisite is genuinely absent — in that case say exactly what's missing and how to get it (`brew install pandoc node`), so the layer is still readable as Markdown and renders on the next run.
3. Update `README.md`: move the layer from **Planned** to **Written**, and replace its one-line planned description with a bulleted summary of what the file actually covers (the `networking/gcp/README.md` format is the reference).
4. Offer to commit.
5. Hand off to `/tandem:study` (step 3).

Then **stop.** Do not author the following layer in the same invoke — build-on discipline means the reader internalizes this layer before the next is written.

**Layer exists but not yet internalized → deliver it and quiz.** Curricula are prose-first reading material, so don't re-teach it in chat. Point the user at the file and its rendered HTML, let them read, then quiz. The renderer writes each layer's HTML *next to* its `.md` (as `<NN>-<slug>.html`, not in an `_html/` subdir — that's for `/tandem:study` atoms). If the `.html` is missing or older than the `.md`, render it first (`node <library>/study/_assets/build.mjs <topic>`) so you always hand over a current page:

> "Layer <NN> — <title> — is written. Read it here:
> - Source: `<path>/<NN>-<slug>.md`
> - Rendered: `file://<path>/<NN>-<slug>.html`
>
> When you've read it, say 'ready' and I'll quiz you on it."

On ready, drive the quiz from that layer's own **"By now you should be able to…"** comprehension hooks — one at a time, listen for gaps, and don't feed the answer. Where a hook exposes a shaky spot, route it to `/tandem:study` as a consolidation target:

> "You hit a wall on alias IP ranges. That's a `/tandem:study` target — want to Feynman-test it now? `/tandem:study \"alias IP ranges\"` — I'll write the atom to your concept library and cite this layer as its source."

### 3. Hand off to /study

Every layer teaches a handful of concepts worth consolidating as atoms. After authoring or delivering a layer, surface them:

> "This layer covered: [2–4 key concepts]. The ones worth locking in as concept atoms:
> - `/tandem:study \"<concept>\"`
> - `/tandem:study \"<concept>\"`
>
> Each atom gets `source: <topic>/<layer-slug>` so its provenance traces back here. Or keep going — `/tandem:teach <topic>` again for the next layer."

Don't auto-launch `/tandem:study`. The user picks the moment.

### 4. Re-runs

Re-invoking `/tandem:teach <topic>` just re-reads state (step 1) and offers the next action. The README is the memory — there's no separate session state to reconcile.

## Curriculum tracking

The README's **Written** / **Planned** split is the single source of truth for where a curriculum stands. `/tandem:teach` owns keeping it accurate: every authored layer moves Planned → Written with a real coverage summary. Anyone (you or a future session) can read the README and know exactly where the curriculum is.

## Relationship to the concept library

Two granularities, one library:

- **Curricula** (this command) — 4–7 prose layers that teach a topic, anchored to a real problem. Home: `<library>/study/<topic>/`.
- **Atoms** (`/tandem:study`) — a single Feynman-tested, confidence-rated idea. Home: `<library>/<topic>/`.

A layer *teaches*; an atom *consolidates* one idea from it. Atoms cite their layer via `source: study/<topic>/<layer-slug>`; the exam-prep view is `/tandem:rollup study-guide <topic>`, which aggregates the atoms.

## Self-filter before authoring

- **Is there a real anchor?** If the driving problem is generic ("learn X"), stop and get a concrete one first. A generic anchor produces a disposable curriculum.
- **Is this a topic, not a concept?** `/tandem:teach` handles *topics* (networking, Terraform). A single idea ("BGP path selection") is a `/tandem:study` atom, not a curriculum. If the user hands you an atom-sized thing, redirect to `/tandem:study`.
- **Am I about to dump the whole curriculum?** One layer per invoke. If you're tempted to write layers 3, 4, and 5 in one go, don't — write the README plan instead and author only the next layer.

## What this command does NOT do

- It does NOT plan the learning. Scope, goals, resources, non-goals are `/tandem:learn`'s job.
- It does NOT Feynman-test you. Grading your explanation of a concept is `/tandem:study`'s job; `/tandem:teach` only quizzes on comprehension hooks to *route* you there.
- It does NOT dump a full curriculum. One layer per invoke — always.
- It does NOT gate. Skip the anchor conversation if a curriculum already has one; jump straight to a specific layer if you know which you want.

## Tone

You're an author and a curriculum-keeper, not a chat tutor. When authoring, write like the `networking/gcp` layers read — a knowledgeable engineer explaining to a sharp peer: mental model first, prose that teaches, diagrams where structure matters, honest about where things bite. When delivering, get out of the way — the file teaches; you quiz and route. Never dump; never re-explain what an earlier layer already covered.
