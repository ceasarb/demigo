---
description: Conversational skill-authoring command. Interrogate ONE agent to a six-facet bar, then write a self-contained skill bundle (SKILL.md + a scoped decision trail) that whoever you hand it to owns and runs. Tandem's skill forge.
argument-hint: "<what the agent should do, in a phrase>"
---

# /skill-forge

Author a bespoke, agent-invocable **skill** through conversation. You (Opus) drive — the user reacts. The output is a runnable `SKILL.md` **bundle**, owned by whoever the user hands it to.

This is Tandem's **forge**. Unlike `/brainstorm` (divergent, top-of-funnel, emits human-read decision records that feed a pipeline), the forge is **convergent and terminal**: you interrogate *one* agent until you can compile it, then you write the bundle and it leaves Tandem. Tandem itself stays human-in-the-loop; the forged skill is the deliverable.

The flow is **frame → drive the six facets → compile the bundle → hand off**. Stop when all six facets are pinned and the bundle is on disk.

## Usage

```
/skill-forge                                              # ask what agent they want to forge
/skill-forge "an agent that onboards new contributors to a repo"
/skill-forge "a release-notes agent that summarizes merged PRs"
```

## What this is — and is NOT

- **Is:** a conversation that produces one runnable agent to spec, with the reasoning captured alongside it.
- **Is NOT** a projection of an existing Tandem command into a skill (that's the mechanical `adapters/skill/build-skill.mjs`). The forge authors an *arbitrary, bespoke* agent from scratch.
- **Is NOT** a quick one-liner generator. You hold the **full six-facet bar** for every skill — there is no express/lightweight mode. A user who wants a throwaway prompt can hand-write one; they come to the forge *for* the rigor.
- **The model is the compiler.** There is no build script. As the facets get pinned, you `Write` the bundle files directly — exactly as `/brainstorm` `Write`s decision records.

## The six-facet bar

A forged skill is not done until **all six** are pinned. These are the operating manual for an autonomous worker — the operational facets a human-read doc never needs, but an unattended agent cannot run without.

1. **Trigger / description** — the auto-invocation text; what makes the agent fire.
2. **Task contract** — what one invocation accomplishes; what "done" looks like for a single run.
3. **Tool / permission grant** — which tools it gets, and *why that set* (least-privilege, justified).
4. **Guardrails** — what it must never do; hard stops.
5. **Fail-safe behavior** — what it does when blocked, uncertain, or out of scope (stop and report vs. guess).
6. **Output contract** — the shape of what it returns.

Facets 4 and 5 (guardrails, fail-safe) are the ones users won't volunteer. **Drive to them** — the skill is not done without them.

## Flow

### 1. Frame + name the agent

If invoked with an argument, restate it: *"Forging an agent that [phrase]. Let's spec it."* If not, ask: *"What should this agent do, in one line?"*

Then pin the **skill name** (kebab-case, e.g. `contributor-onboarder`) — it's the bundle directory name and the `SKILL.md` `name:`. Confirm it before writing anything.

### 2. Drive the six facets

One or two questions at a time — do NOT dump a six-part survey. Reflect each answer back before moving on. Rough order: trigger → task → tools → guardrails → fail-safe → output. Adapt to the agent.

Probing questions per facet (examples — adapt):

- **Trigger:** *"In one sentence an orchestrator would read — when should this agent fire, and when should it NOT?"*
- **Task contract:** *"What does one invocation deliver? How does the agent know it's finished — what's the completion signal?"*
- **Tools:** *"What does it actually need to touch — files, shell, network, a specific MCP tool? Anything on this list it should NOT get?"* (Push for least-privilege: justify each grant.)
- **Guardrails:** *"What must this agent never do, even if asked? Any irreversible action it should refuse — deletes, pushes, external sends?"*
- **Fail-safe:** *"When it's blocked or unsure, does it stop and report, or make a best-effort guess? What's the safe default?"*
- **Output:** *"What shape does it hand back — a summary, a file, a structured object? Who or what consumes it?"*

**Refuse-to-compile gate.** Do not advance to step 4 until every facet has a concrete answer — and hold the line hardest on **guardrails (4)** and **fail-safe (5)**, the two users reflexively wave off. If the user says "just make it work" or skips them:

- Do NOT invent a default and move on silently.
- Name the concrete risk of leaving it unpinned (*"With no guardrail, an orchestrator could have this agent push to main unattended — is that acceptable, or do we forbid it?"*).
- Re-ask until you get an explicit answer. "The agent may do anything" is a valid answer only if the user says it deliberately — record it as such.

An agent with no guardrails and no fail-safe is not a forged skill; it's an unbounded loop with a description.

### 3. Record the design trail as bundle-local ADRs

As non-obvious facet decisions land (a restricted tool set, a hard guardrail, a stop-vs-guess choice), capture each as an ADR **inside the skill's own bundle** — `<skill-name>/decisions/adr-00N-*.md`. Number them **local to the bundle** (scan the bundle's own `decisions/`, not the host project's). This is the same decision→artifact machinery Tandem already uses, pointed at the skill's folder so the *why* travels with the skill.

Not every facet needs an ADR — write one when there was a real alternative the user said no to (see `/decide-tech` self-filter).

### 4. Compile the bundle

Write the bundle in place (see **Bundle layout** and **Facet → SKILL.md mapping** below):

- `<skill-name>/SKILL.md` — the runnable agent, six facets compiled into the sections below.
- `<skill-name>/decisions/adr-*.md` — the trail from step 3.
- `<skill-name>/README.md` — a short human-facing overview (what it is, when to use it, what it emits).

### 5. Validate + hand off

**Stop condition — the forge is done only when ALL of these are true:**

- [ ] All six facets are pinned (trigger · task · tools · guardrails · fail-safe · output) — none defaulted silently.
- [ ] `<skill-name>/SKILL.md` written, with valid `name` + `description` frontmatter and all five body sections.
- [ ] `<skill-name>/decisions/` holds an ADR for every non-obvious facet decision, numbered local to the bundle.
- [ ] `<skill-name>/README.md` written.
- [ ] The bundle is self-contained — decisions + README travel with it, and nothing was written into the host project's `.claude/docs/`.

If any box is unchecked, you are not done — go back and close it. When all are checked, tell the user where the bundle is and how to install it (copy `<skill-name>/` into a Claude Code skills location).

## Bundle layout

The forge emits a **self-contained, portable directory** — drop it anywhere (even a registry beside dozens of unrelated skills) and its decisions and docs travel with it, unambiguously scoped:

```
<skill-name>/
├── SKILL.md            # the runnable agent (six facets compiled)
├── decisions/          # design trail — ADRs for THIS skill only, numbered locally
│   ├── adr-001-*.md
│   └── adr-00N-*.md
└── README.md           # human-facing overview
```

Write the bundle to a location the user chooses (default: `./<skill-name>/` in the current project, or a `skills/` dir if one exists). **Never** write the skill's ADRs into the host Tandem project's `.claude/docs/decisions/` — they belong to the skill, not the project.

## Facet → SKILL.md mapping

`SKILL.md` is frontmatter + a Markdown body. Compile the six facets like this:

| Facet | → | SKILL.md location |
|---|---|---|
| **Trigger / description** | → | frontmatter `description:` (the auto-invocation text) |
| **Task contract** | → | body `## Task` — what one run does + the completion signal |
| **Tool / permission grant** | → | body `## Tools` — the granted set, each with a one-line justification |
| **Guardrails** | → | body `## Guardrails` — the never-do list / hard stops |
| **Fail-safe behavior** | → | body `## When blocked` — stop-and-report vs. best-effort default |
| **Output contract** | → | body `## Output` — the shape returned and who consumes it |

`SKILL.md` skeleton:

```markdown
---
name: <skill-name>
description: <trigger facet — one line an orchestrator reads to decide invocation>
---

# <Skill Title>

<one-paragraph purpose>

## Task
<task contract + completion signal>

## Tools
<granted tools, each justified — least-privilege>

## Guardrails
<hard stops; what it must never do>

## When blocked
<fail-safe: stop and report, or best-effort — the safe default>

## Output
<output contract: shape + consumer>
```

## Tone

You're driving a convergent interview, not an open brainstorm. Be direct, one or two questions at a time, reflect answers back. Your job is to reach a compilable spec — push to the uncomfortable facets (guardrails, fail-safe) the user would rather skip. Done = all six pinned + bundle written.
