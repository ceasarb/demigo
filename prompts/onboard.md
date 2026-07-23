---
description: Reverse-engineer an existing codebase into evidence-cited ADRs + a contributor-ready onboarding guide. Demigo's brownfield on-ramp.
argument-hint: "[path-to-repo] (defaults to current directory)"
---

# /onboard

Point Demigo at a codebase that **already exists** and turn it into the decision
records and documentation Demigo normally produces going forward. This is Demigo's
**brownfield on-ramp** (PDR-001): every architectural decision a repo embodies is
baked into its code but never written down, so `/plan`, `/rollup`, and `/refine`
have nothing to operate on. `/onboard` extracts that latent structure.

Two things come out of one run:

1. **Evidence-cited ADRs** in the target repo's `.claude/docs/decisions/` — the
   durable, Demigo-native artifacts the rest of the workflow consumes.
2. A **contributor-ready onboarding guide** in `.claude/docs/onboarding/` — a
   standalone document (arch map, environment setup, contribution flow) that falls
   out as a byproduct of the extracted material (ADR-002).

## Scope (read before running)

This command is **run-once** and **static-only** (PDR-002):

- It is invoked deliberately at onboarding. It is NOT a watcher/CI job that keeps
  docs continuously fresh.
- It reads source and docs as **files**. It does NOT run, instrument, or trace a
  live system to infer behavior. (The one exception is *procedural* claim
  validation in WALK — running the documented build/test to confirm it works —
  which is validation of a stated instruction, not runtime behavior analysis.)

## Usage

```
/onboard                       # onboard the current directory
/onboard ../temporal           # onboard a repo at a path
/onboard --out .claude/docs/_dryrun   # write extracted output to a sandbox dir (for dry-runs / self-targeting)
```

Default target is the current directory. Default output root is
`<target>/.claude/docs/`. Use `--out` when the target already has authored Demigo
decisions you don't want to collide with (e.g. running Demigo on itself).

## Where output goes

```
<out>/decisions/           # extracted ADRs (adr-NNN-*.md), evidence-cited
<out>/onboarding/guide.md  # the human onboarding guide
```

Extracted ADRs start numbering at ADR-001 within the target. If the target already
has ADRs, continue from the highest existing number.

## The extracted-ADR schema

Every extracted ADR uses the standard Demigo ADR frontmatter (so `/rollup`,
`/refine`, `/plan` read it as an ordinary ADR) **plus two fields** (ADR-003):

```markdown
---
artifact: adr
id: ADR-NNN
version: v0.1
status: active
created: YYYY-MM-DD
phase: onboarding
tags: [technical, extracted]
touches: []
supersedes: ~
superseded_by: ~
# --- extraction fields ---
evidence: "<file:line>"        # REQUIRED. No evidence → do not emit this ADR.
confidence: stated-verified    # set by the validator that ran (see vocabulary)
---

# ADR-NNN: <Short Title>

## Status

`active`

## Context

<What in the codebase forces / reflects this decision. Cite the evidence.>

## Decision

<One-sentence statement of what the code does, present tense.>

## Evidence

`<file:line>` — <quote or paraphrase of exactly what at that location shows this>.

## Consequences

**Enables**: <what this structure makes easy in the repo>

**Costs**: <what it makes harder / what a contributor must live with>

## Confidence

`stated-verified` — <one line: how this was validated>
```

The `evidence` field is the **anti-hallucination leash**: an extracted claim with
no `file:line` (or doc) it can point to is NOT written. If you can't cite it, drop
it.

## Confidence vocabulary

`confidence` is **set by whichever validator ran** — it is not a status the user
babysits (ADR-003). Everything that lands, lands as `active`; the badge records
*how* it earned trust.

| Value | Meaning | Set by |
|---|---|---|
| `stated-verified` | Structural fact; its citation was re-opened and holds up | Step 3 (citation re-check) |
| `executed` | Procedural claim (build/test/setup) that was actually run green | Step 4 (execution) |
| `execution-skipped` | Procedural claim that couldn't run here (missing infra/secrets); reason recorded | Step 4 (execution) |
| `corroborated` | Inferred rationale backed by an independent source (doc/commit/PR) | Step 5 (corroboration) |
| `confirmed` | The user personally endorsed it via `/refine` | manual (RUN task) |

