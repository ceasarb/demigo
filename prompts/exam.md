---
description: Additive exam/cert-prep orchestrator over the learning track. Ingests an exam guide, extracts a weighted blueprint, maps its domains onto existing concept topics, and drives a diagnostic → readiness → retest loop — routing gaps into /learn, /teach, /study by recommendation. Diagnostics are generated from your own materials; readiness is a confidence-weighted 2×2; the go/no-go call stays yours. Self-contained in the concept library.
argument-hint: "<exam-slug or exam name>"
---

# /demi:exam

Deadline-aware **exam/cert-prep orchestrator**. It's an *additive* layer on top of the learning track — it never replaces it:

```
/demi:exam                         steering: blueprint · baseline · readiness · retest
   │  routes gaps into ↓  (by recommendation, never auto-invoke)
/demi:learn  →  /demi:teach  →  /demi:study
   plan             acquire           consolidate
   ▲  measures where you stand via ↓
/demi:retest                       the one testing verb (baseline = retest on empty state)
```

`/demi:exam` owns the four things the learning track doesn't: the exam
**blueprint** (the map), a deadline-aware **readiness map** (what's worth your
remaining hours; starts *unknown* and fills in as you test), **on-demand
diagnostics** (learner-initiated — you decide when and what to be tested on), and
**retest** (did the gap close). It is **study-first**: after ingest it hands you
straight into studying — it never gates learning behind a test (PDR-008 v0.2). The
loop is:

```
ingest → map → study right away → test on demand → readiness fills in → repeat
```

**Additivity is the whole point (PDR-008).** `/demi:learn`, `/demi:teach`,
and `/demi:study` remain fully usable standalone with zero exam context. Someone
learning for its own sake never touches `/demi:exam`; someone prepping for a
test opts into the structure. This command *reuses* the learning verbs — it never
wraps, forks, or replaces them.

**Self-contained in the concept library.** Like the rest of the learning track,
`/demi:exam` reads and writes the concept library and *only* the library. There
is **no external project repo** for exam prep. An exam is a thin **overlay**
(ADR-008) that references existing concept topics *by slug* — so studying you've
already done counts toward readiness automatically:

```
<library>/                            # default ~/Developer/concepts/ (DEMI_CONCEPTS_DIR)
  study/<exam-slug>/                  # the exam overlay
    exam.yaml                         # blueprint + domain→concept-slug map
    readiness.yaml                    # per-domain confidence-weighted 2×2 + timestamps
    materials/                        # ingested exam guide, sample questions, partner docs
    diagnostics/                      # generated question sets + attempt records
  study/<topic>/                      # existing concept topics, referenced by slug (unchanged)
```

The teaching payload always lives in the shared `study/<topic>/` trees that
`/demi:teach` and `/demi:study` write. The overlay copies **no** curriculum —
it only points at topics and tracks readiness.

## Usage

```
/demi:exam                                 # ask which exam, then ingest a guide
/demi:exam gcp-pca
/demi:exam "Google Professional Cloud Architect"
```

