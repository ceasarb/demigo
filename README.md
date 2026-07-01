# Tandem

**An AI-assisted workflow for decision-first projects.**

Templates are a monologue. Tandem is a dialogue.

You and the model work together — you steer, the model interviews you, structured artifacts fall out as a side effect of the conversation. The atomic unit isn't a document; it's a **decision**. Everything else — PRDs, Roadmaps, SADs, Delivery Plans, study guides — is a *generated view* computed on demand from the current set of active decisions.

There are no approval gates. There are no status workflows. Conversation → confirm → commit → done. If a decision turns out wrong, you supersede it. If a phase turns out wrong, the retro routes you back to redo it. The framework trusts you to know when to revisit.

## Repo layout

```
tandem/
├── prompts/                    # source-of-truth markdown (the actual framework)
├── adapters/
│   ├── claude-code/            # install as Claude Code slash commands (/tandem:*)
│   └── cursor/                 # (planned) install as Cursor rules
├── styles/
│   └── concept-style.css       # shared style for rendered concept HTML
├── docs/
│   └── methodology.md          # long-form on the philosophy
├── install.sh                  # convenience wrapper → adapters/claude-code/install.sh
├── LICENSE                     # MIT
└── README.md                   # you are here
```

The `prompts/` directory is *the framework*. The adapters are distribution mechanisms — each translates the prompts into a form the target tool understands.

## Install (Claude Code)

```bash
git clone https://github.com/<your-user>/tandem.git ~/Developer/tandem
cd ~/Developer/tandem
./install.sh
```

Symlinks all Tandem prompts into `~/.claude/commands/tandem/`. Restart Claude Code; commands are live as `/tandem:<name>` everywhere.

Options:
- `./install.sh --copy` — copy files instead of symlinking
- `./install.sh --uninstall` — remove `~/.claude/commands/tandem/`

## Install (other tools)

The Cursor adapter is planned. See `adapters/cursor/README.md`. Other adapters (Codex CLI, MCP server, tool-agnostic CLI) are on the roadmap.

Contributions welcome. The `prompts/` markdown is the source of truth; adapters translate.

## TL;DR usage

```
1. /tandem:scaffold              # once per project — creates .claude/docs/{decisions,views,retros,discovery,design-refs}/
2. /tandem:brainstorm            # have a conversation; the model drives Q&A; decisions commit as files
3. /tandem:plan phase-1          # break the captured decisions into 5–25 min tasks
4. build the thing
5. /tandem:retro                 # capture learnings, decide what's next
```

For client work with existing material: replace step 2 with `/tandem:discovery <notes-file>`.

For learning / upskilling: use `/tandem:learn <topic>` and `/tandem:study <concept>` (writes to the central concept library — see below).

## Commands

### Setup

| Command | Purpose |
|---|---|
| `/tandem:scaffold` | Create `.claude/docs/{decisions,views,retros,discovery,design-refs}/` + project CLAUDE.md. Once per project. |

### Capture decisions (write to `decisions/`)

All top-of-funnel commands drive a conversation, draft PDRs/ADRs inline, and ask "commit? (y / edit / drop)". The interview script is what differs.

| Command | When to use |
|---|---|
| `/tandem:brainstorm` | Self-directed work. You arrive with an idea. Model drives product Q&A then tech Q&A. |
| `/tandem:discovery` | Client work. You arrive with material. Raw preserved verbatim; conflicts/ambiguities/unstated gaps surfaced. |
| `/tandem:design` | Visual refinement phase. Reference-first interview (admired apps, anti-references), then structural design decisions. |
| `/tandem:learn <topic>` | Learning a new topic. Plan-mode Q&A committing PDRs/ADRs, then hands off to study mode. |
| `/tandem:study <concept>` | Feynman-test capture. Probes weak spots, captures consolidated explanation. Writes MD + auto-rendered HTML. |
| `/tandem:decide-product` | Focused PDR interview. Direct invocation or called inline. |
| `/tandem:decide-tech` | Focused ADR interview. Direct invocation or called inline. |
| `/tandem:refine <ID>` | Iterate on an existing decision. In-place if unshipped; supersede if shipped. |

### Concept library management

