---
description: Render a project's .claude/docs/ — decisions, generated views, and the onboarding guide — into a navigable, styled static HTML site. Local, static, read-only; Mermaid diagrams render offline. Use to read Demigo's project-track output as a mini-site instead of raw Markdown.
argument-hint: "[path-to-project-or-.claude/docs]"
---

# /demi:render

Turn a project's **project-track docs** into a browsable static site. Where
`/demi:teach` renders the *learning* track (the `study/` tree), this renders
the *project* track: everything under `.claude/docs/` — `decisions/` (PDRs +
ADRs), `views/` (rollups, delivery plans), and `onboarding/guide.md`.

It exists because the output of `/demi:brainstorm`, `/demi:onboard`, and
`/demi:rollup` is good but painful to read as loose Markdown — no index, no
cross-links, Mermaid diagrams and tables don't display. This command produces
one navigable, styled site with a landing index and a page per document.

The site is **local, static, and read-only** (PDR-005): plain HTML/CSS on disk,
opened from the filesystem. No server, no watcher, no in-browser editing, no
search backend. Re-run the command to refresh.

## Usage

```
/demi:render                       # render the current repo's .claude/docs
/demi:render ../other-repo         # render another project by its root
/demi:render ../other-repo/.claude/docs   # or point straight at the docs dir
```

The argument is optional and forgiving: pass a **project root** (the renderer
finds its `.claude/docs`) or the **docs dir** itself. With no argument, it
renders the current working directory's `.claude/docs`.

## Prerequisites

The renderer needs `pandoc` and `node` on PATH. If either is missing, say
exactly what's absent and how to get it (`brew install pandoc node`), then stop
— don't try to render without them.

## Flow

### 1. Locate the renderer

The Claude Code installer stages the renderer at a stable, clone-independent
path:

```
~/.claude/commands/demi/_assets/build-docs.mjs
```

Use that if it exists. If it doesn't (Demigo installed some other way), fall
back to the framework repo's `renderer/build-docs.mjs`. The renderer keeps its
own assets (`lib.mjs`, `template.html`, `style.css`, `mermaid.min.js`)
alongside it — nothing to seed per-project.

### 2. Resolve the target

- No argument → the current working directory.
- An argument → that path. The renderer accepts either a project root or a
  `.claude/docs` dir directly.

If the resolved target has no `decisions/`, `views/`, or `onboarding/` docs,
say so plainly and stop — there's nothing to render yet (suggest
`/demi:brainstorm` or `/demi:onboard` first).

### 3. Render

Run the renderer against the target:

```bash
node ~/.claude/commands/demi/_assets/build-docs.mjs "<target>"
```

It writes a self-contained site to `<target>/.claude/docs/_site/`:

- `index.html` — the landing page: one card grid per bucket (Decisions / Views
  / Onboarding), decision cards labelled by ID (PDR-004, ADR-005).
- `decisions/`, `views/`, `onboarding/` — a styled page per document, sidebar
  nav, on-this-page TOC, cross-links resolved (`.md` → `.html`).
- `_assets/` — the stylesheet and vendored Mermaid, so the site works offline.

Mermaid diagrams (e.g. the onboarding guide's architecture map) render
client-side; the script is only loaded on pages that actually contain a
diagram.

### 4. Hand the user the site

Report what was rendered (doc count + buckets) and give a clickable path to
open:

> "Rendered N docs → `.claude/docs/_site/`. Open it:
> `file://<abs-path>/.claude/docs/_site/index.html`"

Offer to open it in the browser. Don't commit anything — `_site/` is generated
output (gitignore it in projects that track `.claude/docs`).

## What this command does NOT do

- It does NOT host or publish the site — local files only.
- It does NOT watch or auto-refresh — re-run to update after docs change.
- It does NOT edit docs — the site is read-only; edit the Markdown via the
  Demigo commands that own it.
- It does NOT render the `study/` learning track — that's `/demi:teach`'s
  renderer (`build.mjs`), a sibling that shares the same core plumbing.

## Tone

You're running a build, not holding a conversation. Check prerequisites, render,
and hand back a link. The interesting output is the site, not your narration.