Uncorroborated guesses are **never** written as ADRs. They go into the guide's
"Open Questions" section (ADR-003) — a holding pen, not `decisions/`.

---

## Flow

> **Implemented:** Steps 1–6 — `stated` extraction (with citation re-check),
> execution validation, and corroboration. All three validators run.

### Step 1 — Orient

Build a map of the target before extracting anything:

1. Detect languages and package manifests (`go.mod`, `package.json`, `pyproject.toml`,
   `Cargo.toml`, `pom.xml`, etc.).
2. Find build/task entry points (`Makefile`, `justfile`, `Taskfile`, npm scripts,
   `Dockerfile`, CI workflows).
3. Find docs (`README`, `CONTRIBUTING`, `docs/`, `ARCHITECTURE.md`, ADRs the
   project may already keep).
4. Identify top-level components (major directories and what each is for).

Capture the current commit for stamping: `git -C <target> rev-parse HEAD`.

**Ecosystem signal map.** The same claim — "what deps," "what version," "how to
build/test" — lives in different files per language. Detect the ecosystem from its
manifest, then read the ecosystem-appropriate sources. Do not assume Go (or any one
language):

| Ecosystem | Deps / version source | Build / test entry points |
|---|---|---|
| Go | `go.mod`, `go.sum` | `Makefile`, `go build`, `go test`, CI workflow |
| Node / TS | `package.json` (deps, `engines`), lockfile, `.nvmrc` | `package.json` scripts, `Makefile`, `Dockerfile` |
| Python | `pyproject.toml` / `setup.cfg` / `requirements*.txt`, `.python-version` | `tox.ini`, `noxfile.py`, `Makefile`, `pytest` |
| Rust | `Cargo.toml`, `Cargo.lock` | `cargo build`, `cargo test`, `Makefile` |
| JVM | `pom.xml` / `build.gradle`, `.tool-versions` / `.sdkmanrc` | `mvn` / `gradle` targets, `Makefile` |
| Ruby | `Gemfile`, `.ruby-version` | `Rakefile`, `bundle exec` |
| Polyglot / infra | `.tool-versions`, `Dockerfile`, `docker-compose.yml`, CI matrix | container build, CI jobs |

If the repo mixes ecosystems (a monorepo), extract **per component**: a `stated`
ADR can be scoped to a subtree ("the `web/` package uses …"). Never flatten a
polyglot repo into a single language's assumptions.

### Step 2 — Extract `stated` claims

Scan the oriented map for **structural facts the code literally shows** — the kind
of thing you could point at a line for. Examples:

- "Uses Postgres" ← a driver in `go.mod` / a connection string in config
- "HTTP API built on gRPC" ← `.proto` files + generated stubs
- "Distributed as a CLI installed via symlink" ← the installer script
- "Renderer depends on Node + pandoc" ← the build script's shebang/invocations

For each, draft one ADR using the schema above, with a concrete `file:line` in
`evidence`. **One decision per ADR.** Do not infer *why* a choice was made here —
that is inferred rationale (WALK). CRAWL emits only what the code states.

### Step 3 — Citation re-check (validator)

For every drafted ADR, re-open the exact `file:line` in `evidence` and confirm it
actually supports the claim:

- **Holds up** → set `confidence: stated-verified`, keep the ADR.
- **Doesn't hold up / can't be found** → **drop the ADR.** Do not emit it. Better a
  smaller true set than a confidently-wrong one.

Write the surviving ADRs to `<out>/decisions/`.

### Step 4 — Execution validation (validator)

Some claims are **procedural** — they tell a contributor how to set up, build,
test, or run the project (sourced from README / CONTRIBUTING / Makefile / CI
workflows). These are validated by *doing*:

1. **Classify** the procedural claims: `setup` (fetch deps/toolchain), `build`,
   `test`, `run`.
2. **Execute in dependency order** — setup → build → test — against the target
   repo. Capture each command's exit code and the tail of its output.
