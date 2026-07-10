#!/usr/bin/env node
// Shared curriculum renderer for the concept library's study/ tree.
// Topic-agnostic: auto-discovers study/<topic>/[<lens>/...] curricula, renders
// each markdown layer to HTML with a sidebar nav + on-this-page TOC, and builds
// per-section, per-topic, and root index pages.
//
// Run from the library root or anywhere:
//   node study/_assets/build.mjs                # render every topic
//   node study/_assets/build.mjs distributed-systems     # render one topic
//   node study/_assets/build.mjs networking/gcp          # render one section
//
// Format-agnostic plumbing (pandoc, TOC, links, template) lives in ./lib.mjs
// and is shared with build-docs.mjs. This file owns the study-tree specifics:
// layer discovery, curriculum labels, sidebar/sections nav, breadcrumbs, and
// the section/topic/root index builders.
//
// Requires: pandoc (gfm), node.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isHidden, labelize, h1Of, pandocConvert, buildTOC, escapeHtml,
  rewriteLinks, convertDefinitionLists, extractH1, readTitle, readDescription,
  cardGrid, renderTemplate, normalizeMermaid, hasMermaid,
  cssBaseFor as libCssBaseFor, rootBaseFor as libRootBaseFor,
} from './lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..'); // the study/ dir
const TEMPLATE = readFileSync(join(ROOT, '_assets', 'template.html'), 'utf8');

// ROOT/TEMPLATE-bound wrappers over the shared plumbing, so call sites below
// stay identical to the pre-extraction renderer.
const render = (opts) => renderTemplate(TEMPLATE, opts);
const cssBaseFor = (htmlPath) => libCssBaseFor(ROOT, htmlPath);
const rootBaseFor = (htmlPath) => libRootBaseFor(ROOT, htmlPath);

// --- Discovery --------------------------------------------------------------

// A "section" is a directory that directly contains at least one numbered
// layer file (starts with a digit: 00_anchor, 01-layer, 02b-…).
function dirHasLayers(dir) {
  return readdirSync(dir).some((e) => /^\d/.test(e) && e.endsWith('.md'));
}

// Recursively find section dirs under a topic dir.
function findSections(topicDir) {
  const out = [];
  (function walk(dir) {
    if (dirHasLayers(dir)) out.push(dir);
    for (const e of readdirSync(dir)) {
      if (isHidden(e)) continue;
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
    }
  })(topicDir);
  return out;
}

// Ordered markdown files within a section: README, then 00_ anchor, then
// numbered layers (natural filename sort keeps 01 < 02 < 02b < 03), then rest.
function orderFiles(sectionDir) {
  const md = readdirSync(sectionDir)
    .filter((e) => e.endsWith('.md') && !isHidden(e));
  const readme = md.filter((f) => f.toLowerCase() === 'readme.md');
  const anchor = md.filter((f) => /^00[_-]/.test(f)).sort();
  const layers = md.filter((f) => /^\d/.test(f) && !/^00[_-]/.test(f)).sort();
  const rest = md.filter(
    (f) => !readme.includes(f) && !anchor.includes(f) && !layers.includes(f)
  ).sort();
  return [...readme, ...anchor, ...layers, ...rest];
}

function listTopics() {
  return readdirSync(ROOT)
    .filter((e) => !isHidden(e) && statSync(join(ROOT, e)).isDirectory())
    .filter((e) => findSections(join(ROOT, e)).length > 0)
    .sort();
}

// --- Label helpers ----------------------------------------------------------

// Topic label: first the topic README H1 (stripped of "— Study Guide"), else
// the dir name labelized.
function topicLabel(topicDir) {
  const h1 = h1Of(join(topicDir, 'README.md'));
  if (h1) return h1.replace(/\s*[—-]\s*Study Guide\s*$/i, '').trim();
  return labelize(basename(topicDir));
}

