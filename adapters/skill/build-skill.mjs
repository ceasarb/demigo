#!/usr/bin/env node
// Skill adapter — translate a Tandem prompt (prompts/<name>.md) into a Claude
// Code Skill (SKILL.md), per ADR-001 ("author once as a prompt, distribute as a
// skill via an adapter"). Source of truth stays in prompts/; this is a projection.
//
// Usage:
//   node adapters/skill/build-skill.mjs prompts/onboard.md            # → dist/tandem-onboard/SKILL.md
//   node adapters/skill/build-skill.mjs prompts/onboard.md --out DIR   # custom output root
//
// Requires: node (no external deps).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith('--'));
const outIdx = args.indexOf('--out');
const outRoot = outIdx !== -1 ? args[outIdx + 1] : resolve(new URL('.', import.meta.url).pathname, 'dist');

if (!src) {
  console.error('usage: build-skill.mjs <prompts/NAME.md> [--out DIR]');
  process.exit(1);
}

// --- Parse the prompt's frontmatter + body ---------------------------------
const raw = readFileSync(src, 'utf8');
const fm = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
if (!fm) {
  console.error(`✖ ${src} has no YAML frontmatter — cannot map to a skill.`);
  process.exit(1);
}
const [, frontRaw, body] = fm;

// Minimal YAML: key: value (values may be single/double quoted).
const front = {};
for (const line of frontRaw.split('\n')) {
  const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
  if (m) front[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}

const cmdName = basename(src).replace(/\.md$/, '');   // e.g. "onboard"
const skillName = `tandem-${cmdName}`;                // skill id
const title = `Tandem: ${cmdName.charAt(0).toUpperCase() + cmdName.slice(1)}`;

if (!front.description) {
  console.error(`✖ ${src} frontmatter has no 'description' — skills require one.`);
  process.exit(1);
}

// --- Build the SKILL.md ------------------------------------------------------
// The prompt's `description` is the trigger text (skills auto-invoke on it).
// The prompt body becomes the skill instructions; we swap its `# /cmd` H1 for a
// skill title and fold the argument-hint into an explicit note, since skills have
// no slash-command argument convention.
const argNote = front['argument-hint']
  ? `\n**Arguments:** when invoked, treat the user's request as the argument described by \`${front['argument-hint']}\`. `
    + `Equivalent Tandem command: \`/tandem:${cmdName} ${front['argument-hint']}\`.\n`
  : `\n**Invocation:** equivalent to the Tandem command \`/tandem:${cmdName}\`.\n`;

const bodyStripped = body.replace(/^#\s+\/?\S.*\n/, '');   // drop the original H1

const skill =
`---
name: ${skillName}
description: ${front.description}
---

# ${title}
${argNote}
> Generated from \`${src}\` by the Tandem skill adapter. Source of truth is the
> prompt; regenerate rather than editing this file (ADR-001).
${bodyStripped}`;

// --- Write -------------------------------------------------------------------
const outDir = join(outRoot, skillName);
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'SKILL.md');
writeFileSync(outPath, skill);

console.log(`✓ ${skillName}  ←  ${src}`);
console.log(`  ${outPath}`);