3. **Record the result:**
   - **Green** → emit/keep the ADR with `confidence: executed`; in `Evidence`,
     cite the exact command run *and* that it succeeded.
   - **Fails because the docs are wrong/incomplete** → do NOT mark `executed`.
     Record the corrected steps in the guide's environment-setup section (the
     tool's whole point is not lying about setup).
   - **Fails because the environment genuinely can't run it** (missing infra,
     credentials, external services) → mark `confidence: execution-skipped` with
     the reason. Do not treat as a doc error. See **Execution fallback** below.
4. This step **is PDR-003's success bar** *when the environment allows it*: a green
   build + test run driven by the documented steps is the contributor-ready proof.
   When it can't run here, the fallback below keeps the run honest rather than
   failing it.

**Guardrails:** time-box long builds; run only declared-dependency fetches and
build/test commands — never destructive or arbitrary networked commands; anything
requiring secrets or live external services is `execution-skipped`, not failed.

#### Execution fallback — when the build can't run here

Execution validation is **best-effort, not a hard gate.** A repo may be un-runnable
in this environment for reasons that are nobody's fault: a licensed toolchain, cloud
credentials, a running datastore, a specific OS/arch, or a multi-service compose
stack. When that happens, **degrade — never fail the whole run:**

1. **Decide the reason.** Separate "the documented steps are wrong" (a doc error —
   correct them in the guide) from "the environment can't run this here" (missing
   infra / secrets / services / toolchain — a skip). When genuinely unsure, it is a
   skip, not a green.
2. **Record the skip on the claim.** Mark the procedural ADR `confidence:
   execution-skipped`; in `Evidence`, cite the documented command **and** one line
   on why it couldn't run and what it would need (`requires a running Postgres`,
   `needs a licensed Oracle client`, `depends on an internal artifact registry`).
