#!/usr/bin/env node
// Project-docs renderer for a Demigo project's .claude/docs/ tree.
// Sibling of build.mjs (the study-curriculum renderer); shares the
// format-agnostic plumbing in ./lib.mjs. Where build.mjs discovers numbered
// curriculum layers, this discovers three fixed semantic buckets —
// decisions/, views/, onboarding/ — and renders them into a single navigable
// static site under .claude/docs/_site/.
//
//   node renderer/build-docs.mjs                 # render this repo's .claude/docs
//   node renderer/build-docs.mjs path/to/.claude/docs
//
// Requires: pandoc (gfm), node.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, relative, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  pandocConvert, buildTOC, escapeHtml, rewriteLinks, convertDefinitionLists,
  extractH1, readTitle, readDescription, cardGrid, renderTemplate,
  normalizeMermaid, hasMermaid, stripFrontmatter,
  cssBaseFor as libCssBaseFor, rootBaseFor as libRootBaseFor,
} from './lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const RENDERER = dirname(__filename);
const TEMPLATE = readFileSync(join(RENDERER, 'template.html'), 'utf8');

// Resolve the target. Accept either a project root (…/repo) or a docs dir
// (…/.claude/docs); default to the current working directory so the staged
// command renders whichever repo it's invoked from.
const rawTarget = resolve(process.argv[2] || process.cwd());
const DOCS = existsSync(join(rawTarget, '.claude', 'docs'))
  ? join(rawTarget, '.claude', 'docs')
  : (basename(rawTarget) === 'docs' ? rawTarget : join(rawTarget, '.claude', 'docs'));
const OUT = join(DOCS, '_site');
const ASSETS = join(OUT, '_assets');

const FOOTER = 'Demigo · project documentation · rendered from .claude/docs';

// Bucket definitions: how each fixed dir is discovered and labelled. The docs
// tree is flat and semantic (not recursive/numbered like the study tree), so
// discovery is a per-bucket glob rather than a walk.
const BUCKETS = [
  {
    key: 'decisions', label: 'Decisions', dir: join(DOCS, 'decisions'),
    intro: 'Product (PDR) and architecture (ADR) decision records — the committed choices this project is built on.',
    // decision cards carry their id (PDR-001 / ADR-003) as the num column, and
    // summarise the actual decision (not whatever prose happens to come first).
    files: (dir) => readdirSync(dir).filter((e) => /^(pdr|adr)-.*\.md$/i.test(e)).sort(),
    num: (mdPath, fm) => fm.id || basename(mdPath, '.md'),
    desc: (mdPath) => decisionSummary(mdPath),
    // Confidence badge (extraction trust signal, ADR-003) + a status badge for
    // anything not `active`. Active decisions carry no status badge (reduce noise).
    badges: (mdPath, fm) => {
      const out = [];
      if (fm.confidence) out.push({ cls: `conf-${fm.confidence}`, label: fm.confidence });
      if (fm.status && fm.status !== 'active') out.push({ cls: `status-${fm.status}`, label: fm.status });
      return out;
    },
  },
  {
    key: 'views', label: 'Views', dir: join(DOCS, 'views'),
    intro: 'Generated views — PRDs, roadmaps, SADs, and delivery plans rolled up from the decisions above.',
    files: (dir) => readdirSync(dir).filter((e) => e.endsWith('.md') && !e.startsWith('_')).sort(),
    num: (mdPath, fm, i) => String(i + 1).padStart(2, '0'),
    desc: (mdPath) => readDescription(mdPath),
  },
  {
    key: 'onboarding', label: 'Onboarding', dir: join(DOCS, 'onboarding'),
    intro: 'The contributor onboarding guide — how to get from a fresh clone to a first change.',
    files: (dir) => readdirSync(dir).filter((e) => e.endsWith('.md')).sort(),
    num: () => 'Guide',
    desc: (mdPath) => readDescription(mdPath),
  },
];

