/**
 * Editorial line-icon library (24×24, stroke, currentColor).
 * Ported from the Whetstone design bundle. Replaces the emoji icons in
 * all page chrome (home cards, sidebar, command palette, tool headers).
 *
 * `iconInner(name)` returns the inner SVG markup (paths only).
 * `iconSvg(name, cls)` returns a full <svg> string ready for set:html / innerHTML.
 */

const ICONS: Record<string, string> = {
  /* category icons */
  type: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
  sparkles:
    '<path d="M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5 10.4 11l-4.4-1.5 4.4-1.6z"/><path d="M19 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  funnel: '<path d="M3 5h18l-7 8v5.5l-4 2V13z"/>',
  barchart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M3 20h18"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>',
  repeat:
    '<path d="M17 4l3 3-3 3"/><path d="M20 7H8a4 4 0 0 0-4 4"/><path d="M7 20l-3-3 3-3"/><path d="M4 17h12a4 4 0 0 0 4-4"/>',
  code: '<path d="M9 8l-4 4 4 4"/><path d="M15 8l4 4-4 4"/>',
  wrench:
    '<path d="M14.5 5.5a3.8 3.8 0 0 0-5 5L4 16v4h4l5.5-5.5a3.8 3.8 0 0 0 5-5l-2.8 2.8-2.2-.6-.6-2.2z"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z"/>',

  /* generators / security */
  key: '<circle cx="8" cy="8" r="3.2"/><path d="M10.3 10.3 20 20"/><path d="M16 16l2-2"/><path d="M18.5 18.5l2-2"/>',
  keyround: '<circle cx="9" cy="9" r="4"/><path d="M11.8 11.8 20 20v-3h-3"/>',
  hash: '<path d="M5 9h14"/><path d="M5 15h14"/><path d="M10 4 8 20"/><path d="M16 4l-2 16"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c1.4-3.6 4-5.2 7-5.2s5.6 1.6 7 5.2"/>',
  fingerprint:
    '<path d="M6 11a6 6 0 0 1 12 0"/><path d="M8.5 12a3.5 3.5 0 0 1 7 0v2.5"/><path d="M12 12v5"/><path d="M8.5 16v2"/><path d="M15.5 17.5v.5"/>',
  magnet: '<path d="M6 4v7a6 6 0 0 0 12 0V4"/><path d="M6 9h4"/><path d="M14 9h4"/><path d="M6 4h4"/><path d="M14 4h4"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><path d="M14 14h3v3"/><path d="M20 14v6h-6"/><path d="M17 20h.01"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>',
  rotate: '<path d="M20 11a8 8 0 1 0-1.6 5"/><path d="M20 5v5h-5"/>',
  droplet: '<path d="M12 3.5c3 3.5 5.5 6.4 5.5 9.5a5.5 5.5 0 0 1-11 0c0-3.1 2.5-6 5.5-9.5z"/>',
  gauge: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-4"/><circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none"/>',
  filebadge:
    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/><path d="M14 3v5h5"/><circle cx="9" cy="14" r="2.4"/><path d="M7.5 16l-.7 3 2.2-1 2.2 1-.7-3"/>',
  shieldcheck: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',

  /* text */
  case: '<path d="M3 17l3.5-9 3.5 9"/><path d="M4.2 14h4.6"/><path d="M20 11a3 3 0 0 0-3-3 3 3 0 0 0-3 3v3a3 3 0 0 0 3 3 3 3 0 0 0 3-3"/><path d="M20 8v9"/>',
  list: '<path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><circle cx="4" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none"/>',
  listplus: '<path d="M8 6h12"/><path d="M8 12h8"/><path d="M8 18h6"/><path d="M18 15v6"/><path d="M15 18h6"/>',
  layers: '<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  wraptext: '<path d="M4 6h16"/><path d="M4 12h13a3 3 0 0 1 0 6h-3"/><path d="M16 15l-2 3 2 3" transform="translate(0 -3)"/><path d="M4 18h5"/>',
  filterx: '<path d="M3 5h18l-7 8v5.5l-4 2V13z"/><path d="M14.5 6.5l4 4"/><path d="M18.5 6.5l-4 4"/>',
  link: '<path d="M10 13a4 4 0 0 0 5.7 0l2.5-2.5a4 4 0 0 0-5.7-5.7L11 6.3"/><path d="M14 11a4 4 0 0 0-5.7 0l-2.5 2.5a4 4 0 1 0 5.7 5.7L13 17.7"/>',
  sort: '<path d="M7 5v14"/><path d="M4 8l3-3 3 3"/><path d="M14 7h6"/><path d="M14 12h4"/><path d="M14 17h2"/>',

  /* converters / dev */
  binary: '<rect x="5" y="4" width="6" height="7" rx="1.4"/><rect x="13" y="13" width="6" height="7" rx="1.4"/><path d="M8 13v7"/><path d="M6.5 14.5 8 13"/><path d="M16 4v7"/><path d="M14.5 5.5 16 4"/>',
  database: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  smile: '<circle cx="12" cy="12" r="8.5"/><path d="M9 14.5c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5"/><path d="M9 9.5h.01"/><path d="M15 9.5h.01"/>',
  braces: '<path d="M9 4c-2 0-2.5 1.2-2.5 3v2c0 1.5-.6 2.5-2 3 1.4.5 2 1.5 2 3v2c0 1.8.5 3 2.5 3"/><path d="M15 4c2 0 2.5 1.2 2.5 3v2c0 1.5.6 2.5 2 3-1.4.5-2 1.5-2 3v2c0 1.8-.5 3-2.5 3"/>',
  filetext: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calrange: '<rect x="4" y="5" width="16" height="16" rx="2.4"/><path d="M4 10h16"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M9 15h6"/>',
  calclock: '<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6"/><path d="M4 9h16"/><path d="M8 3v4"/><path d="M16 3v4"/><circle cx="17.5" cy="16.5" r="4"/><path d="M17.5 15v1.5l1 1"/>',
  gitcompare: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H15a3 3 0 0 1 3 3v6"/><path d="M15.5 18H9a3 3 0 0 1-3-3V8.5"/>',
  container: '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M4 8.5 12 13l8-4.5"/><path d="M12 13v7"/>',
  asterisk: '<path d="M12 5v14"/><path d="M5.5 8.5 18.5 15.5"/><path d="M18.5 8.5 5.5 15.5"/>',
  filecode: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M10 12l-2 2.5 2 2.5"/><path d="M14 12l2 2.5-2 2.5"/>',

  /* utilities / extraction / analysis */
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4c0-4.4-4-8.2-9-8.2z"/><circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="10" r="1.1" fill="currentColor" stroke="none"/>',
  table: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16"/><path d="M4 15h16"/><path d="M10 10v9"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.5M12 19v2.5M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M2.5 12H5M19 12h2.5M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8"/>',
  timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V9.5"/><path d="M9.5 3h5"/><path d="M19 7l-1.5-1.5"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.5 2.3 4 5.3 4 8.5s-1.5 6.2-4 8.5c-2.5-2.3-4-5.3-4-8.5s1.5-6.2 4-8.5z"/>',

  /* chrome utility icons */
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"/>',
  monitor: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  github:
    '<path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.92-2.34 4.78-4.57 5.04.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/>',
}