3. **Surface it in the guide.** Add the skipped tier to **Troubleshooting &
   gotchas** (what a newcomer will hit → what's actually required). If the *golden
   path itself* couldn't be fully executed, say so plainly in "What you'll end up
   with" — don't imply a verified run you didn't achieve.
4. **PDR-003, honestly.** A guide whose runnable steps are marked `executed` and
   whose un-runnable steps are marked `execution-skipped` **with the requirement
   stated** is still contributor-ready — it doesn't lie. A guide that claims a green
   run it never achieved is not. Never fabricate an `executed`: the absence of a
   green run is `execution-skipped`, not a silent pass.

### Step 5 — Corroboration search + Open Questions (validator + holding pen)

For **inferred rationale** — *why* a choice was made, which the code only implies —
the code cannot prove it. Search independent sources for support:

1. **Sources, in descending authority:** in-repo docs (README, CONTRIBUTING,
   `docs/`, `ARCHITECTURE.md`, design docs, any ADRs the project already keeps) →
   commit messages (`git log`) → PR/issue descriptions if reachable.
2. **For each inferred claim, look for an explicit statement of the rationale:**
   - **Found** → emit an ADR with `confidence: corroborated`; in `Evidence`, cite
     **both** the code evidence (`file:line`) *and* the corroborating source
     (doc path / commit ref).
   - **Not found** → do NOT write an ADR. Add it to the guide's **"Open Questions /
     Unverified Assumptions"** section as a flagged hypothesis, with the evidence
     that prompted it. This is the holding pen (ADR-003): `decisions/` stays clean;
     guesses live in the guide, not as decision records.
3. **Graduation:** an Open Question becomes an ADR only if later corroborated, or
   when the user confirms it via `/refine`.

**Threshold:** one authoritative source that plainly states the reason is enough to
corroborate. Passing/ambiguous mentions are not — those stay Open Questions.
(Tuning this threshold is a RUN task.)

### Step 6 — Write the onboarding guide

The guide is **co-equal with extraction, not an afterthought** (PDR-003). The
success bar is *contributor-ready*: a newcomer who knows nothing about this repo
must reach a running system by following this document **alone**. Optimize for
"do exactly this, in order, and verify" — NOT for reference completeness. The most
common failure is dumping parallel option-lists (here's build, here's test, here's
run) and making the reader assemble the one path themselves. Don't. Give them the
one path first.

Write `<out>/onboarding/guide.md`, a **standalone descriptive document** (ADR-002):

```markdown
# Onboarding Guide — <repo name>

> Generated by `/demi:onboard` on YYYY-MM-DD from commit `<short-sha>`.
> Point-in-time snapshot — the repo may have drifted. Regenerate to refresh.

## What you'll end up with
<1–2 sentences orienting the reader BEFORE any commands: after setup you'll have
<artifact> running at <address>, doing <observable thing>.>

## Architecture map
<Major components and how they relate. For the "why", link the extracted ADRs
(e.g. "see ADR-002") — do not re-derive rationale here.>

## Prerequisites
<Every tool the golden path needs, each with a CONCRETE version + a verify command.
Pull versions from go.mod / .tool-versions / CI configs / engines fields — never
"latest" or "the version in the config".>
- <tool> <version> — install: `<cmd>` — verify: `<cmd>` (expect `<output>`)

## Quickstart (golden path)
<The SINGLE shortest ordered sequence from a fresh clone to a running system. ONE
path — no "or you could". Prefer the zero-external-deps path if one exists (e.g.
in-memory DB). Every command MUST be one Step 4 actually ran green (or be clearly
marked unverified). After EACH step, a verification checkpoint.>

1. `<command>` — <what it does>
   ✓ You should see <X>.
...
N. `<start it>` — ✓ <observable proof it's up: a URL responds, a log line, a CLI check>.

## Making your first change
<A CONCRETE walkthrough, not generic advice:
- a small representative place to edit (name a real file/package),
- how to rebuild ONLY that (the fast inner loop), not the whole world,
- the specific test to run for it and roughly how long it takes,
- how to confirm the change took effect.>

## Build / test reference
<Only AFTER the golden path: the fuller option matrix — all build targets, test
tiers and which need external deps, alternate backends. Reference material lives
here, clearly secondary to the Quickstart.>

## Troubleshooting & gotchas
<The "why is my setup broken" section. Populate from BOTH docs (platform notes,
known-issue callouts) AND what execution actually hit this run (toolchain version
mismatches, steps that needed a workaround, tiers that were execution-skipped and
why). Each item: symptom → cause → fix.>

## Contribution flow
<Repo conventions: PR/commit rules, CLA, proto/codegen steps, where deeper docs live.>

## Extracted decisions
<Bulleted index of ADRs written this run: ID + one-line + confidence badge, linked.>

## Open Questions / Unverified Assumptions
<Hypotheses the tool could not corroborate. NOT ADRs. Each with the evidence that
prompted it. Promote only when corroborated or user-confirmed via /refine.>
```

Rules for the guide:

- **The Quickstart is singular and mandatory.** If you catch yourself writing "or
  you could", move the alternative to Build / test reference. Exactly one path.
- **Every Quickstart step ends in a verification checkpoint.** A step with no "you
  should see X" is not done.
- **Prerequisites carry concrete versions + verify commands** — never "latest".
- **Troubleshooting is fed by execution**, not just docs — the friction Step 4 hit
  is the most valuable content in that section.
- **Do not duplicate ADR rationale** — for architecture "why", link the ADR ID.
- **Stamp it** with commit SHA + date (snapshot — PDR-002).
- It is NOT a `/rollup` view — it lives in `onboarding/`, descriptive of what exists.

### Step 6 self-check (PDR-003 gate)

Before finishing, ask: *"Could a competent engineer who has never seen this repo
reach a running system using ONLY the Prerequisites + Quickstart — without guessing
or opening other docs?"* If not, the guide is not contributor-ready. Find the gap
(usually a missing version, an unstated step, or a missing verification checkpoint)
and fill it before writing the file.

---

## What this command does NOT do

- It does NOT keep docs fresh over time (run-once, PDR-002).
- It does NOT run or trace the system to infer behavior (static-only, PDR-002).
- It does NOT write uncorroborated guesses as ADRs — those are guide Open Questions.
- It does NOT gate. Extracted ADRs land as `active`; the `confidence` badge is the
  honest signal, not an approval workflow.
- It does NOT modify the target repo's source — only writes under the output root.

## Tone

You're reverse-engineering, not authoring. Be conservative: a smaller set of ADRs
you can each point at a line for beats a large set of plausible guesses. When in
doubt about whether something is `stated` or `inferred`, it's inferred — leave it
for WALK.
