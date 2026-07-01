---
description: Generate a view artifact (PRD, Roadmap, SAD) from the current committed decisions. Views are derived — they live in .claude/docs/views/ and are regenerated, not edited.
argument-hint: <prd | roadmap | sad> [phase]
---

# /rollup

Generate a **view** from the currently committed decisions. Views are read-only artifacts that exist to hand to humans (stakeholders, reviewers, future-you) who don't want to read the underlying PDRs and ADRs one at a time.

Views are **always regenerated, never hand-edited**. If a view looks wrong, the fix is in the underlying decisions, not the view.

## Usage

```
/rollup prd phase-1            # PRD view for phase-1 (from PDRs tagged phase-1)
/rollup roadmap                # Roadmap view across all phases
/rollup sad                    # Solution Architecture view across all active ADRs
/rollup study-guide networking # Aggregated HTML study guide for a topic (from concept library)
```

## Where views go

`.claude/docs/views/`
- `prd-phase-1.md`
- `prd-phase-2.md`
- `roadmap.md`
- `sad.md`

**`study-guide`** is the exception — it writes HTML, not Markdown, and writes to `~/Developer/concepts/_html/study-guide-<topic>.html` (the central library) rather than the project's `views/`. The HTML is meant to be opened in a browser for reading.

These files include a banner at the top:

```markdown
> **This is a generated view.** Do not edit. Source: `/rollup <type> <args>`.
> Generated: YYYY-MM-DD HH:MM from N decisions (M PDRs, K ADRs).
> To change content, edit or supersede the underlying decisions and re-run `/rollup`.
```

## How each rollup works

### `prd <phase>`

1. Find all PDRs where `phase: <phase>` and `status: active`.
2. Group decisions by theme. Themes are inferred from PDR titles and contents — usually:
   - **Problem & Users** — context aggregated across PDRs
   - **Goals** — the "Decision" lines of PDRs that commit to scope
   - **Non-Goals** — PDRs whose Decision is explicitly "we will NOT do X"
   - **Success Metrics** — PDRs whose Decision defines what working looks like
   - **Constraints** — PDRs whose Decision captures an inherited constraint
3. Render each theme as a short narrative paragraph followed by a bulleted list of source PDR IDs.
4. Include a "Decisions Index" footer listing every PDR rolled up, with a one-line summary each.

### `roadmap`

1. Find all PDRs where `tags:` includes `sequencing` or `roadmap`. These are explicit ordering decisions.
2. Find all phases referenced anywhere in `phase:` fields across PDRs and ADRs.
3. For each phase, in order:
   - Phase name
   - One-paragraph rationale (sourced from sequencing PDRs that mention this phase)
   - Scope: bulleted list of one-liners from PDRs in this phase (Decision lines)
   - Out-of-scope: bulleted list from PDRs where the Decision is "we will NOT..."
4. Footer: list of PDRs/ADRs that informed the ordering.

If there are no sequencing PDRs at all, render the roadmap as a flat list of phases referenced in `phase:` fields and add a banner: *"No sequencing decisions captured. To add one: `/decide-product "do phase-1 before phase-2 because X"`."*

### `sad`

1. Find all active ADRs.
2. Group by category — infer from `tags:` and ADR titles:
   - **Runtime & Deploy** — ADRs about platform, deploy target, regions
   - **Data** — ADRs about storage, schemas, persistence
   - **Boundaries** — ADRs about APIs, integration patterns
   - **Cross-cutting** — auth, observability, security
3. Render each category as a short narrative + bulleted ADR references.
4. Footer: full ADR index.

### `study-guide <topic>`

Aggregates concepts from the central library into a single styled HTML page for reading and exam prep. Unlike the other rollups, this writes HTML (not Markdown) and writes to the central library, not the project's `views/`.

**Library location**: `~/Developer/concepts/` (override with `TANDEM_CONCEPTS_DIR`).