| Command | Purpose |
|---|---|
| `/tandem:pull <topic/slug>` | Add a library concept to the current project's `concepts.yaml`. No file copy. |
| `/tandem:concepts` | List concepts pulled into this project (or `--library` for the full library). |

### Read decisions (write to `views/`)

Views are always regenerated, never hand-edited.

| Command | Produces |
|---|---|
| `/tandem:rollup prd <phase>` | PRD view from PDRs tagged with the phase |
| `/tandem:rollup roadmap` | Roadmap view from sequencing PDRs + phase tags |
| `/tandem:rollup sad` | Solution Architecture view from active ADRs |
| `/tandem:rollup study-guide <topic>` | Aggregated HTML study guide from concepts (for exam prep) |
| `/tandem:plan <phase>` | CRAWL/WALK/RUN delivery plan; 5–25 min tasks with energy tags; first WALK task is deploy |

### Close the loop

| Command | Purpose |
|---|---|
| `/tandem:retro <phase>` | 3-question retro. Proposes supersede/consolidate/deprecate actions on decisions. Names the next move. |

## Directory layout in a Tandem project

After `/tandem:scaffold` in a project:

```
.claude/docs/
├── decisions/           # PDRs (product) and ADRs (technical). The source of truth.
├── views/               # Generated PRDs, Roadmaps, SADs, Delivery Plans. Do not edit.
├── retros/              # End-of-phase retros.
├── discovery/           # Raw client material (verbatim) + open-questions.md
└── design-refs/         # Visual references — admired apps, screenshots, notes
```

## Concept library (cross-project)

The `/tandem:learn` and `/tandem:study` commands write to a central concept library, separate from any project. Default location: `~/Developer/concepts/`.

Override with an environment variable:

```bash
export TANDEM_CONCEPTS_DIR="$HOME/my-knowledge"
```

The library layout:

```
~/Developer/concepts/
├── style.css                       # shared style for all rendered HTML
├── <topic>/
│   ├── <concept-slug>.md           # source of truth
│   └── _html/
│       └── <concept-slug>.html     # auto-rendered on /tandem:study commit
└── _html/
    └── study-guide-<topic>.html    # aggregated topic guides
```

Concepts are their own git repo. Push to GitHub as a personal knowledge portfolio. Projects reference concepts via `.claude/docs/concepts.yaml` — projects don't store copies.

Each concept has a `confidence:` field: `shaky` (I recognize it but can't explain it), `solid` (I can use it and understand the mechanism), or `teach-it` (I could teach it from scratch).

## Mental model

**Decisions are atoms.** Every meaningful piece of thinking is a *decision* — a choice between alternatives with consequences. PDRs and ADRs capture decisions. Same shape (Context → Options → Choice → Consequences); different interview scripts.

**Views are derived, never authored.** PRDs, Roadmaps, SADs, and Delivery Plans are read-only outputs computed from the current state of active decisions. To change a view, change the decisions and re-run `/tandem:rollup` or `/tandem:plan`.

**The lifecycle rule.** Before code ships against a decision, in-place edit. After code ships, meaningful changes create a NEW decision that supersedes the old one. Old file stays in the repo as history.

**Self-filter at draft time.** Before drafting any decision, the model asks itself: *"Is this a real decision, or a preference / fact / minor detail?"* If there's no real alternative, no meaningful consequence, or it's reversible in under an hour — the model says so and suggests inlining as a code comment instead.

**References ≠ decisions.** `discovery/` and `design-refs/` hold raw material — client notes, admired apps, screenshots. These are working inputs, freely appendable and deletable. Decisions extracted from them cite the source file/quote in their Context section.

**No gates, anywhere.** No `/approve`, no `/status`, no `/whats-stale`. Every command is conversation → commit → done.

## Session shape

```
                /tandem:scaffold          (once per project)
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

Add `/tandem:learn` + `/tandem:study` orthogonally when you want to consolidate what you learned along the way.

## Philosophy

Tandem evolved out of a 12-artifact gated framework where the gates themselves became the paralysis trap. Strip the gates, collapse the artifacts into atoms, let the conversation do the structuring work. Every design decision in Tandem falls out of that:

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
