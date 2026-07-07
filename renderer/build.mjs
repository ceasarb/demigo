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
// Requires: pandoc (gfm), node.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..'); // the study/ dir
const TEMPLATE = readFileSync(join(ROOT, '_assets', 'template.html'), 'utf8');

const ACRONYMS = new Set([
  'gcp', 'aws', 'azure', 'ncc', 'vpc', 'dns', 'nat', 'iam', 'ci', 'cd', 'cicd',
  'ai', 'eda', 'idp', 'sdlc', 'api', 'sre', 'cap', 'gpu', 'k8s', 'ado',
]);

// --- Discovery --------------------------------------------------------------

function isHidden(name) {
  return name.startsWith('_') || name.startsWith('.');
}

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

function labelize(seg) {
  return seg
    .split(/[-_ ]+/)
    .map((w) => (ACRONYMS.has(w.toLowerCase())
      ? w.toUpperCase()
      : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

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

function h1Of(mdPath) {
  try {
    const m = readFileSync(mdPath, 'utf8').match(/^#\s+(.+)$/m);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

// --- Reused pandoc / html helpers (from the networking renderer) ------------

function pandocConvert(mdPath) {
  return execFileSync('pandoc', [
    '--from=gfm+yaml_metadata_block',
    '--to=html5',
    '--syntax-highlighting=none',
    '--section-divs',
    mdPath,
  ], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

function buildTOC(body) {
  const headings = [];
  // pandoc --section-divs puts the id on the <section> wrapper, not the heading:
  //   <section id="…" class="level2"><h2>Title</h2>…
  const re = /<section\s+id="([^"]+)"\s+class="level([23])"[^>]*>\s*<h[23][^>]*>([\s\S]*?)<\/h[23]>/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    headings.push({ id: m[1], level: parseInt(m[2], 10), text: m[3].replace(/<[^>]*>/g, '').trim() });
  }
  if (headings.length === 0) return '';
  const items = [];
  let inSub = false;
  for (const h of headings) {
    if (h.level === 2) {
      if (inSub) { items.push('</ul></li>'); inSub = false; }
      items.push(`<li><a href="#${h.id}">${escapeHtml(h.text)}</a>`);
    } else {
      if (!inSub) { items.push('<ul>'); inSub = true; }
      items.push(`<li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`);
    }
  }
  if (inSub) items.push('</ul></li>');
  let html = '<ul>';
  for (const t of items) html += t;
  const opens = (html.match(/<li>/g) || []).length;
  const closes = (html.match(/<\/li>/g) || []).length;
  for (let i = 0; i < opens - closes; i++) html += '</li>';
  html += '</ul>';
  return html;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function rewriteLinks(body) {
  return body.replace(/href="([^"#?]+\.md)(#[^"]*)?"/g, (m, path, frag = '') =>
    `href="${path.replace(/\.md$/, '.html')}${frag}"`);
}

// "**Term**: desc" / "**Term** — desc" lists → styled definition lists.
function convertDefinitionLists(body) {
  const ulRe = /<ul>((?:(?!<ul>|<\/ul>)[\s\S])*?)<\/ul>/g;
  const itemRe = /^<strong>([^<][^<]*?)<\/strong>(?:\s*:\s*|\s+—\s+|\s+&mdash;\s+)([\s\S]+)$/;
  return body.replace(ulRe, (match, inner) => {
    const items = [];
    const liRe = /<li>([\s\S]*?)<\/li>/g;
    let m;
    while ((m = liRe.exec(inner)) !== null) items.push(m[1].trim());
    if (items.length < 2) return match;
    const parsed = items.map((raw) => {
      const m2 = raw.match(itemRe);
      if (!m2) return { def: false, raw };
      const term = m2[1].trim();
      if (/[.?!]$/.test(term) || term.length > 60) return { def: false, raw };
      return { def: true, term, desc: m2[2].trim() };
    });
    const matched = parsed.filter((p) => p.def).length;
    if (matched < Math.max(2, Math.ceil(items.length * 0.6))) return match;
    const rendered = parsed.map((p) => (p.def
      ? `  <li class="defitem"><span class="term">${p.term}</span><span class="defbody">${p.desc}</span></li>`
      : `  <li class="defitem-plain">${p.raw}</li>`)).join('\n');
    return `<ul class="deflist">\n${rendered}\n</ul>`;
  });
}

function extractH1(body) {
  const m = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? decodeEntities(m[1].replace(/<[^>]*>/g, '').trim()) : null;
}

function readTitle(mdPath) {
  return h1Of(mdPath) || basename(mdPath, '.md');
}

function readDescription(mdPath) {
  try {
    const lines = readFileSync(mdPath, 'utf8').split('\n');
    let pastH1 = false;
    const buf = [];
    for (const line of lines) {
      if (!pastH1) { if (line.startsWith('# ')) pastH1 = true; continue; }
      const t = line.trim();
      if (!t) { if (buf.length) break; continue; }
      if (t.startsWith('#') || t.startsWith('```')) { if (buf.length) break; continue; }
      buf.push(t);
      if (buf.join(' ').length > 200) break;
    }
    let s = buf.join(' ').replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
    if (s.length > 220) s = s.slice(0, 217) + '…';
    return s;
  } catch {
    return '';
  }
}

// --- Path helpers relative to ROOT (study/) ---------------------------------

function depthOf(htmlPath) {
  return relative(ROOT, htmlPath).split('/').length - 1;
}
function cssBaseFor(htmlPath) {
  const d = depthOf(htmlPath);
  return d === 0 ? '_assets/' : '../'.repeat(d) + '_assets/';
}
function rootBaseFor(htmlPath) {
  const d = depthOf(htmlPath);
  return d === 0 ? '' : '../'.repeat(d);
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

function render(opts) {
  return TEMPLATE
    .replace(/\$pagetitle\$/g, escapeHtml(opts.pageTitle))
    .replace(/\$sectionlabel\$/g, escapeHtml(opts.sectionLabel))
    .replace(/\$navlinks\$/g, opts.navLinks)
    .replace(/\$sectionsnav\$/g, opts.sectionsNav)
    .replace(/\$cssbase\$/g, opts.cssBase)
    .replace(/\$rootbase\$/g, opts.rootBase)
    .replace(/\$crumbs\$/g, opts.crumbs)
    .replace(/\$footer\$/g, escapeHtml(opts.footer))
    .replace(/\$body\$/g, opts.body)
    .replace(/\$if\(toc\)\$([\s\S]*?)\$endif\$/g, (m, inner) =>
      (opts.toc ? inner.replace(/\$toc\$/g, opts.toc) : ''));
}

const FOOTER = 'Concept library · study curriculum · rendered from markdown';

// --- Page + index builders --------------------------------------------------

function buildPage(mdPath, sectionDir, topicDir) {
  let body = pandocConvert(mdPath);
  body = rewriteLinks(body);
  body = convertDefinitionLists(body);
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
  }));
  console.log('  ' + relative(ROOT, htmlPath));
}

function cardGrid(entries) {
  // entries: [{ href, num, title, desc }]
  const cards = entries.map((e) => `      <a class="card" href="${e.href}">
        <span class="num">${escapeHtml(e.num)}</span>
        <span class="title">${escapeHtml(e.title)}</span>
        <span class="desc">${escapeHtml(e.desc)}</span>
      </a>`).join('\n');
  return `<div class="section-grid">\n${cards}\n</div>`;
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
