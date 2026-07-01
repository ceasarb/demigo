---
description: Ingest client/stakeholder material (meeting notes, requirements docs, wishlists, transcripts) and extract candidate PDRs/ADRs. Raw material is preserved verbatim; decisions are user-confirmed before commit.
argument-hint: "<file-path | 'paste'>"
---

# /discovery

Client-work entrypoint. You (Opus) read client material and **propose** decisions — the user confirms, edits, or drops each. The user is not the source of decisions here; the client is. The user's job is to filter and frame.

The raw client material is preserved untouched. Decisions extracted from it are committed as normal PDRs/ADRs, but each one cites the source material so you can trace any decision back to where the client actually said it.

## Usage

```
/discovery ./notes/2026-06-27-stakeholder-meeting.md
/discovery paste                                # paste content into chat
/discovery                                      # ask user what they have
```

## Where things live

```
.claude/docs/discovery/
├── 2026-06-27-stakeholder-meeting.md          # raw, untouched
├── 2026-06-30-requirements-from-pm.md         # raw, untouched
└── open-questions.md                          # appended to over time — ambiguities to bring back to the client
```

PDRs and ADRs extracted from discovery materials live in the normal `.claude/docs/decisions/` directory — they're just decisions, no different from `/brainstorm`-sourced ones. They cite the discovery source in their Context section.

## Flow

### 1. Locate the material

- If a path was given: read it.
- If `paste`: ask the user to paste the content into the chat. Capture it verbatim.
- If neither: ask: *"What do you have? Paste it, point me to a file, or describe what kind of material it is."*

### 2. Preserve raw material

Before doing anything else, copy the raw content to `.claude/docs/discovery/<date>-<short-label>.md`. If it came from `paste`, prompt the user for a short label and stamp today's date.

Add a minimal header but don't edit the content:

```markdown
---
source: <client name / stakeholder / document title>
captured: YYYY-MM-DD
type: meeting-notes | requirements-doc | wishlist | transcript | other
---

# <Label>

<paste content verbatim — DO NOT edit, summarize, or reformat>
```

The point: a year from now, if a PDR cites this file, the user can read exactly what the client said.

### 3. Scan and categorize

Read the captured material and identify:

**A. Candidate Product Decisions (PDRs)** — anywhere the client expressed:
- Who the user is / who they're explicitly NOT
- What they want delivered (scope commitments)
- What they explicitly don't want (non-goals)
- Success criteria / what "working" looks like to them
- Constraints (budget, time, regulation, integrations they require)

**B. Candidate Technical Decisions (ADRs)** — anywhere the client expressed:
- Platform requirements ("must run on Azure")
- Tech stack constraints ("our team only knows .NET")
- Integration points ("must talk to our existing SAP")
- Data residency / compliance / security requirements that drive architecture

**C. Conflicts** — places where the material contradicts itself:
- "We need real-time updates" vs. "Latency under 1s is fine"
- "Open to any cloud" vs. "Must be Azure"
- Two stakeholders saying different things in the same notes

**D. Ambiguities** — places where the material is too vague to decide:
- "It should be fast" — fast meaning what?
- "Easy to use" — for whom, doing what?
- "Scalable" — to what scale?

**E. Unstated** — gaps that matter:
- Auth not mentioned at all
- No mention of error handling expectations
- No mention of who operates this once it ships

### 4. Surface the scan to the user — BEFORE proposing decisions

Show the categorized scan as a summary:

> "Read through it. Here's what I see:
> - **6 candidate PDRs** (3 scope, 2 non-goal, 1 success metric)
> - **4 candidate ADRs** (cloud target, integration point, compliance constraint, data residency)
> - **2 conflicts** — between [section] and [section]
> - **5 ambiguities** — mostly around performance language
> - **3 unstated** — auth, error UX, who operates this
>
> Want to walk the conflicts first (those need resolving before we commit anything), or just power through the cleanest PDRs first?"

Let the user choose the order. Default suggestion: conflicts → cleanest PDRs → ambiguities → unstated.

### 5. For each candidate decision: draft and confirm

Same shape as `/decide-product` and `/decide-tech`, but with these differences:

- **Pre-filled Context** quoting the client's words: *"Per [source], the client stated: '[exact quote]'."*
- **Pre-filled Decision** as a clean restatement of what the client committed to.
- **Alternatives Considered** may be thin — clients often don't show their reasoning. That's OK. Note: *"Alternatives not surfaced in source material."*
- **Add a "Source" field** in the frontmatter pointing at the discovery file:

```yaml
source: .claude/docs/discovery/2026-06-27-stakeholder-meeting.md
source_quote: "We absolutely need this to integrate with Salesforce."
```

Show the draft, ask: *"Commit as PDR-NNN? (y / edit / drop)"*

### 6. For each conflict: resolve before commit

> "Conflict: [source A] says X, [source B] says Y.
>
> Options:
> 1. Bring back to the client — add to open-questions, don't commit yet
> 2. Commit X as a PDR, flag Y as superseded-by-context
> 3. Commit a meta-PDR: 'the client is undecided; we will choose X because [our reasoning]'
>
> Which?"

Do NOT silently pick. Conflicts are exactly the kind of thing that bites you on the third client meeting when they reference Y and you've built X.

### 7. For ambiguities and unstated: write to open-questions

Append each ambiguity / unstated item to `.claude/docs/discovery/open-questions.md`:

```markdown
- **[YYYY-MM-DD]** Performance: client said "fast" — undefined. Need a number (p50/p99 latency? throughput?). Source: 2026-06-27-stakeholder-meeting.md
- **[YYYY-MM-DD]** Auth: not mentioned in any discovery material. Assumption or question?
```

Ask the user before adding each whether they want to:
- Add as open question (bring back to client)
- Make an assumption now — *"we'll proceed assuming X; flag for client validation"* (becomes a PDR with `assumption: true` in frontmatter)
- Drop (they know it's covered elsewhere)

### 8. Wrap

> "Done with [source]. Captured: N PDRs, M ADRs committed. K open questions logged. L assumptions flagged for client validation.
>
> Suggested next steps:
> - `/rollup prd phase-1` to see what's emerging as the PRD view
> - Schedule a follow-up with the client to resolve open-questions.md
> - Or `/discovery` again with the next batch of material"

## Self-filter on extraction

Before drafting every candidate decision, ask yourself:

- **Is this actually a decision the client made, or am I projecting?** If the client said "we'd like" but didn't commit, it's a wish, not a decision. Flag as ambiguity, don't draft a PDR.
- **Is the source quote actually load-bearing?** A throwaway sentence from the client isn't a PDR — push it to open-questions for explicit validation.
- **Am I creating ceremony around obvious things?** "Client uses email" doesn't need a PDR.

When unsure: lean toward open-questions rather than committing. PDRs are commitments; open-questions are explicitly "we're not sure yet." It's cheaper to promote an open-question to a PDR later than to retract a PDR.

## Tone

You're a thoughtful analyst presenting findings, not an enthusiast who wants to commit everything. Default to skepticism: *"the client said X but I'm not sure it's a real commitment yet"* is the safer read than *"the client clearly wants X."*

When the user pushes back ("no, that's obviously what they want, commit it"), trust them — they were in the meeting.

## What this command does NOT do

- It does NOT edit, summarize, or "clean up" raw client material. Verbatim preservation is the point.
- It does NOT commit decisions without the user confirming each.
- It does NOT replace the user's judgment about what the client meant — it surfaces candidates and conflicts, the user calls them.
- It does NOT gate. Same as the rest of v2: confirm-or-drop, that's it.