// Section label: topic label if the section IS the topic dir, else
// "Topic — LENS PATH".
function sectionLabel(topicDir, sectionDir) {
  const tl = topicLabel(topicDir);
  if (sectionDir === topicDir) return tl;
  const lens = relative(topicDir, sectionDir).split('/').map(labelize).join(' / ');
  return `${tl} — ${lens}`;
}

// --- Nav / crumbs -----------------------------------------------------------

function buildSidebarNav(sectionDir, currentMdPath) {
  return orderFiles(sectionDir).map((md) => {
    const mdPath = join(sectionDir, md);
    const htmlName = md.replace(/\.md$/, '.html');
    const cls = mdPath === currentMdPath ? ' class="current"' : '';
    return `<li><a href="${htmlName}"${cls}>${escapeHtml(readTitle(mdPath))}</a></li>`;
  }).join('\n        ');
}

function buildSectionsNav(rootBase, currentTopic) {
  return listTopics().map((t) => {
    const cls = t === currentTopic ? ' class="current"' : '';
    return `<li><a href="${rootBase}${t}/index.html"${cls}>${escapeHtml(labelize(t))}</a></li>`;
  }).join('\n        ');
}

// Crumbs from ROOT down to the section holding this page. Each ancestor dir
// gets an index.html (see index builders), so every segment can link safely.
function buildCrumbs(htmlPath, sectionDir) {
  const rootBase = rootBaseFor(htmlPath);
  const segs = relative(ROOT, sectionDir).split('/');
  const parts = [];
  let acc = '';
  for (const seg of segs) {
    acc += seg + '/';
    parts.push(`<a href="${rootBase}${acc}index.html">${escapeHtml(labelize(seg))}</a>`);
  }
  return parts.join(' &nbsp;›&nbsp; ');
}

const FOOTER = 'Concept library · study curriculum · rendered from markdown';

// --- Page + index builders --------------------------------------------------

function buildPage(mdPath, sectionDir, topicDir) {
  let body = pandocConvert(mdPath);
  body = rewriteLinks(body);
  body = convertDefinitionLists(body);
  body = normalizeMermaid(body);
  const toc = buildTOC(body);
  const title = extractH1(body) || basename(mdPath, '.md');
  const htmlPath = mdPath.replace(/\.md$/, '.html');
  writeFileSync(htmlPath, render({
    pageTitle: `${title} · ${topicLabel(topicDir)}`,
    sectionLabel: sectionLabel(topicDir, sectionDir),
    navLinks: buildSidebarNav(sectionDir, mdPath),
    sectionsNav: buildSectionsNav(rootBaseFor(htmlPath), basename(topicDir)),
    cssBase: cssBaseFor(htmlPath),
    rootBase: rootBaseFor(htmlPath),
    crumbs: buildCrumbs(htmlPath, sectionDir),
    footer: FOOTER,
    body,
    toc,
    mermaid: hasMermaid(body),
  }));
  console.log('  ' + relative(ROOT, htmlPath));
}

function writeIndex(htmlPath, { label, intro, body, sectionDir, topicDir, currentTopic }) {
  const out = render({
    pageTitle: `${label} · Index`,
    sectionLabel: label,
    navLinks: sectionDir ? buildSidebarNav(sectionDir, null) : '',
    sectionsNav: buildSectionsNav(rootBaseFor(htmlPath), currentTopic),
    cssBase: cssBaseFor(htmlPath),
    rootBase: rootBaseFor(htmlPath),
    crumbs: sectionDir ? buildCrumbs(htmlPath, sectionDir)
      : (topicDir ? buildCrumbs(htmlPath, topicDir) : '<strong>Study Library</strong>'),
    footer: FOOTER,
    body: `<h1>${escapeHtml(label)}</h1>\n<p>${escapeHtml(intro)}</p>\n${body}`,
    toc: '',
  }).replace('<body>', '<body class="landing">');
  writeFileSync(htmlPath, out);
  console.log('  ' + relative(ROOT, htmlPath));
}

