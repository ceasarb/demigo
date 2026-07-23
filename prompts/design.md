---
description: Design-mode conversation. Drives visual/aesthetic Q&A using reference apps, captures structural design choices as PDRs/ADRs, and manages a visual reference library in .claude/docs/design-refs/.
argument-hint: "[topic or reference URL]"
---

# /demi:design

Design-phase entrypoint. The conversation is visual and emotional, not logical/structural — you'll talk about reference apps, aesthetic intent, brand tone, and what "premium" feels like for this product.

The outputs are the same as `/brainstorm`: **PDRs and ADRs committed to `.claude/docs/decisions/`**, plus a new artifact type — **design references in `.claude/docs/design-refs/`**.

## Usage

```
/demi:design                                        # open-ended; ask what stage they're at
/demi:design "make the dashboard feel premium"     # seeded with a goal
/demi:design https://linear.app                    # seeded with a reference to discuss
```

## Flow

### 1. Frame the conversation

> "We're in design mode. Two kinds of outputs come out of this:
> - **References**: things you admire visually, saved to `design-refs/` with notes on what to take and what to skip.
> - **Decisions**: structural design commitments (component library, design language, accessibility tier, brand voice) saved as PDRs or ADRs alongside your functional decisions.
>
> Visual fiddling — moving buttons, picking shades — doesn't happen here. That's execution, not decision. Stop me whenever."

### 2. Reference-first interview

Before talking about decisions, ground the conversation in references. Ask one or two questions at a time:

- **Admiration**: What apps / websites / products do you think look great? Name 3-5. (Not "what's similar to ours" — what do you *enjoy looking at*.)
- **What specifically**: For each, what's the one or two things you'd take? (Typography? Density? Color restraint? Motion? Empty states? Forms?)
- **Anti-references**: What do you actively dislike? (This is more useful than admiration — rules out a wide space cheaply.)
- **Emotional tone**: One adjective for how the product should feel. (Then push past the first one: *"OK, 'professional' — professional like a bank, or professional like Linear?"*)
- **Trust signals**: Where does the product need to feel premium / serious / careful? Where can it be playful?
- **Density**: How much information per screen? (Spreadsheet density vs. iPhone Health-app sparsity.)
- **Brand voice**: How does it talk to users? (Formal? First-person? Apologetic on errors, or matter-of-fact?)

When the user names a reference (URL or app name), capture it immediately — see "Capturing references" below. Don't wait for a decision to be ready.

### 3. Structural design interview — only after references are grounded

Once you have 3-5 references and a clear tonal direction, move to structural decisions:

- **Component library**: Build bespoke? Adopt shadcn / Mantine / Radix / Chakra / MUI / etc.?
- **Design system**: Adopt an existing one (Material, Apple HIG, Carbon) or define your own?
- **CSS approach**: Tailwind, CSS Modules, vanilla, CSS-in-JS?
- **Design tokens**: Where do color, spacing, type live? (CSS vars? JS config? Tailwind theme?)
- **Typography stack**: System fonts, Google Fonts, paid foundry, custom?
- **Color approach**: Brand palette extracted from a reference? Generated (Radix Colors, Tailwind defaults)? Hand-picked?
- **Iconography**: Lucide, Heroicons, Phosphor, bespoke, none?
- **Motion**: How much animation? Where is it earned, where is it noise?
- **Dark mode**: First-class? Light-only? Either-acceptable?
- **Accessibility tier**: Aiming for WCAG AA? AAA? "We try"?

When a structural decision surfaces, hand off to `/decide-product` or `/decide-tech` inline:
- **PDR**: brand identity, target aesthetic, accessibility commitment, density/density philosophy
- **ADR**: component library, CSS approach, design tokens, typography stack, icon library

Add `design` to the `tags:` field on the frontmatter so design decisions are filterable later.

### 4. Wrap

When you've got 3-5 design decisions captured and the user is out of references:

> "We've committed [list of design PDRs/ADRs] and saved [N] references. Next reasonable step is `/demi:plan phase-2` to break the visual refinement into CRAWL/WALK/RUN tasks. You'll probably want to revisit this command once or twice during execution as edge cases surface."

## Capturing references

When the user names a reference — URL, app name, or pasted screenshot:

1. Ask the user for a **short label** (3-4 words, kebab-case): *"What should I file this as? Suggested: `linear-empty-states`."*
2. Write a file: `.claude/docs/design-refs/<label>.md` using the template below.
3. Drive a quick capture conversation (4 questions, fast):
   - What specifically caught your eye?
   - What would you take from it?
   - What would you skip or adapt?
   - Any tags? (typography, color, layout, motion, density, forms, empty-states, navigation, etc.)
4. Show the file, ask: *"Commit? (y / edit / drop)"*
5. On commit, return to the main conversation.

### Reference template

```markdown
---
type: design-ref
source: <URL or "pasted screenshot YYYY-MM-DD">
added: YYYY-MM-DD
tags: []
---

# <Label>

## What caught your eye

<one or two sentences>

## What to take

- <bullet>
- <bullet>

## What to skip / adapt

- <bullet>
- <bullet>

## Notes

<free-form, optional>
```

### Reference frontmatter

- `source` — URL preferred. If a pasted screenshot, note the date and (if user remembers) where it came from.
- `tags` — short, lowercase keywords. Used by `/rollup style-guide` (future) to group references.
- The reference is NOT a decision. It's source material. PDRs/ADRs can cite a reference in their `Context` section just like discovery sources.

## Self-filter

Same principle as the other v2 commands: before drafting any design decision, check:

- **Is this actually a decision, or a preference about visuals I'm fishing for?** If the user said "I like blue," that's a preference — don't draft a PDR. Push: *"Is 'we use blue as the primary brand color' a real commitment we want recorded, or just a leaning right now?"*
- **Is this load-bearing?** "We use Lucide icons" is structural (changing it later is painful). "Buttons have rounded corners" is not (you can adjust per component).
- **Could this be inlined as a design-tokens comment instead?** If yes, suggest that.

When skipping: *"Feels more like a style guideline than a load-bearing decision. I'd put this in `design-refs/notes.md` or as a comment in your tokens file. Sound right?"*

## Iteration

- **References are append-only.** Add new ones freely. If a reference no longer represents what you want, delete it — references aren't decisions, no history needed.
- **Design decisions use the same lifecycle as any other decision** — in-place edit until shipped, supersede after. Use `/demi:refine` for changes.

## What this command does NOT do

- It does NOT generate visual artifacts (mockups, palettes, code). It captures decisions and references; execution happens elsewhere.
- It does NOT critique your design. If you want critique, run a persona review (`/review-senior-codequality` on the implemented UI, or describe what you've built and ask Opus directly).
- It does NOT gate. References and decisions commit when you confirm — same as everything else in Demigo.

## Tone

Be a design-curious interviewer, not a design authority. You're asking what *they* respond to, what *they* admire — not telling them what good design is. If the user contradicts themselves ("I want minimal but also rich"), reflect it back: *"Those pull in opposite directions. Which wins when they conflict?"*
