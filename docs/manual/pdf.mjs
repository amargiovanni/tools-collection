/**
 * Assembles manual.html from the tool registry and prints the PDF.
 *
 * Pagination is explicit: every page is a fixed A4 `.sheet`, so the page each
 * tool lands on is known while assembling. The build then checks it three ways
 * before writing anything: no sheet overflows, the PDF has as many pages as
 * there are sheets, and each tool's name is found on the page the map claims.
 */
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import { loadCatalogue, PDF_NAME } from './catalogue.mjs'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(HERE, '../..')
const HTML_OUT = join(HERE, 'manual.html')
const PDF_OUT = join(ROOT, 'public/manual', PDF_NAME)
const PAGE_MAP = join(ROOT, 'src/config/manual-pages.json')
const SITE = 'tools.margiovanni.it'

/** Category identity: the site's palette, as opaque hex only. */
const CATEGORY = {
  'text-processing': { color: '#2563eb', key: 'categories_textProcessing', blurb: 'categoryBlurb_textProcessing' },
  generators: { color: '#7c3aed', key: 'categories_generators', blurb: 'categoryBlurb_generators' },
  extraction: { color: '#0e7490', key: 'categories_extraction', blurb: 'categoryBlurb_extraction' },
  analysis: { color: '#b45309', key: 'categories_analysis', blurb: 'categoryBlurb_analysis' },
  security: { color: '#be123c', key: 'categories_security', blurb: 'categoryBlurb_security' },
  converters: { color: '#047857', key: 'categories_converters', blurb: 'categoryBlurb_converters' },
  development: { color: '#4f46e5', key: 'categories_development', blurb: 'categoryBlurb_development' },
  utilities: { color: '#be185d', key: 'categories_utilities', blurb: 'categoryBlurb_utilities' },
}

/** Mix a hex colour with white: the opaque equivalent of a tint. */
function tint(hex, whiteShare) {
  const n = parseInt(hex.slice(1), 16)
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.round(c + (255 - c) * whiteShare))
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const pad = (n) => String(n).padStart(2, '0')

function layout({ tools, categories }) {
  // Front matter: cover, read-me-first, contents. Then per category an opener
  // page with its first tool, then two tools per page. Back cover last.
  const sheets = [{ kind: 'cover' }, { kind: 'intro' }, { kind: 'contents' }]
  const pageOf = {}
  let n = 0
  const numbered = tools.map((t) => ({ ...t }))
  for (const [ci, cat] of categories.entries()) {
    const inCat = numbered.filter((t) => t.category === cat)
    for (const t of inCat) t.no = ++n
    const [first, ...rest] = inCat
    sheets.push({ kind: 'opener', cat, ci, tools: [first], all: inCat })
    for (let i = 0; i < rest.length; i += 2) sheets.push({ kind: 'cards', cat, ci, tools: rest.slice(i, i + 2) })
  }
  sheets.push({ kind: 'back' })
  sheets.forEach((s, i) => {
    s.page = i + 1
    for (const t of s.tools ?? []) pageOf[t.id] = s.page
  })
  return { sheets, pageOf, total: sheets.length, numbered }
}

function tabs(ci, en, categories) {
  return `<div class="tabs" aria-hidden="true">${categories
    .map((cat, i) => {
      const c = CATEGORY[cat]
      const on = i === ci
      return `<div class="tab${on ? ' on' : ''}" style="top:${34 + i * 28.5}mm;background:${on ? c.color : tint(c.color, 0.86)}">${
        on ? `<span>${esc(en[c.key])}</span>` : ''
      }</div>`
    })
    .join('')}</div>`
}

function foot(page, total, label) {
  return `<footer class="foot"><span>Tools Collection — Field Manual</span><span>${esc(label ?? '')}</span><span class="pg">${pad(page)}<i> / ${pad(total)}</i></span></footer>`
}

function card(t, en) {
  const c = CATEGORY[t.category]
  const url = `${SITE}/en/tools/${t.id}/`
  return `<article class="card" id="${t.id}" style="--c:${c.color};--t:${tint(c.color, 0.9)};--tt:${tint(c.color, 0.95)}">
  <div class="meta">
    <div class="no"><span>No. ${pad(t.no)}</span><b>${esc(en[c.key])}</b></div>
    <div class="ident"><span class="tile">${t.icon}</span><h3>${esc(t.name)}</h3></div>
    <p class="desc">${esc(t.description)}</p>
    <div class="how"><span class="lbl">How to use</span><p>${esc(t.use)}</p></div>
    <a class="addr" href="https://${url}"><span>${SITE}</span>/en/tools/${esc(t.id)}/</a>
  </div>
  <figure class="shot">
    <div class="bar"><i></i><i></i><i></i><span>${esc(url)}</span></div>
    <div class="frame"><img src="screens/${t.id}.jpg" alt="${esc(t.name)} — screenshot"></div>
  </figure>
</article>`
}