// tool-id → icon name
const TOOL_ICON_MAP: Record<string, string> = {
  'add-text-to-lines': 'listplus',
  'convert-case': 'case',
  'list-generator': 'list',
  'remove-duplicate-lines': 'layers',
  'remove-line-breaks': 'wraptext',
  'remove-lines-containing': 'filterx',
  'slug-generator': 'link',
  'sort-text': 'sort',
  'api-key-generator': 'key',
  'bittorrent-magnet-link-generator': 'magnet',
  'jwt-secret-generator': 'shieldcheck',
  'lorem-ipsum-generator': 'filetext',
  'passphrase-generator': 'keyround',
  'password-generator': 'key',
  'pin-generator': 'hash',
  'random-string-generator': 'dice',
  'username-generator': 'user',
  'uuid-generator': 'fingerprint',
  'domain-extractor': 'globe',
  'email-extractor': 'at',
  'count-duplicates': 'layers',
  'text-counter': 'filetext',
  'aes-key-generator': 'lock',
  'hmac-key-generator': 'shieldcheck',
  'password-strength': 'gauge',
  'pem-inspector': 'filebadge',
  'qr-code': 'qr',
  'rclone-password': 'eye',
  'recovery-code-generator': 'rotate',
  'salt-generator': 'droplet',
  base64: 'binary',
  'data-size-converter': 'database',
  'emoji-shortcode': 'smile',
  'html-entity': 'code',
  'markdown-to-html': 'filetext',
  'number-base-converter': 'binary',
  'url-encoder': 'link',
  'cron-expression': 'calclock',
  'diff-checker': 'gitcompare',
  'docker-run-to-compose': 'container',
  'json-formatter': 'braces',
  'jwt-decoder': 'keyround',
  'regex-tester': 'asterisk',
  'toml-formatter': 'filecode',
  'xml-beautifier': 'filecode',
  'yaml-formatter': 'filecode',
  'color-picker': 'palette',
  'csv-viewer': 'table',
  'date-interval': 'calrange',
  'hash-generator': 'hash',
  reg2gpo: 'settings',
  'time-convert': 'timer',
  'timestamp-converter': 'clock',
}

// category-id → icon name
const CATEGORY_ICON_MAP: Record<string, string> = {
  'text-processing': 'type',
  generators: 'sparkles',
  extraction: 'funnel',
  analysis: 'barchart',
  security: 'shield',
  converters: 'repeat',
  development: 'code',
  utilities: 'wrench',
}

// category-id → editorial hue (CSS custom property reference)
export const categoryHue: Record<string, string> = {
  'text-processing': 'var(--c-text)',
  generators: 'var(--c-gen)',
  extraction: 'var(--c-extract)',
  analysis: 'var(--c-analyze)',
  security: 'var(--c-secure)',
  converters: 'var(--c-convert)',
  development: 'var(--c-dev)',
  utilities: 'var(--c-util)',
}

export function iconInner(name: string): string {
  return ICONS[name] ?? ICONS['wrench']!
}

export function iconSvg(name: string, cls = ''): string {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${iconInner(name)}</svg>`
}

export function toolIconName(toolId: string): string {
  return TOOL_ICON_MAP[toolId] ?? 'wrench'
}

export function categoryIconName(categoryId: string): string {
  return CATEGORY_ICON_MAP[categoryId] ?? 'wrench'
}

export function toolIconSvg(toolId: string, cls = ''): string {
  return iconSvg(toolIconName(toolId), cls)
}

export function hueOf(categoryId: string): string {
  return categoryHue[categoryId] ?? 'var(--ink-3)'
}
