# Demigo 🦉

### In tandem with AI.

*Pronounced **DEM-ee-go** — "Demi," your companion, ready to go. (Formerly Tandem.)*

**An AI-assisted workflow for decision-first projects.**

Templates are a monologue. Demigo is a dialogue.

You and the model work together — you steer, the model interviews you, structured artifacts fall out as a side effect of the conversation. The atomic unit isn't a document; it's a **decision**. Everything else — PRDs, Roadmaps, SADs, Delivery Plans, study guides — is a *generated view* computed on demand from the current set of active decisions.

There are no approval gates. There are no status workflows. Conversation → confirm → commit → done. If a decision turns out wrong, you supersede it. If a phase turns out wrong, the retro routes you back to redo it. The framework trusts you to know when to revisit.

## Repo layout

```
tandem/
├── prompts/                    # source-of-truth markdown (the actual framework)
├── adapters/
│   ├── claude-code/            # install as Claude Code slash commands (/demi:*)
│   ├── cursor/                 # (planned) install as Cursor rules
│   └── skill/                  # project a Demigo prompt into a Claude Code SKILL.md
├── styles/
│   └── concept-style.css       # shared style for rendered concept-atom HTML (/demi:study)
├── renderer/                   # shared MD→HTML renderers (need pandoc + node)
│   ├── build.mjs               #   curriculum builder (/demi:teach) — seeded into the library
│   ├── build-docs.mjs          #   project-docs builder (/demi:render)
│   ├── lib.mjs                 #   shared rendering helpers
│   ├── template.html           #   page shell (sidebar nav + on-this-page TOC)
│   ├── style.css               #   stylesheet
│   └── mermaid.min.js          #   vendored client-side Mermaid (offline diagrams)
├── docs/
│   └── methodology.md          # long-form on the philosophy
├── install.sh                  # convenience wrapper → adapters/claude-code/install.sh
├── LICENSE                     # MIT
└── README.md                   # you are here
```

The `prompts/` directory is *the framework*. The adapters are distribution mechanisms — each translates the prompts into a form the target tool understands.

## Install (Claude Code)

```bash
git clone https://github.com/ceasarb/tandem.git ~/Developer/tandem
cd ~/Developer/tandem
./install.sh
```

Symlinks all Demigo prompts into `~/.claude/commands/demi/`. Restart Claude Code; commands are live as `/demi:<name>` everywhere.

Options:
- `./install.sh --copy` — copy files instead of symlinking
- `./install.sh --uninstall` — remove `~/.claude/commands/demi/`

## Install (other tools)

The Cursor adapter is planned. See `adapters/cursor/README.md`. Other adapters (Codex CLI, MCP server, tool-agnostic CLI) are on the roadmap.

Contributions welcome. The `prompts/` markdown is the source of truth; adapters translate.

## TL;DR usage

```
1. /demi:scaffold              # once per project — creates .claude/docs/{decisions,views,retros,discovery,design-refs}/
2. /demi:brainstorm            # have a conversation; the model drives Q&A; decisions commit as files
3. /demi:plan phase-1          # break the captured decisions into 5–25 min tasks
4. build the thing
5. /demi:retro                 # capture learnings, decide what's next
```

For client work with existing material: replace step 2 with `/demi:discovery <notes-file>`.

For learning / upskilling: `/demi:learn <topic>` (plan) → `/demi:teach <topic>` (acquire, layer by layer, rendered to HTML) → `/demi:study <concept>` (consolidate). All three write to the central concept library — see below.

## Commands

### Setup

| Command | Purpose |
|---|---|
| `/demi:scaffold` | Create `.claude/docs/{decisions,views,retros,discovery,design-refs}/` + project CLAUDE.md. Once per project. |

### Capture decisions (write to `decisions/`)

All top-of-funnel commands drive a conversation, draft PDRs/ADRs inline, and ask "commit? (y / edit / drop)". The interview script is what differs.

