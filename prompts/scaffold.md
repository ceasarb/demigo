---
description: Scaffold the Tandem structure in a new project. Conversation-driven, decision-first — no tiers, no manifest, no phase stubs.
argument-hint: "[project-name]"
---

# /scaffold

Scaffold Tandem in a new project. Tandem is **decision-first** — there are no PRD/TDD/Roadmap stubs to fill in, because those are generated views over committed PDRs and ADRs.

(Named `/scaffold` rather than `/init` because Claude Code already ships a built-in `/init` command that generates a CLAUDE.md from the codebase.)

## Usage

```
/scaffold                          # ask for project name, infer from directory
/scaffold my-cost-dashboard
```

## What Gets Created

```
.claude/docs/
├── decisions/                # PDRs and ADRs live here, append-only after shipping
│   └── .gitkeep
├── views/                    # Generated views from /rollup and /plan
│   └── .gitkeep
├── retros/                   # End-of-phase retros
│   └── .gitkeep
├── discovery/                # Raw client material (notes, transcripts) + open-questions.md
│   └── .gitkeep
└── design-refs/              # Visual references — apps you admire, screenshots, mood notes
    └── .gitkeep
```

Plus a project-level `CLAUDE.md` at the repo root.

**That's it.** No MANIFEST.yaml. No phase-1 directory. No stubs to fill in. Decisions get created when you run `/brainstorm`, `/discovery`, `/design`, or `/decide-*`. Views get created when you run `/rollup` or `/plan`.

## Flow

### 1. Confirm basics

Ask (one at a time):

1. **Project name?** Suggest from the current directory name.
2. **One-line description?** What is this project, in 12 words or fewer.

That's it. No tier question — Tandem doesn't have tiers. The framework scales itself to whatever decisions you actually capture.

### 2. Check for existing state

If `.claude/docs/` already exists and isn't empty:

> ".claude/docs/ already has content. Options:
> - **Skip** — don't touch existing state
> - **Append** — add Tandem directories alongside, don't modify existing
> - **Migrate** — try to map existing artifacts (PRD/Roadmap/etc.) from a heavier framework into Tandem PDRs/ADRs (interactive)
>
> Which?"

Default to **skip** if user is uncertain.

### 3. Create directories

```bash
mkdir -p .claude/docs/{decisions,views,retros,discovery,design-refs}
touch .claude/docs/{decisions,views,retros,discovery,design-refs}/.gitkeep
```

### 4. Create / update CLAUDE.md

If no `CLAUDE.md` at the project root, create one:

```markdown
# <Project Name>

<One-line description>

## Framework

This project uses Tandem — decision-first, conversation-driven.

**Commands** (invoked as `/tandem:<name>`):
- `brainstorm` — open conversation; commits PDRs and ADRs as decisions surface
- `discovery` — ingest client material; preserve raw, extract candidate decisions
- `design` — design-mode conversation; commits design PDRs/ADRs + manages visual references
- `decide-product` — focused PDR interview
- `decide-tech` — focused ADR interview
- `refine <ID>` — iterate on an existing decision
- `rollup <prd|roadmap|sad> [phase]` — regenerate a view
- `plan <phase>` — regenerate a CRAWL/WALK/RUN delivery plan
- `retro <phase>` — end-of-phase retro

**Where things live:**
- `.claude/docs/decisions/` — PDRs (product) and ADRs (technical), append-only after shipping
- `.claude/docs/views/` — generated PRDs, Roadmaps, SADs, Delivery Plans (do not edit)
- `.claude/docs/retros/` — end-of-phase retros
- `.claude/docs/discovery/` — raw client material + open-questions.md
- `.claude/docs/design-refs/` — visual references with notes

**No gates.** Commit what you decide; iterate when you learn more. Views are regenerated, never hand-edited.
```

If a `CLAUDE.md` already exists, do NOT overwrite. Show the proposed Tandem block and ask:

> "CLAUDE.md already exists. Want me to append the Tandem section, or skip?"

### 5. Suggest next step

> "Done. Next step is usually `/brainstorm` to start capturing decisions. If you already know exactly what you want to build, you can jump to `/decide-product` for the first scope decision."

## What this command does NOT do

- It does NOT create a MANIFEST.yaml. Tandem has no dependency graph — views are computed on demand by `/rollup` and `/plan`.
- It does NOT create phase directories or per-phase stubs. Phases exist in `phase:` fields on decisions, not as directories.
- It does NOT ask for a tier.
- It does NOT create any PRD, TDD, SAD, Roadmap, or Delivery Plan stubs.

## Tone

This is the smallest possible scaffold. Don't ceremony it up.