// --- Frontmatter ------------------------------------------------------------

// Minimal YAML-frontmatter reader: flat `key: value` pairs only (enough for
// id / status / artifact). Not a general YAML parser.
function readFrontmatter(mdPath) {
  const fm = {};
  try {
    const txt = readFileSync(mdPath, 'utf8');
    const m = txt.match(/^---\n([\s\S]*?)\n---/);
    if (m) {
      for (const line of m[1].split('\n')) {
        const mm = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
        if (mm) fm[mm[1]] = mm[2].trim();
      }
    }
  } catch { /* ignore */ }
  return fm;
}

// First prose paragraph under a "## <heading>" section, cleaned of markdown.
// Used to summarise a decision by its actual content rather than the first
// line of the file (which for extracted ADRs is a status token).
function firstParaUnder(raw, headingRe) {
  const lines = stripFrontmatter(raw).split('\n');
  let inSection = false;
  const buf = [];
  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) {                 // any heading
      if (inSection && buf.length) break;         // leaving our section
      inSection = headingRe.test(line.trim());
      continue;
    }
    if (!inSection) continue;
    const t = line.trim();
    if (!t) { if (buf.length) break; continue; }
    if (t.startsWith('```')) { if (buf.length) break; continue; }
    buf.push(t);
    if (buf.join(' ').length > 240) break;
  }
  let s = buf.join(' ').replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  if (s.length > 240) s = s.slice(0, 237) + '…';
  return s;
}