| Command | When to use |
|---|---|
| `/demi:brainstorm` | Self-directed work. You arrive with an idea. Model drives product Q&A then tech Q&A. |
| `/demi:discovery` | Client work. You arrive with material. Raw preserved verbatim; conflicts/ambiguities/unstated gaps surfaced. |
| `/demi:design` | Visual refinement phase. Reference-first interview (admired apps, anti-references), then structural design decisions. |
| `/demi:learn <topic>` | **Plan** a topic. Plan-mode Q&A committing PDRs/ADRs to the library, optionally scaffolds a curriculum, then hands off to `/demi:teach`. |
| `/demi:teach <topic>` | **Acquire** a topic. Authors a layered, anchor-first curriculum in the library's `study/` tree — one prose layer per invoke — and renders it to HTML by default. |
| `/demi:study <concept>` | **Consolidate** one idea. Feynman-test capture; probes weak spots. Writes MD + auto-rendered HTML atom, citing its curriculum layer. |
| `/demi:decide-product` | Focused PDR interview. Direct invocation or called inline. |
| `/demi:decide-tech` | Focused ADR interview. Direct invocation or called inline. |
| `/demi:refine <ID>` | Iterate on an existing decision. In-place if unshipped; supersede if shipped. |
| `/demi:onboard` | **Existing codebase.** Reverse-engineer it into evidence-cited ADRs + a contributor onboarding guide. Demigo's brownfield on-ramp. |

### Concept library management

| Command | Purpose |
|---|---|
| `/demi:pull <topic/slug>` | Add a library concept to the current project's `concepts.yaml`. No file copy. |
| `/demi:concepts` | List concepts pulled into this project (or `--library` for the full library). |

### Read decisions (write to `views/`)

Views are always regenerated, never hand-edited.

| Command | Produces |
|---|---|
| `/demi:rollup prd <phase>` | PRD view from PDRs tagged with the phase |
| `/demi:rollup roadmap` | Roadmap view from sequencing PDRs + phase tags |
| `/demi:rollup sad` | Solution Architecture view from active ADRs |
| `/demi:rollup study-guide <topic>` | Aggregated HTML study guide from concepts (for exam prep) |
| `/demi:plan <phase>` | CRAWL/WALK/RUN delivery plan; 5–25 min tasks with energy tags; first WALK task is deploy |

### Render & publish

| Command | Produces |
|---|---|
| `/demi:render` | A navigable static HTML site from a project's `.claude/docs/` (decisions, generated views, onboarding guide). Local, static, read-only; Mermaid diagrams render offline. |

### Forge agent skills

| Command | Produces |
|---|---|
| `/demi:skill-forge` | A bespoke, agent-invocable **skill bundle**. A convergent interview pins one autonomous agent to six facets (trigger · task · tools · guardrails · fail-safe · output) and emits a self-contained `SKILL.md` + decision trail to hand off. Demigo's engine aimed at authoring agents — not distributing Demigo itself. |

### Close the loop

| Command | Purpose |
|---|---|
| `/demi:retro <phase>` | 3-question retro. Proposes supersede/consolidate/deprecate actions on decisions. Names the next move. |

## Directory layout in a Demigo project

After `/demi:scaffold` in a project:

```
.claude/docs/
├── decisions/           # PDRs (product) and ADRs (technical). The source of truth.
├── views/               # Generated PRDs, Roadmaps, SADs, Delivery Plans. Do not edit.
├── retros/              # End-of-phase retros.
├── discovery/           # Raw client material (verbatim) + open-questions.md
└── design-refs/         # Visual references — admired apps, screenshots, notes
```

## Concept library (cross-project)

The `/demi:learn` and `/demi:study` commands write to a central concept library, separate from any project. Default location: `~/Developer/concepts/`.

Override with an environment variable:

```bash
export DEMI_CONCEPTS_DIR="$HOME/my-knowledge"
```

The library layout:

```
~/Developer/concepts/
├── style.css                       # shared style for rendered concept-atom HTML
├── study/                          # curricula (/demi:teach) — layered teaching content
│   ├── _assets/                    #   shared renderer, seeded from Demigo's renderer/
│   │   ├── build.mjs               #   run: node study/_assets/build.mjs <topic>
│   │   ├── template.html
│   │   └── style.css
│   └── <topic>[/<lens>]/           #   e.g. study/networking/gcp/
│       ├── 00_<topic>-session.md   #   anchor
│       ├── 00_<topic>-session.html #   rendered next to the .md, by default
│       ├── NN-<slug>.md            #   layer
│       ├── NN-<slug>.html          #   rendered next to the .md
│       └── README.md               #   Written / Planned curriculum state
├── <topic>/                        # atoms (/demi:study) — single Feynman-tested ideas
│   ├── <concept-slug>.md           #   source of truth
│   └── _html/
│       └── <concept-slug>.html     #   auto-rendered on /demi:study commit
└── _html/
    └── study-guide-<topic>.html    # aggregated topic guides
```

