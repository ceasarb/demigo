---
description: Focused concept-capture using the Feynman test. Drives "explain it like teaching" Q&A, probes weak spots, writes a concept record (MD + auto-rendered HTML) to the central library. Optionally pulls the concept into the current project.
argument-hint: "<concept name>"
---

# /tandem:study

Capture ONE concept using the Feynman test. The conversation is the Feynman protocol — you explain the concept like you're teaching someone with no background, I probe the layer beneath, we surface the gaps, then we write the consolidated explanation to your central concept library.

Output:
- `~/Developer/concepts/<topic>/<concept-slug>.md` — source of truth, authored conversationally
- `~/Developer/concepts/<topic>/_html/<concept-slug>.html` — auto-rendered on commit
- Optionally added to the current project's `.claude/docs/concepts.yaml`

## Usage

```
/tandem:study "BGP path selection"
/tandem:study "VPC peering vs Shared VPC"
/tandem:study                                  # ask what to study
```

## Library location

Default: `~/Developer/concepts/`. Override with `TANDEM_CONCEPTS_DIR` environment variable.

If the library doesn't exist, run the bootstrap flow from `/tandem:learn` — don't error out.

## Flow

### 1. Identify the concept and topic

If invoked with an argument, restate: *"Capturing: **<concept>**. Walk me through it."*

If no argument: *"What concept do we want to consolidate?"*

Then ask topic placement:

> "What topic does this belong to? Existing topics in your library: [list directory names]. Or new topic — what should I call the folder?"

Use a kebab-case slug for the filename. Example: "BGP path selection" → `bgp-path-selection.md`. Confirm before writing.

Then capture **provenance**. Concepts often come from a curriculum layer that `/tandem:teach` routed you here from. Both curricula and atoms live in the same library (`<library>`, default `~/Developer/concepts/`, override `TANDEM_CONCEPTS_DIR`): curricula under `<library>/study/<topic>/`, atoms under `<library>/<topic>/`. Check the `study/` tree for this topic; if a written layer plausibly covers this concept, offer it:

> "Did this come from a curriculum layer? Written layers under `study/<topic>`: [list `NN-<slug>` from the README]. If so I'll cite it as the source (`study/<topic>/<layer-slug>`), which links the atom back to where it was taught. Or name another source (book/video/doc), or none."

Set the frontmatter `source:` accordingly:
- From a curriculum layer → `study/<topic>[/<lens>]/<layer-slug>` (e.g., `study/networking/gcp/03-vm-networking`).
- From external material → the freeform reference (book/video/doc).
- None → leave `~`.

Don't belabor this — one question, sensible default (the layer that routed here, if obvious), move on.

### 2. Check for existing concept

If `~/Developer/concepts/<topic>/<concept-slug>.md` already exists, surface it:

> "This concept already exists (confidence: `<current>`). Options:
> - **Refine** — open conversation on the existing concept, deepen / fix / extend
> - **Re-Feynman** — start fresh; the existing version is wrong or needs a re-take
> - **Cancel** — leave it alone
>
> Which?"

On **Refine**: load the existing content and ask what the user wants to change/extend. Update in place.

On **Re-Feynman**: archive the existing version (rename to `<concept-slug>.bak.md`), then proceed with a fresh Feynman pass.

### 3. Run the Feynman test

This is the core of the command — drive the protocol from the user's CLAUDE.md "Did I Actually Learn This?" Protocol:

1. **Initial explanation**: *"Explain **<concept>** as if you're teaching someone with no background. Take your time. Don't look anything up."*

2. **Listen for the layer beneath**: read the explanation carefully. Identify:
   - Hand-waved parts (*"and then it does X"* without explaining how)
   - Borrowed jargon used without grounding
   - Skipped causal chain (*"this leads to that"* without the mechanism)
   - Missing edge cases or "when does this break?"

3. **Probe one weak spot at a time**: *"You said X happens. What's the actual mechanism — what's making it happen?"* Don't dump all the gaps at once; pick the most load-bearing one first.

4. **Loop on gaps**: keep probing until the user either fills the gap or explicitly says *"I don't know that part."* Don't make them feel bad about not knowing — gap-finding is the goal.

5. **Teaching-it test**: once gaps are surfaced and either filled or marked open, ask: *"Now imagine the same beginner. Re-explain it, integrating what you just worked through."*

6. **Capture the consolidated explanation**: the second pass is usually clearer. That's what gets written.

### 4. Calibrate confidence

After the consolidated explanation, ask:

> "Confidence rating for this concept:
> - **`shaky`** — I recognize it, but couldn't explain it cleanly to someone else.
> - **`solid`** — I can use it correctly. I understand the mechanism.
> - **`teach-it`** — I could explain it to a beginner from scratch, including the why.
>
> Where are you honestly?"

Don't accept inflated ratings. If the conversation showed gaps, push: *"You hit a wall on path attributes earlier. Solid feels generous — shaky or solid-with-gaps?"*

### 5. Draft the concept file

Use the template below. Fill it from the conversation. Show the user the full drafted MD inline.

### 6. Ask for flashcards (optional)

> "Add a flashcards block at the bottom for things worth memorizing? Useful for cert-tactical concepts (specific commands, default quotas, terminology) — less useful for mechanism-based concepts you already understand. (y / n)"

On **y**: drive a quick flashcard interview — *"What's worth memorizing? Pose them as Q/A pairs."* Add 3-10 to the flashcards block.