**Source selection** depends on where the command runs:
- **From within a project** (current dir has `.claude/docs/concepts.yaml`): use the project's `pulled:` set, filtered to the named topic. Falls back to "no concepts pulled for `<topic>`" if empty.
- **From elsewhere** (e.g., inside the library itself): use ALL concepts in `~/Developer/concepts/<topic>/`.

**Generation**:

1. Walk the selected concept files (`<concept-slug>.md`).
2. For each, read frontmatter + body.
3. Order by:
   - Concepts with `subtopic:` set come grouped under their subtopic.
   - Within a (sub)topic, sort by confidence ascending (shaky first — most-needed-study at the top).
4. Build a single self-contained HTML page with:
   - A fixed-position sidebar TOC (`<nav class="toc">`) on wide screens listing every concept with its confidence dot.
   - Each concept rendered as a section: `<h2>` title, confidence badge, the same body sections as the individual concept page (30-second, mental model, mechanism, gotchas, connections, open questions, optional flashcards).
   - Cross-links (`[[topic/slug]]` syntax in the source) resolved to anchor links within the page when the target is in the guide, or external links to the target's HTML when it isn't.
5. Link to the shared stylesheet at `~/Developer/concepts/style.css` (use relative path `style.css` since the guide writes to `~/Developer/concepts/_html/`).
6. Add `class="study-guide"` on `<body>` so the CSS picks up the wide-screen layout.

**Output**: `~/Developer/concepts/_html/study-guide-<topic>.html`. Overwrite if exists.

**Self-filter for study-guide**: if all concepts in scope are `teach-it`, ask: *"All concepts are teach-it confidence. You don't really need a study guide — you know this material. Generate anyway? (y / n)"*

## Flow

For `prd`, `roadmap`, `sad`:

1. Read all files in `.claude/docs/decisions/`.
2. Filter by status (drop superseded/deprecated).
3. Filter by phase if applicable.
4. If zero matching decisions: tell the user, suggest running `/brainstorm` or `/decide-*`. Do NOT write an empty view file.
5. Generate the view content using the structure above.
6. Show the user the rendered output in chat.
7. Ask: *"Write to `<path>`? (y / n)"*
8. On `y`: overwrite the existing view file (views are always regenerated wholesale).

For `study-guide`:

1. Resolve scope (project-pulled vs. full library — see above).
2. Read concept files from `~/Developer/concepts/<topic>/`.
3. If zero concepts: tell the user, suggest `/tandem:study <concept>` or `/tandem:pull <id>`. Do NOT write an empty guide.
4. Generate the HTML.
5. Show the user a summary (N concepts: M shaky, K solid, L teach-it; longest section: ...).
6. Ask: *"Write to `~/Developer/concepts/_html/study-guide-<topic>.html`? (y / n)"*
7. On `y`: write the file. Offer the `file://` URL to open in browser.

## Self-filter on output

Before showing the user, sanity-check:

- **Is the view too thin?** Fewer than 3 decisions in a PRD usually means the user hasn't done enough product thinking. Flag it: *"Only 2 PDRs in phase-1. The PRD will be very thin. Worth one more `/brainstorm` round?"*
- **Are decisions contradicting?** If two active PDRs in the same phase commit to mutually exclusive things, surface it: *"PDR-003 commits to X, PDR-007 commits to NOT-X. One of these probably needs to supersede the other. Want to `/refine` one of them first?"*
- **Are there orphan ADRs?** ADRs in a phase with zero PDRs in that phase usually means tech-first thinking. Note it but don't block.

## Tone

You are rendering, not authoring. The view's job is to be *useful for someone reading without context*, so write prose paragraphs around the bullet lists. Don't just dump decision titles.

## What this command does NOT do

- It does NOT modify any decisions.
- It does NOT create new files outside `.claude/docs/views/`.
- It does NOT gate. If the user wants a thin PRD, render it.
- It does NOT call out to other models or run a separate review pass — the user can run a review skill on the view if they want one.