Curriculum layers render to HTML **by default** — `/demi:teach` runs the shared renderer after authoring or updating a layer (styled sidebar nav + on-this-page TOC, written next to each `.md`). The renderer needs `pandoc` and `node`; `install.sh` stages it at `~/.claude/commands/demi/_assets/` and the learning commands seed it into `study/_assets/` on first use.

Concepts are their own git repo. Push to GitHub as a personal knowledge portfolio. Projects reference concepts via `.claude/docs/concepts.yaml` — projects don't store copies.

Each concept has a `confidence:` field: `shaky` (I recognize it but can't explain it), `solid` (I can use it and understand the mechanism), or `teach-it` (I could teach it from scratch).

## Mental model

**Decisions are atoms.** Every meaningful piece of thinking is a *decision* — a choice between alternatives with consequences. PDRs and ADRs capture decisions. Same shape (Context → Options → Choice → Consequences); different interview scripts.

**Views are derived, never authored.** PRDs, Roadmaps, SADs, and Delivery Plans are read-only outputs computed from the current state of active decisions. To change a view, change the decisions and re-run `/demi:rollup` or `/demi:plan`.

**The lifecycle rule.** Before code ships against a decision, in-place edit. After code ships, meaningful changes create a NEW decision that supersedes the old one. Old file stays in the repo as history.

**Self-filter at draft time.** Before drafting any decision, the model asks itself: *"Is this a real decision, or a preference / fact / minor detail?"* If there's no real alternative, no meaningful consequence, or it's reversible in under an hour — the model says so and suggests inlining as a code comment instead.

**References ≠ decisions.** `discovery/` and `design-refs/` hold raw material — client notes, admired apps, screenshots. These are working inputs, freely appendable and deletable. Decisions extracted from them cite the source file/quote in their Context section.

**No gates, anywhere.** No `/approve`, no `/status`, no `/whats-stale`. Every command is conversation → commit → done.

## Session shape

```
                /demi:scaffold          (once per project)
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
   brainstorm      discovery         design       ← top-of-funnel (pick one)
       │               │               │
       │   (handoff to decide-* inline as decisions surface)
       ▼               ▼               ▼
                decide-product / decide-tech      ← commit decisions
                       │
                       ▼
              refine (when you change your mind)
                       │
       ┌───────────────┼───────────────┐
       ▼                               ▼
   rollup (PRD/Roadmap/SAD)         plan (CRAWL/WALK/RUN)   ← derived views
                       │
                       ▼
                build the thing
                       │
                       ▼
                     retro
                       │
                  decide what's next
```

Add `/demi:learn` + `/demi:study` orthogonally when you want to consolidate what you learned along the way.

## Philosophy

Demigo evolved out of a 12-artifact gated framework where the gates themselves became the paralysis trap. Strip the gates, collapse the artifacts into atoms, let the conversation do the structuring work. Every design decision in Demigo falls out of that:

- **Trust over gates** — the model asks confirmation, not permission.
- **Decisions over documents** — the atomic unit is a choice with alternatives; documents are downstream.
- **Conversation over templates** — templates are passive; interviews are active.
- **Derived over authored** — anything computable from atoms should be regenerated, not maintained.
- **Reversibility scales the ceremony** — cheap decisions get lightweight capture; expensive ones warrant a full record.

See `docs/methodology.md` for a longer treatment.

## Contributing

The `prompts/` markdown is the framework. Improvements to the interview scripts, better self-filter heuristics, or new command types all belong there.

New adapters (Cursor, Codex, MCP server, tool-agnostic CLI) live under `adapters/`. Each adapter reads the prompts and translates them into the target tool's format.

Open issues and PRs welcome.

## License

MIT. See `LICENSE`.