// Section index: cards for the section's layers (README excluded).
function buildSectionIndex(sectionDir, topicDir) {
  const files = orderFiles(sectionDir).filter((md) => md.toLowerCase() !== 'readme.md');
  const entries = files.map((md, i) => {
    const mdPath = join(sectionDir, md);
    return {
      href: md.replace(/\.md$/, '.html'),
      num: String(i + 1).padStart(2, '0'),
      title: readTitle(mdPath),
      desc: readDescription(mdPath),
    };
  });
  const label = sectionLabel(topicDir, sectionDir);
  const readme = join(sectionDir, 'README.md');
  const intro = (existsSync(readme) && readDescription(readme))
    || 'A layer-by-layer walkthrough. Read in order — each layer assumes the ones before it.';
  writeIndex(join(sectionDir, 'index.html'), {
    label, intro, body: cardGrid(entries), sectionDir, topicDir,
    currentTopic: basename(topicDir),
  });
}

// Topic index (only when the topic has lens sub-sections): cards for each section.
function buildTopicIndex(topicDir, sections) {
  const entries = sections.map((sd, i) => ({
    href: relative(topicDir, join(sd, 'index.html')),
    num: `Track ${String(i + 1).padStart(2, '0')}`,
    title: sectionLabel(topicDir, sd),
    desc: (existsSync(join(sd, 'README.md')) && readDescription(join(sd, 'README.md')))
      || 'A layered curriculum track.',
  }));
  const readme = join(topicDir, 'README.md');
  const intro = (existsSync(readme) && readDescription(readme))
    || 'Layered study tracks. Each track is read in order.';
  writeIndex(join(topicDir, 'index.html'), {
    label: topicLabel(topicDir), intro, body: cardGrid(entries),
    sectionDir: null, topicDir, currentTopic: basename(topicDir),
  });
}

function buildRootIndex(topics) {
  const entries = topics.map((t) => {
    const topicDir = join(ROOT, t);
    const readme = join(topicDir, 'README.md');
    const firstSection = findSections(topicDir)[0];
    const desc = (existsSync(readme) && readDescription(readme))
      || (firstSection && readDescription(join(firstSection, 'README.md')))
      || 'A layered study curriculum.';
    return {
      href: `${t}/index.html`,
      num: labelize(t),
      title: topicLabel(topicDir),
      desc,
    };
  });
  writeIndex(join(ROOT, 'index.html'), {
    label: 'Study Library', currentTopic: null, sectionDir: null, topicDir: null,
    intro: 'Long-form, layered study curricula. Pick a topic; each is read in order, '
      + 'every layer building on the ones before it.',
    body: cardGrid(entries),
  });
}

// --- Run --------------------------------------------------------------------

function renderTopic(topic) {
  const topicDir = join(ROOT, topic);
  if (!existsSync(topicDir)) { console.error(`  ! no such topic: ${topic}`); return; }
  const sections = findSections(topicDir);
  if (sections.length === 0) { console.error(`  ! no layers under: ${topic}`); return; }
  for (const sd of sections) {
    for (const md of orderFiles(sd)) buildPage(join(sd, md), sd, topicDir);
    buildSectionIndex(sd, topicDir);
  }
  // A topic-level index only when the sole section isn't the topic dir itself,
  // or when there are multiple sections (lenses).
  if (!(sections.length === 1 && sections[0] === topicDir)) {
    buildTopicIndex(topicDir, sections);
  }
}

const arg = process.argv[2];
console.log('Rendering curricula…');

if (arg) {
  // arg may be "topic" or "topic/lens" — resolve to the owning topic.
  const topic = arg.split('/')[0];
  renderTopic(topic);
} else {
  for (const t of listTopics()) renderTopic(t);
}

buildRootIndex(listTopics());
console.log('Done.');
