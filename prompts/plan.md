---
description: Generate a CRAWL/WALK/RUN delivery plan from the current decisions for a phase. Tasks are 5-25 minutes with energy tags. First WALK task is always deployment.
argument-hint: <phase>
---

# /plan

Generate an executable delivery plan for a phase from the currently committed PDRs and ADRs.

A Delivery Plan is a **generated view** like the rollups — but unlike PRDs/Roadmaps/SADs, it gets opened and worked through. So it's allowed to be conversation-augmented during generation (the user can adjust task sizing, energy levels, ordering as we draft).

## Usage

```
/plan phase-1
/plan phase-2
```

## Where it goes

`.claude/docs/views/delivery-plan-<phase>.md`

Generated banner at the top:

```markdown
> **This is a generated plan.** Tasks may be checked off in place, but structural changes (new tasks, reordering, scope) should go through the underlying decisions and `/plan` re-run.
> Generated: YYYY-MM-DD HH:MM from N decisions.
```

## Flow

### 1. Load context

- All PDRs and ADRs where `phase: <phase>` and `status: active`.
- If nothing matches: tell the user, suggest running `/brainstorm` or `/decide-*` first. Don't write an empty plan.

### 2. Propose CRAWL / WALK / RUN buckets

Based on the decisions, draft three buckets:

- **CRAWL** — the smallest possible end-to-end thing that proves the idea works. Often just one path through the system, minimal UI, hardcoded values are fine.
- **WALK** — the version someone could actually use. First WALK task is **always deployment** (per global framework rule). Real auth, real data, real deploy target.
- **RUN** — polish, edge cases, observability, scale.

Show the user the bucket structure first, before drafting individual tasks:

> "Drafting plan for phase-1. Bucket shape:
> - CRAWL: [one-liner]
> - WALK: [one-liner — first task: deploy CRAWL behind real domain]
> - RUN: [one-liner]
>
> Look right, or adjust before I expand tasks?"

### 3. Expand each bucket into tasks

Tasks must:

- **Be 5–25 minutes each.** Anything bigger gets split. If you can't split it, ask the user how.
- **Have a clear completion criterion.** "Done when X file exists and `npm test` passes."
- **Be energy-tagged**: 🔴 Deep Focus / 🟡 Medium Focus / 🟢 Low Focus.
- **Reference source decisions** by ID. Example: `(PDR-003, ADR-007)`.

Format:

```markdown
### CRAWL

- [ ] 🟡 Scaffold project directory and toolchain (PDR-001) — 15 min
  - Done when `npm install && npm run dev` boots a hello-world page.
- [ ] 🟡 Wire Postgres connection (ADR-003) — 20 min
  - Done when `select 1` succeeds from app code.
- [ ] 🔴 First end-to-end feature path (PDR-002, ADR-004) — 25 min
  - Done when [the smallest user-visible thing] works locally.

### WALK

- [ ] 🔴 **Deploy CRAWL to chosen target** (ADR-005) — 25 min
  - Done when the deployed URL serves the CRAWL feature.
- ...

### RUN

- ...
```

### 4. Self-filter

Before committing, check:

- **Total task count**: if CRAWL has more than ~6 tasks, it's not really CRAWL. Push back: *"CRAWL has 9 tasks. That's WALK territory. Split this into a smaller CRAWL?"*
- **First WALK task**: confirm it's deployment. If not, flag and suggest moving it up.
- **Estimated total time**: sum up. If CRAWL > 2 hours, the scope is wrong, not the plan.
- **Orphan decisions**: any active PDR/ADR in this phase with NO task referencing it? Either it's not implementable as-is (suggest `/refine`) or the plan missed something (add a task).

### 5. Show the user, ask to commit

Render the full plan in chat. Ask:

> "Write to `<path>`? (y / edit / drop)"

On `y`: write the file.
On `edit`: ask what to change. Adjust. Re-render. Re-ask.

## Iteration

Re-running `/plan <phase>` overwrites the existing plan file. Checkboxes the user has checked off will be wiped — flag this:

> "You have 4 checked tasks in the existing plan. Regenerating will wipe them. Continue? (y / merge-progress / cancel)"

On `merge-progress`: try to match existing checked tasks to new tasks by title fuzzy-match and preserve the check state. Surface mismatches.

## What this command does NOT do

- It does NOT modify decisions.
- It does NOT execute tasks.
- It does NOT block on persona reviews. (Demigo has no review gates.)
- It does NOT enforce a "delivery plan must exist before coding" rule. Code first if you want — this exists to make the plan visible, not gate work behind it.

## Tone

You're a planner sitting next to the user. Suggest the bucket shape, get a read, then expand. Don't drop a 30-task wall of markdown without checkpointing.