If the concept library doesn't exist yet, offer to bootstrap it the same way
`/demi:learn` does (it's the shared home for the whole learning track).

## Flow

> **Maturity:** the ingest → map → study loop is complete and usable end-to-end,
> and testing is learner-initiated via `/demi:retest`. A few enhancements are
> still planned: a richer readiness dashboard, the full deadline-aware margin
> curve, and sharper style-grounding of generated questions.

### 1. Frame the conversation

> "We're in **exam mode** for **<exam>**. This is optional scaffolding over your
> normal learn/teach/study loop — it doesn't change how those work.
>
> Here's what I do: pull your exam guide into a **blueprint** (domains + weights),
> map it onto what you've already studied, and hand you a **study plan** so you can
> **start learning right away**. I won't quiz you up front — testing is your call.
> Whenever *you* decide you're ready to be measured on a subject, run
> `/demi:retest <exam> <subject>` and I'll fill in your readiness map.
>
> Two ground rules: any questions are generated from **your** materials, not a
> canned bank; and I'll show you the evidence but I'll **never** tell you to book
> or sit the exam — that call's yours. Stop me anytime."

### 2. Ingest the guide and extract the blueprint → `exam.yaml`

Take the exam guide (PDF, URL, or pasted text) plus any sample questions and
supporting materials the learner brings, and extract a weighted blueprint into
`<library>/study/<exam-slug>/exam.yaml`. Grounded in the learner's own material
(PDR-009); blueprint-only is the fallback when no samples are supplied. Store raw
inputs under `materials/`.

The extracted blueprint is written to `exam.yaml` in the schema below.

Extraction writes each domain with `concepts: []` and `unmapped: ~`; the mapping
pass (flow step 3) fills them.

#### Extraction procedure (PDR-009, ADR-008)

Extract, don't invent. Keep domain names and sub-objectives **verbatim** from the
guide; if the guide is ambiguous, flag it rather than fabricate structure. Never
guess a cut score or a weight silently — mark anything derived as estimated and
surface it.

1. **Gather inputs → `materials/`.** Accept the guide as pasted text, a URL, or a
   file path (PDF / Markdown / HTML). Save the raw input verbatim under
   `<library>/study/<exam-slug>/materials/` (e.g. `exam-guide.pdf`,
   `exam-guide.txt` for a paste, a fetched snapshot for a URL). Save any supplied
   sample questions as `materials/sample-questions.*` and any supporting docs
   alongside. `materials/` is the provenance record — everything downstream cites
   it via `exam.source`.

2. **Extract the exam identity → `exam:` block.** Pull `name`, `provider`, and a
   `guide_version` (a revision/date on the guide, if present). Set `source` to the
   `materials/` path the blueprint came from. Ask the learner for their target
   `exam_date` (optional — null means no-deadline mode).

3. **Parse domains → `domains:`.** Most exam guides list sections as
   *"Section N: <name>"* with bulleted sub-objectives, often with a stated weight
   (*"~24% of the exam"*). For each section emit one domain: `id` (`D1`, `D2`, …),
   `name` verbatim, and `objectives` as the verbatim bullets. Leave `concepts: []`
   and `unmapped: ~` — the mapping pass (step 4) fills them.

4. **Resolve weights → `weight` + `weights_estimated`.**
   - If the guide **states** per-section percentages, use them; convert to
     fractions and normalize so the set sums to `1.0` (reconcile rounding on the
     largest domain). Set `weights_estimated: false`.
   - If the guide gives **no** weights, set `weights_estimated: true` and assign
     **equal weights** (`1 / N`). (An objective-count heuristic is a documented
     alternative, but equal-and-flagged is the honest default.) Tell the learner
     the weights were estimated and invite corrections.

5. **Resolve the cut score → `passing_score` + `passing_score_source`.** If the
   guide or official exam page states a passing score, record it with
   `passing_score_source: stated`. Otherwise default to `0.70` with
   `passing_score_source: estimated`, and say so — the deadline-aware bar (PDR-011)
   leans conservative on estimates.

6. **Wire the style reference.** If sample questions were supplied, point
   `exam.question_style` at their `materials/` path. They are a *style* reference
   for `/demi:retest` only, never reproduced verbatim (PDR-009).

7. **Write `exam.yaml`, then confirm before proceeding.** Write the file, then
   show the learner the extracted domain list with weights and flags:

   > "Here's the blueprint I pulled from your guide — **N domains**. Weights
   > [stated / **estimated, please sanity-check**]. Cut score [stated / estimated
   > at 70%]. Correct anything before I map domains to your existing study?"

   This human-in-the-loop check is the gate before mapping. Fix and rewrite on
   any correction.

#### `exam.yaml` schema (ADR-008)

`exam.yaml` is the blueprint: the exam's metadata, its weighted domains and
sub-objectives, and the domain→concept-slug map. `/demi:exam` owns this file.

```yaml
# <library>/study/<exam-slug>/exam.yaml

exam:
  slug: gcp-pca                       # matches the folder under study/
  name: "Google Professional Cloud Architect"
  provider: google-cloud              # freeform; enables provider-scoped topics (study/<topic>/gcp)
  guide_version: "2024-10"            # the guide revision this was extracted from, if stated
  source: materials/exam-guide.pdf    # what the blueprint was extracted from (under materials/)
  exam_date: 2026-08-05               # optional (YYYY-MM-DD). Drives the deadline-aware bar (PDR-011).
                                      #   omit / null → no-deadline mode (bar degrades gracefully).
  passing_score: 0.70                 # fraction 0–1. Real cut score if published, else best estimate.
  passing_score_source: estimated     # stated | estimated  — the bar (PDR-011) treats estimated
                                      #   scores more conservatively.
  question_style: materials/sample-questions.md   # optional. Style reference only, never reproduced (PDR-009).

# Weighted domains. `weight` values are fractions and should sum to ≈ 1.0.
# If the guide gives no weights, extraction assigns equal weights and flags it
# (weights_estimated: true).
weights_estimated: false
domains:
  - id: D1
    name: "Designing and planning a cloud solution architecture"
    weight: 0.24
    objectives:                       # sub-objectives, verbatim from the guide where possible
      - "Designing a solution infrastructure that meets business requirements"
      - "Designing a solution infrastructure that meets technical requirements"
      - "Designing network, storage, and compute resources"
      - "Creating a migration plan"
    concepts:                         # domain→concept-slug map (ADR-008). Existing topics under study/.
      - study/application-platform    #   Prior study of these counts toward readiness automatically.
      - study/networking/gcp
    unmapped: false                   # true when no concept topic matches yet → /learn scaffold (step 5)

  - id: D2
    name: "Managing and provisioning a solution infrastructure"
    weight: 0.20
    objectives:
      - "Configuring network topologies"
      - "Configuring individual storage systems"
      - "Configuring compute systems"
    concepts:
      - study/networking/gcp
    unmapped: false

  - id: D6
    name: "Managing implementation"
    weight: 0.11
    objectives:
      - "Advising development/operation teams to ensure successful deployment"
      - "Interacting with Google Cloud programmatically"
    concepts: []                      # nothing in the library covers this yet …
    unmapped: true                    # … so it's flagged for a fresh /demi:learn scaffold
```

Field notes:

- **`weight`** is the blueprint weighting and is load-bearing for triage: study
  priority = quadrant severity (PDR-010) × `weight`, so a heavily-weighted domain
  you're shaky in surfaces first.
- **`exam_date` + `passing_score` + `passing_score_source`** are the only inputs
  the deadline-aware bar (PDR-011) needs beyond `readiness.yaml`. An `estimated`
  cut score (common — e.g. GCP doesn't publish one) is treated conservatively.
- **`concepts`** references existing `study/<topic>` slugs by path — it never
  copies curriculum. An empty `concepts` + `unmapped: true` is the signal that a
  domain needs a `/demi:learn` scaffold.
- **`objectives`** are kept verbatim so generated diagnostics (`/demi:retest`)
  can target sub-objectives, not just domains.

### 3. Map domains → concept slugs

For each blueprint domain, find the matching existing concept topic(s) under
`<library>/study/` and record the mapping in each domain's `concepts:` list. This
is the step that makes prior study *count* (ADR-008): a domain backed by a topic
you've already worked shows up in the readiness map as a real signal rather than
an unknown. Flag any domain with no match — those become fresh `/demi:learn`
scaffolds (step 5).

**Mapping is not readiness.** This step only records *which topics back a domain*
(the routing target). Whether you actually *know* that domain is still measured by
the baseline (`/demi:retest`), never assumed from the mapping.

Procedure:

1. **Enumerate candidate topics.** List directories under `<library>/study/`,
   excluding `_assets/` and any exam overlays (folders that contain an
   `exam.yaml`). Candidates are both bare topics (`study/networking`) and
   provider-scoped lenses (`study/networking/gcp`).
2. **Match on coverage, not just slug names.** For each domain, compare its `name`
   + `objectives` against candidate topics. Read the topic's `README.md` (its
   Planned/Written layers) to confirm real topical overlap before mapping —
   don't map on a name coincidence. A domain may map to **several** topics; a
   topic may back **several** domains.
3. **Prefer the provider lens.** When `exam.provider` is set and both a bare topic
   and a provider lens exist, prefer the lens (`study/networking/gcp` over
   `study/networking` for a GCP exam).
4. **Write the result.** Set `concepts: [<slugs>]` for matched domains. For a
   domain with no real match, set `concepts: []` and `unmapped: true`.
5. **Confirm with the learner.** Show the full mapping and call out the unmapped
   domains explicitly:

   > "Mapped your blueprint onto existing study:
   > - **D1 Designing…** → `study/application-platform`, `study/networking/gcp`
   > - **D2 Managing/provisioning…** → `study/networking/gcp`
   > - **D6 Managing implementation** → _no topic yet_ — I'll suggest
   >   `/demi:learn` for this when we route gaps.
   >
   > Look right? Add or drop any mappings before we build your study plan."

Partial coverage is fine — if a topic covers only some of a domain's objectives,
still map it; a diagnostic will expose the thin spots as gaps if and when the
learner chooses to test that subject.

### 4. Present the study plan and start studying (no baseline)

**Study-first (PDR-008 v0.2): do not quiz the learner here.** Once the blueprint
is mapped, present a **study plan** and hand straight into learning:

- Order the domains by **blueprint weight** (highest-leverage first), noting which
  are backed by existing study (start there — momentum) vs. thin/unmapped.
- Recommend the concrete first move — `/demi:teach <slug>` for a mapped domain,
  or `/demi:learn <domain>` to scaffold an unmapped one — and let the learner
  pick where to begin.
- Initialize `readiness.yaml` with every domain `status: unknown` (nothing tested
  yet). The map fills in on demand.

**Testing is pull, not push.** Whenever the learner decides they're ready to be
measured on a subject, *they* run `/demi:retest <exam-slug> [domain]`. The
baseline is simply the first such retest — there is no automatic up-front test.

`/demi:retest` (see `prompts/retest.md`) owns the diagnostic generation,
confidence capture, and the writes into the `readiness.yaml` schema below.

#### `readiness.yaml` schema (PDR-010)

`readiness.yaml` is the per-domain confidence-weighted 2×2 plus the timestamps the
deadline-aware bar needs. `/demi:retest` writes it; `/demi:exam` reads it to
render the dashboard.

```yaml
# <library>/study/<exam-slug>/readiness.yaml

updated: 2026-07-22                    # last time any domain was retested
domains:
  - id: D1                            # matches an exam.yaml domain id
    last_tested: 2026-07-22           # date of the most recent diagnostic covering this domain
                                      #   (null = never tested → status: unknown)
    last_taught: 2026-07-20           # date a mapped study/<topic> was last taught/studied
                                      #   (null = never); informational — retest is the source of truth
    questions: 10                     # items in the most recent measurement
    quadrants:                        # confidence-weighted 2×2 from the most recent measurement
      mastered: 4                     #   correct + confident   → skip
      fragile: 2                      #   correct + unsure       → light retest
      known_gap: 1                    #   incorrect + unsure     → teach
      blind_spot: 3                   #   incorrect + confident  → most dangerous; teach + fix mental model
    readiness: 0.50                   # computed 0–1 scalar (formula below)
    status: at-risk                   # derived: ready | close | at-risk | unknown
    attempts:                         # append-only history; each retest pushes one entry
      - date: 2026-07-22
        questions: 10
        quadrants: { mastered: 4, fragile: 2, known_gap: 1, blind_spot: 3 }
```

**Scalar readiness** (for the dashboard) credits confident-correct fully and
unsure-correct half; gaps score zero:

```
readiness = (mastered + 0.5 × fragile) / questions
```

**Blind spots are a separate hard signal, not just a low score.** A
confident-wrong answer is worse than a known gap because the learner wouldn't
choose to study it. `blind_spot` therefore drives triage *priority* directly
(PDR-010: priority = quadrant severity × domain weight) and gates the readiness
bar (PDR-011: zero blind spots in high-weight domains) — independent of the scalar
above.

**`status`** is a convenience label only; the authoritative, deadline-aware bar is
computed at dashboard time (flow step 5) from all domains × weights × `exam_date`:

- `unknown` — `last_tested` is null.
- `ready` — `readiness ≥ passing_score` **and** `blind_spot == 0`.
- `close` — meets the score but has blind spots, or sits just under the score.
- `at-risk` — otherwise.

**`attempts[]`** is the history that lets a later `/demi:retest` update one
domain without wiping others, and `last_tested` feeds the bar's "retested since
last teach" component (PDR-011).

### 5. Readiness dashboard & routing

Read `readiness.yaml` and show:

- the **confidence 2×2 per domain** — Mastered / Fragile / Known gap / Blind spot;
- the **deadline-aware bar** and named residual risk (PDR-011) — evidence only,
  **no "go sit it" call**;
- the **single highest-leverage next action**, weighted by domain × quadrant
  severity (blind spots first).

Route by **recommendation, not invocation** (ADR-009): name the concrete command
to run — `/demi:teach <slug>` for a mapped weak domain, or `/demi:learn
<domain>` to scaffold a topic for an unmapped one. The learner picks the moment.

_(Planned: richer dashboard rendering and the full deadline-aware margin curve.
Today, present the map and next action as clear text.)_

### 6. Re-runs

On a later `/demi:exam <exam-slug>`, recognize it: read `exam.yaml` and
`readiness.yaml` and open straight into the readiness dashboard + next action
rather than re-ingesting. Re-ingest only if the guide changed.

## State, not decisions

Unlike `/demi:learn`, this command does **not** commit PDRs/ADRs per exam. Its
durable output is **state** — `exam.yaml` and `readiness.yaml` — owned and
rewritten by `/demi:exam` and `/demi:retest`. (The decisions that *designed*
this capability live in the Demigo repo: PDR-008…011, ADR-008/009.)

## What this command does NOT do

- It does NOT teach, consolidate, or author curriculum — that's `/demi:teach`,
  `/demi:study`, and `/demi:learn`. This command steers; those do the work.
- It does NOT ship or serve a question bank — diagnostics are generated from your
  supplied materials (PDR-009). Sample questions are style references, never
  reproduced verbatim.
- It does NOT give a green light — it surfaces the readiness map and residual
  risk; the decision to sit the exam is the learner's (PDR-011).
- It does NOT replace the learning track — it's additive; learn/teach/study stay
  fully standalone (PDR-008).
- It does NOT auto-invoke `/demi:teach`, `/demi:study`, or `/demi:retest` —
  it recommends the exact command; you run it (ADR-009).
- It is NOT GCP- or certification-specific — it eats any blueprint: cloud cert,
  professional exam, school exam.

## Tone

You're a triage coach on a deadline, not a tutor. Push time toward the learner's
actual risk — high-weight domains with blind spots — and away from re-studying
what they've already cleared. Evidence over feelings: show the map, name the risk,
and let them make the call. And fight the perfectionism tail — when the bar's
cleared with margin, say so and stop; more studying isn't more ready.