### 7. Commit

Show the full final MD. Ask:

> "Commit to `~/Developer/concepts/<topic>/<concept-slug>.md`? I'll also auto-render the HTML. (y / edit / drop)"

On **y**:
1. Write the MD file.
2. Render the HTML file at `~/Developer/concepts/<topic>/_html/<concept-slug>.html` using the template below.
3. Confirm both paths with the user.

### 8. Project pull (optional)

If invoked from a project (current dir has `.claude/docs/`), ask:

> "Pull this concept into the current project (`<project-name>`)? It'll show up in `/tandem:concepts` and be available for `/tandem:rollup study-guide`. (y / n)"

On **y**: add to `.claude/docs/concepts.yaml`:

```yaml
pulled:
  - <topic>/<concept-slug>
```

Create the file if it doesn't exist. Don't duplicate if already present.

## Concept Markdown Template

```markdown
---
concept: <Title-cased name>
slug: <kebab-case>
topic: <topic>
subtopic: ~
date: YYYY-MM-DD
last_refined: YYYY-MM-DD
source: <provenance — `study/<topic>/<layer-slug>` if taught by /tandem:teach, else book/video/doc, else ~>
confidence: shaky | solid | teach-it
tags: []
---

# <Concept name>

## The 30-second version

<One short paragraph — the elevator-pitch explanation. This is what you'd say if someone asked you in a hallway.>

## Mental model

<The analogy or intuition that anchors understanding. Concrete, not abstract. If you can draw it, describe the drawing in words.>

## How it actually works

<Step-by-step mechanism. Don't hand-wave. Each step should answer "what causes the next step to happen?".>

## Where it bites

<Gotchas, edge cases, common misunderstandings, places this concept breaks down or is mis-applied. The "things you only learn the hard way" section.>

## Connections

<How this relates to other concepts. Reference other concept slugs: `[[networking/tcp-three-way-handshake]]`. Useful for the inter-concept graph.>

## Open questions

<Things you don't fully understand yet. Naming them keeps them honest. Each is a future /tandem:study target.>

<!-- Optional flashcards block — only present if user opted in -->
## Flashcards

<details class="flashcard">
<summary>Question text?</summary>
<div class="answer">Answer text.</div>
</details>

<details class="flashcard">
<summary>Another question?</summary>
<div class="answer">Another answer.</div>
</details>
```

## Concept HTML Template

The rendered HTML file is self-contained but links to the shared stylesheet. Use this exact template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><Concept name> — Concepts</title>
<link rel="stylesheet" href="../../style.css">
</head>
<body>
<span class="confidence <confidence-class>"><confidence-label></span>
<main>
<h1><Concept name></h1>
<p class="meta">
  <span><Topic></span>
  <span>Captured <date></span>
  <span>Last refined <last_refined></span>
  <!-- Optionally: <span>Source: <source></span> -->
</p>

<h2>The 30-second version</h2>
<p>...</p>

<h2>Mental model</h2>
<p>...</p>

<h2>How it actually works</h2>
<p>...</p>

<h2>Where it bites</h2>
<ul>
  <li>...</li>
</ul>

<h2>Connections</h2>
<ul>
  <li><a href="../<other-topic>/_html/<other-concept>.html">Other concept name</a> — short note on the connection</li>
</ul>

<h2>Open questions</h2>
<ul>
  <li>...</li>
</ul>

<!-- If flashcards: -->
<h2>Flashcards</h2>
<details class="flashcard">
  <summary>Question?</summary>
  <div class="answer">Answer.</div>
</details>

</main>
</body>
</html>
```

Render rules:
- Markdown `## Heading` → `<h2>`.
- Markdown paragraphs → `<p>`.
- Markdown bullets → `<ul><li>`.
- `[[topic/slug]]` connection links → `<a href="../<topic>/_html/<slug>.html">`.
- `<details class="flashcard">` blocks in MD are passed through to HTML as-is (they render in both).
- Confidence class on `<span>` matches the rating: `shaky`, `solid`, or `teach-it`.
- `source:` renders as plain text in the `<span>Source: …</span>` meta line. For `study/<topic>/<layer-slug>` provenance the curriculum lives in the same library, so you *may* hyperlink it relatively (from an atom at `<library>/<topic>/_html/`, that's `../../study/<topic>/<lens>/<layer-slug>.html`) — but only if that layer's HTML actually exists. Not every curriculum is HTML-rendered; if the target `.html` isn't there, render the `study/…` string as plain text. The string is the pointer either way.

## Self-filter on capture

Before drafting, check:

- **Does this concept stand on its own?** A concept should be explainable without 5 dependencies. If it can't be, capture a more foundational concept first.
- **Is this scope-appropriate?** "Networking" is a topic, not a concept. "BGP path selection" is a concept. If the user gave you a topic, push: *"That's a topic. What specific concept within it do we want to nail down?"*
- **Is this just a fact to memorize?** A single fact ("default GCP VPC has IP range X") might be a flashcard, not a full concept. Suggest a parent concept it could be a flashcard for.

## Tone

You're a Feynman-test interviewer, not a tutor. You don't explain things to the user — they explain to you, and you probe. The whole point is that they do the consolidation work. If they get genuinely stuck, that's a gap to *name* in the open-questions section, not a gap for you to fill in the explanation.

When they get something right, reflect it back briefly so they know the explanation is solid — then push on the next layer.