// A decision's card summary: prefer the Decision statement, then Context,
// then fall back to the generic first-paragraph reader.
function decisionSummary(mdPath) {
  const raw = readFileSync(mdPath, 'utf8');
  return firstParaUnder(raw, /^##\s+Decision\b/i)
    || firstParaUnder(raw, /^##\s+Context\b/i)
    || readDescription(mdPath);
}

// --- Discovery --------------------------------------------------------------

// Resolve each bucket to the list of docs it contains (skipping empty/missing
// dirs). Returns [{ key, label, intro, num, docs: [{ mdPath, name, fm }] }].
function discover() {
  return BUCKETS.map((b) => {
    if (!existsSync(b.dir)) return { ...b, docs: [] };
    const docs = b.files(b.dir).map((name) => {
      const mdPath = join(b.dir, name);
      return { mdPath, name, fm: readFrontmatter(mdPath) };
    });
    return { ...b, docs };
  });
}

// --- Rendering --------------------------------------------------------------

const cssBaseFor = (htmlPath) => libCssBaseFor(OUT, htmlPath);
const rootBaseFor = (htmlPath) => libRootBaseFor(OUT, htmlPath);

// Sidebar listing every doc in this bucket, current page highlighted.
function bucketNav(bucket, currentName) {
  return bucket.docs.map((d) => {
    const htmlName = d.name.replace(/\.md$/, '.html');
    const cls = d.name === currentName ? ' class="current"' : '';
    return `<li><a href="${htmlName}"${cls}>${escapeHtml(readTitle(d.mdPath))}</a></li>`;
  }).join('\n        ');
}

// "Buckets" nav: links back to each section on the landing index.
function bucketsNav(rootBase, currentKey) {
  return BUCKETS.map((b) => {
    const cls = b.key === currentKey ? ' class="current"' : '';
    return `<li><a href="${rootBase}index.html#${b.key}"${cls}>${escapeHtml(b.label)}</a></li>`;
  }).join('\n        ');
}

function ensureDir(dir) { mkdirSync(dir, { recursive: true }); }

function renderDoc(bucket, doc) {
  let body = pandocConvert(doc.mdPath);
  body = rewriteLinks(body);
  body = convertDefinitionLists(body);
  body = normalizeMermaid(body);
  const toc = buildTOC(body);
  const title = extractH1(body) || basename(doc.mdPath, '.md');
  const htmlPath = join(OUT, bucket.key, doc.name.replace(/\.md$/, '.html'));
  ensureDir(dirname(htmlPath));
  const rootBase = rootBaseFor(htmlPath);
  writeFileSync(htmlPath, renderTemplate(TEMPLATE, {
    pageTitle: `${title} · ${bucket.label}`,
    sectionLabel: bucket.label,
    navLinks: bucketNav(bucket, doc.name),
    sectionsNav: bucketsNav(rootBase, bucket.key),
    cssBase: cssBaseFor(htmlPath),
    rootBase,
    crumbs: `<a href="${rootBase}index.html">Documentation</a> &nbsp;›&nbsp; `
      + `<a href="${rootBase}index.html#${bucket.key}">${escapeHtml(bucket.label)}</a>`,
    footer: FOOTER,
    body,
    toc,
    mermaid: hasMermaid(body),
  }));
  console.log('  ' + relative(OUT, htmlPath));
}

// Landing index: one card grid per non-empty bucket, each wrapped in an
// anchored <section> so the buckets nav can deep-link to it.
function renderIndex(buckets) {
  const htmlPath = join(OUT, 'index.html');
  const rootBase = rootBaseFor(htmlPath);
  const sections = buckets.filter((b) => b.docs.length > 0).map((b) => {
    const entries = b.docs.map((d, i) => ({
      href: `${b.key}/${d.name.replace(/\.md$/, '.html')}`,
      num: b.num(d.mdPath, d.fm, i),
      title: readTitle(d.mdPath),
      desc: b.desc(d.mdPath),
      badges: b.badges ? b.badges(d.mdPath, d.fm) : undefined,
    }));
    return `<section id="${b.key}" class="docs-bucket">\n`
      + `<h2>${escapeHtml(b.label)}</h2>\n<p>${escapeHtml(b.intro)}</p>\n`
      + `${cardGrid(entries)}\n</section>`;
  }).join('\n');

  const out = renderTemplate(TEMPLATE, {
    pageTitle: 'Documentation',
    sectionLabel: 'Documentation',
    navLinks: '',
    sectionsNav: bucketsNav(rootBase, null),
    cssBase: cssBaseFor(htmlPath),
    rootBase,
    crumbs: '<strong>Documentation</strong>',
    footer: FOOTER,
    body: `<h1>Documentation</h1>\n`
      + `<p>Generated from <code>.claude/docs</code> — decisions, generated views, and the onboarding guide.</p>\n`
      + sections,
    toc: '',
  }).replace('<body>', '<body class="landing">');
  ensureDir(OUT);
  writeFileSync(htmlPath, out);
  console.log('  ' + relative(OUT, htmlPath));
}

// --- Run --------------------------------------------------------------------

console.log(`Rendering docs from ${relative(process.cwd(), DOCS) || DOCS}…`);

if (!existsSync(DOCS)) {
  console.error(`  ! no such docs dir: ${DOCS}`);
  process.exit(1);
}

const buckets = discover();
const total = buckets.reduce((n, b) => n + b.docs.length, 0);
if (total === 0) {
  console.error('  ! no decisions/, views/, or onboarding/ docs found');
  process.exit(1);
}

// Seed the site's assets (shared stylesheet + vendored Mermaid). Template
// stays in the renderer. Mermaid is only loaded by pages that have a diagram
// (see the $if(mermaid)$ slot), but the asset is always available offline.
ensureDir(ASSETS);
copyFileSync(join(RENDERER, 'style.css'), join(ASSETS, 'style.css'));
const mermaidSrc = join(RENDERER, 'mermaid.min.js');
if (existsSync(mermaidSrc)) copyFileSync(mermaidSrc, join(ASSETS, 'mermaid.min.js'));

for (const b of buckets) {
  for (const d of b.docs) renderDoc(b, d);
}
renderIndex(buckets);

console.log(`Done. ${total} docs → ${relative(process.cwd(), OUT) || OUT}`);