function sheetHtml(s, ctx) {
  const { en, categories, total, numbered, pageOf, version, date } = ctx
  if (s.kind === 'cover') {
    const tiles = numbered
      .map((t) => `<span class="mt" style="background:${CATEGORY[t.category].color}">${t.icon}</span>`)
      .join('')
    const legend = categories
      .map((cat) => `<span><i style="background:${CATEGORY[cat].color}"></i>${esc(en[CATEGORY[cat].key])}</span>`)
      .join('')
    return `<section class="sheet cover">
  <div class="crop tl"></div><div class="crop tr"></div><div class="crop bl"></div><div class="crop br"></div>
  <header class="cv-top"><span>Field Manual</span><span>Edition ${esc(version)} · English</span></header>
  <div class="cv-title">
    <p class="eyebrow">A private workbench for text, code &amp; crypto</p>
    <h1>Tools<br>Collection</h1>
    <p class="lede">${numbered.length} browser utilities — formatters, generators, converters and inspectors. Everything runs on your device. Nothing is ever uploaded.</p>
  </div>
  <div class="mosaic">${tiles}</div>
  <div class="cv-foot"><div class="legend">${legend}</div>
    <div class="stats"><span><b>${numbered.length}</b> tools</span><span><b>${categories.length}</b> categories</span><span><b>5</b> languages</span><span><b>0</b> bytes uploaded</span></div>
  </div>
</section>`
  }
  if (s.kind === 'intro') {
    return `<section class="sheet page intro">
  <p class="kicker">Before you start</p>
  <h2 class="statement">Nothing you type<br>leaves your browser.</h2>
  <div class="cols">
    <div>
      <h4>How it works</h4>
      <p>Every tool is a small program that runs inside the page. Text you paste, keys you generate and files you drop are processed on your device: there is no server-side processing, no account and nothing to sign in to.</p>
      <p>Favourites and recently used tools are remembered in your browser's local storage, on your device only. Clearing the site data forgets them.</p>
      <h4>Sharing a tool's state</h4>
      <p><b>Share</b> copies a link that reopens the tool with your input. The input is packed after the <code>#</code> of the link, a part browsers never send to a server. It is encoded, not encrypted: anyone you give the link to can read it, so do not share secrets.</p>
    </div>
    <div>
      <h4>Getting around</h4>
      <dl class="keys">
        <dt><kbd>⌘</kbd><kbd>K</kbd> or <kbd>Ctrl</kbd><kbd>K</kbd></dt><dd>Search every tool by name or keyword</dd>
        <dt><kbd>/</kbd></dt><dd>Quick open</dd>
        <dt><kbd>⌘</kbd><kbd>↵</kbd></dt><dd>Run the tool's main action</dd>
      </dl>
      <p>The interface speaks English, Italian, German, French and Spanish, in a light or a dark theme. Every tool has its own address, so you can bookmark it.</p>
      <h4>Run it yourself</h4>
      <p>The whole site is static files. It is published as a container image you can run on your own network:</p>
      <pre>docker run -p 8080:80 \\
  ghcr.io/amargiovanni/tools-collection</pre>
    </div>
  </div>
  <div class="cats">${categories
    .map(
      (cat, i) =>
        `<div style="--c:${CATEGORY[cat].color};--tt:${tint(CATEGORY[cat].color, 0.95)}"><span class="ci">${pad(i + 1)}</span><b>${esc(en[CATEGORY[cat].key])}</b><p>${esc(en[CATEGORY[cat].blurb])}</p><span class="cn">${numbered.filter((t) => t.category === cat).length} tools</span></div>`,
    )
    .join('')}</div>
  <div class="reading">
    <h4>Reading the tool pages</h4>
    <p>Tools are grouped in eight categories, each with its own colour on the edge of the page. Every entry gives the tool's number, what it does, how to use it, a screenshot taken from the live site, and its address — click it in the PDF to open the tool.</p>
  </div>
  ${foot(s.page, total, 'Introduction')}
</section>`
  }
  if (s.kind === 'contents') {
    const blocks = categories
      .map((cat) => {
        const c = CATEGORY[cat]
        const items = numbered
          .filter((t) => t.category === cat)
          .map(
            (t) =>
              `<li><a href="#${t.id}"><span class="n">${pad(t.no)}</span><span class="t">${esc(t.name)}</span><span class="p">${pageOf[t.id]}</span></a></li>`,
          )
          .join('')
        return `<div class="toc-cat" style="--c:${c.color}"><h4><i></i>${esc(en[c.key])}</h4><ol>${items}</ol></div>`
      })
      .join('')
    return `<section class="sheet page contents"><p class="kicker">Contents</p><h2>${numbered.length} tools, ${categories.length} categories</h2><div class="toc">${blocks}</div>${foot(s.page, total, 'Contents')}</section>`
  }
  if (s.kind === 'opener') {
    const c = CATEGORY[s.cat]
    const list = s.all.map((t) => `<li><span>${pad(t.no)}</span>${esc(t.name)}</li>`).join('')
    return `<section class="sheet page opener" style="--c:${c.color};--t:${tint(c.color, 0.9)};--tt:${tint(c.color, 0.95)}">
  ${tabs(s.ci, en, categories)}
  <header class="band">
    <div class="big">${pad(s.ci + 1)}</div>
    <div class="what"><p class="kicker">Category ${pad(s.ci + 1)} of ${pad(categories.length)}</p><h2>${esc(en[c.key])}</h2><p class="blurb">${esc(en[c.blurb])}</p></div>
    <ol class="list">${list}</ol>
  </header>
  ${s.tools.map((t) => card(t, en)).join('')}
  ${foot(s.page, total, en[c.key])}
</section>`
  }
  if (s.kind === 'cards') {
    const c = CATEGORY[s.cat]
    return `<section class="sheet page cards">${tabs(s.ci, en, categories)}${s.tools.map((t) => card(t, en)).join('')}${foot(s.page, total, en[c.key])}</section>`
  }
  // back cover
  return `<section class="sheet back">
  <div class="crop tl"></div><div class="crop tr"></div><div class="crop bl"></div><div class="crop br"></div>
  <div class="bk-mark">&gt;_</div>
  <p class="bk-line">Fast, private utilities.<br>Your data never leaves the tab.</p>
  <a class="bk-url" href="https://${SITE}/">${SITE}</a>
  <div class="colophon">
    <p>Tools Collection ${esc(version)} — free and open-source software, MIT licence. Source: github.com/amargiovanni/tools-collection</p>
    <p>Set in Space Grotesk, Inter and JetBrains Mono (SIL Open Font License 1.1). Screenshots taken from the built site; text generated from the tool catalogue on ${esc(date)}.</p>
  </div>
</section>`
}

