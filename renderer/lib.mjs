// Shared, format-agnostic rendering plumbing for the Demigo renderers.
//
// Both build.mjs (study/ curricula) and build-docs.mjs (project .claude/docs/)
// import from here. Nothing in this module knows about a specific tree shape:
// there is no baked-in ROOT and no baked-in template — both are passed in as
// parameters. Discovery, labelling of a particular hierarchy, and nav/crumb
// construction stay in the per-tree entry points.
//
// Requires: pandoc (gfm), node.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative, basename } from 'node:path';

export const ACRONYMS = new Set([
  'gcp', 'aws', 'azure', 'ncc', 'vpc', 'dns', 'nat', 'iam', 'ci', 'cd', 'cicd',
  'ai', 'eda', 'idp', 'sdlc', 'api', 'sre', 'cap', 'gpu', 'k8s', 'ado',
]);

export function isHidden(name) {
  return name.startsWith('_') || name.startsWith('.');
}

export function labelize(seg) {
  return seg
    .split(/[-_ ]+/)
    .map((w) => (ACRONYMS.has(w.toLowerCase())
      ? w.toUpperCase()
      : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

// Drop a leading YAML frontmatter block (--- … ---) so title/description
// extraction reads the document body, not frontmatter keys or `#` comments
// inside it (e.g. extracted ADRs carry a `# --- extraction fields ---` comment).
export function stripFrontmatter(raw) {
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/);
  return m ? raw.slice(m[0].length) : raw;
}

export function h1Of(mdPath) {
  try {
    const m = stripFrontmatter(readFileSync(mdPath, 'utf8')).match(/^#\s+(.+)$/m);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

// --- pandoc / html helpers --------------------------------------------------

export function pandocConvert(mdPath) {
  return execFileSync('pandoc', [
    '--from=gfm+yaml_metadata_block',
    '--to=html5',
    '--syntax-highlighting=none',
    '--section-divs',
    mdPath,
  ], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

export function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export function buildTOC(body) {
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

export function rewriteLinks(body) {
  return body.replace(/href="([^"#?]+\.md)(#[^"]*)?"/g, (m, path, frag = '') =>
    `href="${path.replace(/\.md$/, '.html')}${frag}"`);
}

// "**Term**: desc" / "**Term** — desc" lists → styled definition lists.
export function convertDefinitionLists(body) {
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

export function extractH1(body) {
  const m = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? decodeEntities(m[1].replace(/<[^>]*>/g, '').trim()) : null;
}

// Pandoc renders a ```mermaid fence as `<pre class="mermaid"><code>…</code></pre>`.
// Mermaid wants the diagram source as the direct text of a `.mermaid` element,
// so strip the inner <code> wrapper. Entities (e.g. `--&gt;`) are left as-is —
// the browser decodes them when Mermaid reads the element's textContent.
export function normalizeMermaid(body) {
  return body.replace(
    /<pre class="mermaid"><code>([\s\S]*?)<\/code><\/pre>/g,
    '<pre class="mermaid">$1</pre>');
}

// True if the rendered body contains at least one Mermaid diagram — lets a
// renderer include the (heavy) vendored script only on pages that need it.
export function hasMermaid(body) {
  return /<pre class="mermaid">/.test(body);
}

export function readTitle(mdPath) {
  return h1Of(mdPath) || basename(mdPath, '.md');
}

export function readDescription(mdPath) {
  try {
    const lines = stripFrontmatter(readFileSync(mdPath, 'utf8')).split('\n');
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

export function cardGrid(entries) {
  // entries: [{ href, num, title, desc, badges? }]
  // badges (optional): [{ cls, label }] — rendered as pill spans. When absent the
  // card markup is byte-identical to the no-badge form (keeps the study track stable).
  const cards = entries.map((e) => {
    const badges = (e.badges && e.badges.length)
      ? `\n        <span class="badges">${e.badges.map((b) =>
          `<span class="badge ${escapeHtml(b.cls)}">${escapeHtml(b.label)}</span>`).join('')}</span>`
      : '';
    return `      <a class="card" href="${e.href}">
        <span class="num">${escapeHtml(e.num)}</span>
        <span class="title">${escapeHtml(e.title)}</span>
        <span class="desc">${escapeHtml(e.desc)}</span>${badges}
      </a>`;
  }).join('\n');
  return `<div class="section-grid">\n${cards}\n</div>`;
}

// --- Path helpers (ROOT passed in, not baked) -------------------------------

export function depthOf(root, htmlPath) {
  return relative(root, htmlPath).split('/').length - 1;
}
export function cssBaseFor(root, htmlPath) {
  const d = depthOf(root, htmlPath);
  return d === 0 ? '_assets/' : '../'.repeat(d) + '_assets/';
}
export function rootBaseFor(root, htmlPath) {
  const d = depthOf(root, htmlPath);
  return d === 0 ? '' : '../'.repeat(d);
}

// --- Template rendering (template passed in, not baked) ---------------------

export function renderTemplate(template, opts) {
  return template
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
      (opts.toc ? inner.replace(/\$toc\$/g, opts.toc) : ''))
    .replace(/\$if\(mermaid\)\$([\s\S]*?)\$endif\$/g, (m, inner) =>
      (opts.mermaid ? inner : ''));
}
