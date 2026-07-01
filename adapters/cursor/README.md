# Cursor adapter

> **Status: stub.** Not yet implemented. The Cursor adapter is the next planned distribution target after Claude Code. See "Implementation plan" below — contributions welcome.

## Goal

Make the Tandem prompts available inside Cursor so the same conversation-driven workflows work without leaving the editor.

## Implementation plan

Cursor supports project rules via `.cursor/rules/*.mdc` files. The adapter will:

1. Generate one `.mdc` rule per Tandem prompt, with frontmatter selecting when the rule applies (e.g., `description: "Tandem: brainstorm — drive a decision-capture conversation"`).
2. Provide an installer that writes rules to either:
   - `~/.cursor/rules/tandem/` (global — available in every project), or
   - `<project>/.cursor/rules/tandem/` (project-scoped)
3. Translate the slash-command invocation pattern (`/tandem:brainstorm`) into Cursor's natural-language trigger (e.g., a chat message like `@tandem brainstorm`).

## Why it's not in the box yet

The Cursor rules format is similar enough to Claude Code's slash-command markdown that translation is mostly metadata mapping. But Cursor's invocation model is different (user describes the task, model picks the rule), so the prompts may need light editing to work cleanly without a slash trigger.

## How to help

Open a PR with an `install.sh` in this directory that:

1. Reads each `prompts/*.md` from the repo root
2. Wraps each one as a Cursor `.mdc` rule with appropriate frontmatter
3. Writes to `${HOME}/.cursor/rules/tandem/` (or a CLI-flag-specified path)

Test in Cursor by invoking a Tandem command via chat and verifying the conversation flow matches the Claude Code experience.
