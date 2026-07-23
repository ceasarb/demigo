---
description: The one testing verb for exam prep. Generates a diagnostic grounded in your own materials (never a canned bank), administers it capturing an answer plus a confidence rating per question, scores each into the confidence-weighted 2×2, and writes per-domain readiness to the exam overlay. The baseline is just a retest on empty state. Scoped to the whole exam or a single domain. Self-contained in the concept library.
argument-hint: "<exam-slug> [domain-id or domain-name]"
---

# /demi:retest

The **single testing verb** of the exam-prep track (ADR-009). It measures where
you stand on an exam and writes the result; it does not teach, and it does not
tell you whether to sit the exam.

**Baseline = retest on empty state.** There is no separate `/baseline` command.
The first time you run `/demi:retest <exam-slug>` against a fresh overlay, it
covers every domain and establishes your baseline. Later runs re-measure — a
single domain or the whole exam — and update the same state.

```
/demi:exam                         sets up the blueprint, reads readiness, shows the dashboard
   │  triggers ↓ (baseline) and recommends ↓ (re-measure)
/demi:retest                       generate diagnostic → capture answer + confidence → score → write
   │  writes ↓
readiness.yaml                       per-domain confidence-weighted 2×2 (PDR-010)
```

It reads `exam.yaml` (blueprint, objectives, `question_style`, `materials/`) and
writes `readiness.yaml` — both in the exam overlay at
`<library>/study/<exam-slug>/` (ADR-008). Generated question sets and attempt
records are saved under `diagnostics/` for provenance and review.

## Usage

```
/demi:retest gcp-pca                       # whole exam (baseline if never tested)
/demi:retest gcp-pca D3                     # re-measure one domain by id
/demi:retest gcp-pca "Analyzing and optimizing…"   # …or by name
```

If the exam overlay doesn't exist yet, tell the user to run `/demi:exam
<exam-slug>` first — `/demi:retest` measures a blueprint, it doesn't create one.

## Flow

> **Maturity:** the generate → capture → score → write loop is complete and
> runnable. Two enhancements are still planned: deeper **style-grounding** from
> your sample questions, and a more polished per-answer **confidence-capture UX**.
> Today it generates solid grounded questions and asks confidence plainly.

### 1. Resolve scope and load the blueprint

Resolve `<exam-slug>` from the argument (ask if missing). Read
`<library>/study/<exam-slug>/exam.yaml`. Determine scope:

- **No domain argument** → whole exam. If `readiness.yaml` is absent or every
  domain's `last_tested` is null, announce this is the **baseline**.
- **A domain id/name** → that single domain (targeted retest).

### 2. Generate the diagnostic (grounded — PDR-009)

Author **new** questions against the in-scope domains' `objectives` from
`exam.yaml`. Ground them in the learner's material:

- If `exam.question_style` is set, read the sample questions under `materials/`
  and **mimic their style** — scenario length, phrasing, single- vs multi-select,
  distractor patterns, difficulty. Author fresh questions in that style; **never
  reproduce a sample verbatim** (PDR-009). _(Planned: sharpen the style-extraction;
  today it mimics at a reasonable-effort level.)_
- If no samples exist, fall back to blueprint-only generation from the objectives.
- Optionally draw scenario grounding from other `materials/` (partner docs, case
  studies) so questions read like the target exam.

**How many.** Baseline: a handful per domain, allocated by `weight` (heavier
domains get more), enough to populate a 2×2 without exhausting the learner —
target ~8–12 per domain for a real baseline, fewer for a quick check. Targeted
retest: focus the count on the one domain, oversampling its weak objectives.

Save the generated set to `diagnostics/<date>-<scope>.md` before administering.

### 3. Administer — capture answer **and** confidence (PDR-010)

Present questions one at a time. For **each** question capture two things:

1. the learner's **answer**, and
2. their **confidence** — plainly, "sure" or "unsure" (binary for now).

Confidence is load-bearing, not decoration: it's what separates a blind spot from
a known gap. Do not reveal correctness until the set (or domain) is complete, so
confidence stays honest. _(Planned: refine the capture UX and consider a 3-point
scale plus fragile-quadrant light-retest logic.)_

### 4. Score into the 2×2

Grade each answer, then cross correctness with confidence into one quadrant
(PDR-010):

| | **Sure** | **Unsure** |
|---|---|---|
| **Correct** | `mastered` | `fragile` |
| **Incorrect** | `blind_spot` | `known_gap` |

Tally per domain. Record each question's outcome (answer, correct answer,
correctness, confidence, quadrant) into the `diagnostics/<date>-<scope>.md` file
so a result can be reviewed later.

### 5. Write `readiness.yaml`

For each in-scope domain, update its entry (per the `readiness.yaml` schema in
`prompts/exam.md`): set `questions`, the four `quadrants`, `last_tested` = today;
recompute `readiness = (mastered + 0.5 × fragile) / questions` and the `status`
label; and **push a new entry onto `attempts[]`**. Set the top-level `updated`.

**Update, don't clobber.** A whole-exam retest rewrites every domain; a targeted
retest updates **only** its one domain and leaves the others (and their history)
untouched. Never drop `attempts[]` history.

### 6. Hand back to `/demi:exam`

Report the raw per-domain quadrant tallies for what was just measured, then hand
off — **without** any go/no-go editorializing (PDR-011):

> "Measured **<scope>**: <n> mastered · <n> fragile · <n> known-gap · **<n>
> blind-spot**. Written to readiness. Run `/demi:exam <exam-slug>` for the
> updated readiness map and your next best move."

Do not tell the learner they're ready or not ready — that framing belongs to the
`/demi:exam` dashboard, and even there it's evidence, not a verdict.

## What this command does NOT do

- It does NOT ship or serve a question bank — every question is generated per run
  and grounded in the learner's materials (PDR-009).
- It does NOT reproduce supplied sample questions — they are a *style* reference
  only.
- It does NOT teach or route — it measures and writes. Closing gaps is
  `/demi:teach` / `/demi:study`, recommended by `/demi:exam`.
- It does NOT compute the exam-wide readiness bar — it writes per-domain
  measurements; the deadline-aware bar is assembled by `/demi:exam` (PDR-011).
- It does NOT give a go/no-go call.
- It does NOT create a blueprint — run `/demi:exam <exam-slug>` first.

## Tone

You're a fair proctor, not a coach mid-test. Ask cleanly, capture the confidence
honestly, don't hint, don't console. The value is an unflinching measurement — the
encouragement and strategy happen back in `/demi:exam`.