export async function assemble() {
  const cat = await loadCatalogue()
  const { version } = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'))
  const { sheets, pageOf, total, numbered } = layout(cat)
  const date = new Date().toISOString().slice(0, 10)
  const ctx = { ...cat, total, numbered, pageOf, version, date }
  const css = await readFile(join(HERE, 'print.css'), 'utf8')
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Tools Collection — Field Manual</title>
<meta name="author" content="Tools Collection">
<style>${css}</style></head>
<body>${sheets.map((s) => sheetHtml(s, ctx)).join('\n')}</body></html>`
  return { html, pageOf, total, numbered }
}

/** Refuses a PDF with transparency: macOS Preview draws it as grey boxes. */
function assertOpaque(buf) {
  const found = [...buf.toString('latin1').matchAll(/\/SMask\b|\/S \/Transparency|\/(?:ca|CA) (?:0|0?\.\d+)\b/g)].map(
    (m) => m[0],
  )
  if (found.length) {
    const counts = Object.entries(Object.groupBy(found, (f) => f)).map(([k, v]) => `${k} ×${v.length}`)
    throw new Error(`PDF has transparency (${counts.join(', ')}): fix print.css`)
  }
}

export async function pdf() {
  const { html, pageOf, total, numbered } = await assemble()
  await writeFile(HTML_OUT, html)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(pathToFileURL(HTML_OUT).href, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.emulateMedia({ media: 'print' })
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll('.sheet')]
        .map((s, i) => ({ i: i + 1, over: s.scrollHeight - s.clientHeight, wide: s.scrollWidth - s.clientWidth }))
        .filter((s) => s.over > 1 || s.wide > 1),
    )
    if (overflow.length) throw new Error(`sheets overflow: ${JSON.stringify(overflow)}`)
    const missing = await page.evaluate(() =>
      [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src),
    )
    if (missing.length) throw new Error(`images not loaded: ${missing.join(', ')}`)
    const buf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      outline: true,
    })
    assertOpaque(buf)
    await mkdir(join(ROOT, 'public/manual'), { recursive: true })
    await writeFile(PDF_OUT, buf)
  } finally {
    await browser.close()
  }
  // Check the page map against the printed PDF, page by page.
  const pages = execFileSync('pdftotext', ['-layout', PDF_OUT, '-'], { encoding: 'utf8' }).split('\f')
  if (pages.filter((p) => p.trim()).length !== total) throw new Error(`PDF has ${pages.length - 1} pages, expected ${total}`)
  for (const t of numbered) {
    const text = pages[pageOf[t.id] - 1].replace(/\s+/g, ' ')
    if (!text.toUpperCase().includes(`NO. ${String(t.no).padStart(2, '0')}`)) throw new Error(`${t.id} not on page ${pageOf[t.id]}`)
  }
  const { size: bytes } = await stat(PDF_OUT)
  await writeFile(PAGE_MAP, `${JSON.stringify({ file: `/manual/${PDF_NAME}`, pages: total, bytes, tools: pageOf }, null, 2)}\n`)
  console.log(`public/manual/${PDF_NAME} — ${total} pages`)
}
