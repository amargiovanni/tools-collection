export const categories = [
  'text-processing',
  'generators',
  'extraction',
  'analysis',
  'security',
  'converters',
  'development',
  'utilities',
] as const

export type Category = (typeof categories)[number]

export interface ToolMeta {
  readonly id: string
  readonly category: Category
  readonly icon: string
  readonly keywords: readonly string[]
  readonly path: string
}

export const toolRegistry: readonly ToolMeta[] = [
  // Text Processing
  {
    id: 'list-generator',
    category: 'text-processing',
    icon: '📋',
    keywords: ['list', 'format', 'numbered', 'bulleted', 'comma', 'pipe'],
    path: '/tools/list-generator',
  },
  {
    id: 'add-text-to-lines',
    category: 'text-processing',
    icon: '✏️',
    keywords: ['add', 'prepend', 'append', 'prefix', 'suffix', 'lines'],
    path: '/tools/add-text-to-lines',
  },
  {
    id: 'convert-case',
    category: 'text-processing',
    icon: '🔠',
    keywords: ['case', 'upper', 'lower', 'title', 'camel', 'snake', 'constant'],
    path: '/tools/convert-case',
  },
  {
    id: 'remove-duplicate-lines',
    category: 'text-processing',
    icon: '❌',
    keywords: ['duplicate', 'remove', 'deduplicate', 'unique', 'lines'],
    path: '/tools/remove-duplicate-lines',
  },
  {
    id: 'remove-line-breaks',
    category: 'text-processing',
    icon: '📏',
    keywords: ['line', 'break', 'newline', 'remove', 'join'],
    path: '/tools/remove-line-breaks',
  },
  {
    id: 'remove-lines-containing',
    category: 'text-processing',
    icon: '🚫',
    keywords: ['remove', 'filter', 'containing', 'delete', 'lines', 'words'],
    path: '/tools/remove-lines-containing',
  },

  // Generators
  {
    id: 'password-generator',
    category: 'generators',
    icon: '🔑',
    keywords: ['password', 'generate', 'random', 'secure', 'strong'],
    path: '/tools/password-generator',
  },
  {
    id: 'username-generator',
    category: 'generators',
    icon: '👤',
    keywords: ['username', 'generate', 'random', 'nick', 'name'],
    path: '/tools/username-generator',
  },
  {
    id: 'pin-generator',
    category: 'generators',
    icon: '🔢',
    keywords: ['pin', 'code', 'numeric', 'generate', 'random'],
    path: '/tools/pin-generator',  },
  {
    id: 'uuid-generator',
    category: 'generators',
    icon: '🆔',
    keywords: ['uuid', 'ulid', 'guid', 'generate', 'random', 'unique', 'identifier', 'v4', 'v7'],
    path: '/tools/uuid-generator',
  },
  {
    id: 'bittorrent-magnet-link-generator',
    category: 'generators',
    icon: '🧲',
    keywords: ['magnet', 'bittorrent', 'torrent', 'infohash', 'tracker', 'link'],
    path: '/tools/bittorrent-magnet-link-generator',
  },
  {
    id: 'lorem-ipsum-generator',
    category: 'generators',
    icon: '📝',
    keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'generate', 'dummy', 'filler'],
    path: '/tools/lorem-ipsum-generator',
  },

  // Extraction
  {
    id: 'domain-extractor',
    category: 'extraction',
    icon: '🌐',
    keywords: ['domain', 'extract', 'url', 'hostname', 'subdomain'],
    path: '/tools/domain-extractor',
  },
  {
    id: 'email-extractor',
    category: 'extraction',
    icon: '📧',
    keywords: ['email', 'extract', 'address', 'find', 'parse'],
    path: '/tools/email-extractor',  },
  {
    id: 'csv-viewer',
    category: 'utilities',
    icon: '📊',
    keywords: ['csv', 'table', 'spreadsheet', 'data', 'viewer', 'sort', 'tsv'],
    path: '/tools/csv-viewer',
  },

  // Analysis
  {
    id: 'count-duplicates',
    category: 'analysis',
    icon: '🔢',
    keywords: ['count', 'duplicate', 'frequency', 'occurrences', 'analyze'],
    path: '/tools/count-duplicates',
  },
  {
    id: 'text-counter',
    category: 'analysis',
    icon: '📝',
    keywords: ['text', 'counter', 'characters', 'words', 'sentences', 'paragraphs', 'keywords'],
    path: '/tools/text-counter',
  },

  // Security
  {
    id: 'pem-inspector',
    category: 'security',
    icon: '📜',
    keywords: ['pem', 'certificate', 'ssl', 'tls', 'x509', 'inspect', 'fingerprint'],
    path: '/tools/pem-inspector',
  },
  {
    id: 'rclone-password',
    category: 'security',
    icon: '🔓',
    keywords: ['rclone', 'password', 'decrypt', 'obscure', 'base64url', 'aes'],
    path: '/tools/rclone-password',
  },
  {
    id: 'password-strength',
    category: 'security',
    icon: '🔒',
    keywords: ['password', 'strength', 'check', 'security', 'analyze'],
    path: '/tools/password-strength',
  },
  {
    id: 'qr-code',
    category: 'security',
    icon: '📱',
    keywords: ['qr', 'code', 'generate', 'read', 'scan', 'barcode'],
    path: '/tools/qr-code',
  },

  // Converters
  {
    id: 'emoji-shortcode',
    category: 'converters',
    icon: '😎',
    keywords: ['emoji', 'shortcode', 'convert', 'emoticon', 'smiley'],
    path: '/tools/emoji-shortcode',
  },
  {
    id: 'base64',
    category: 'converters',
    icon: '🔐',
    keywords: ['base64', 'encode', 'decode', 'binary', 'text'],
    path: '/tools/base64',
  },
  {
    id: 'url-encoder',
    category: 'converters',
    icon: '🔗',
    keywords: ['url', 'encode', 'decode', 'percent', 'uri', 'component'],
    path: '/tools/url-encoder',
  },
  {
    id: 'data-size-converter',
    category: 'converters',
    icon: '💾',
    keywords: ['data', 'size', 'bit', 'byte', 'kb', 'mb', 'gb', 'tb', 'kib', 'mib', 'gib', 'tib'],
    path: '/tools/data-size-converter',  },
  {
    id: 'number-base-converter',
    category: 'converters',
    icon: '🔢',
    keywords: ['number', 'base', 'decimal', 'hex', 'hexadecimal', 'binary', 'octal', 'convert'],
    path: '/tools/number-base-converter',
  },

  // Development
  {
    id: 'json-formatter',
    category: 'development',
    icon: '📄',
    keywords: ['json', 'format', 'validate', 'pretty', 'minify', 'beautify'],
    path: '/tools/json-formatter',
  },
  {
    id: 'diff-checker',
    category: 'development',
    icon: '🔍',
    keywords: ['diff', 'compare', 'difference', 'text', 'changes'],
    path: '/tools/diff-checker',
  },
  {
    id: 'regex-tester',
    category: 'development',
    icon: '🔤',
    keywords: ['regex', 'regular', 'expression', 'test', 'match', 'pattern'],
    path: '/tools/regex-tester',
  },
  {
    id: 'xml-beautifier',
    category: 'development',
    icon: '📋',
    keywords: ['xml', 'format', 'beautify', 'validate', 'pretty'],
    path: '/tools/xml-beautifier',
  },
  {
    id: 'cron-expression',
    category: 'development',
    icon: '🗓️',
    keywords: ['cron', 'schedule', 'expression', 'crontab', 'parser', 'jobs', 'aws', 'eventbridge', 'cloudwatch', 'lambda'],
    path: '/tools/cron-expression',  },
  {
    id: 'jwt-decoder',
    category: 'development',
    icon: '🔑',
    keywords: ['jwt', 'json', 'web', 'token', 'decode', 'inspect', 'auth', 'bearer'],
    path: '/tools/jwt-decoder',
  },

  // Utilities
  {
    id: 'color-picker',
    category: 'utilities',
    icon: '🎨',
    keywords: ['color', 'picker', 'hex', 'rgb', 'hsl', 'convert', 'palette'],
    path: '/tools/color-picker',
  },
  {
    id: 'timestamp-converter',
    category: 'utilities',
    icon: '🕐',
    keywords: ['timestamp', 'unix', 'date', 'time', 'epoch', 'convert'],
    path: '/tools/timestamp-converter',
  },
  {
    id: 'time-convert',
    category: 'utilities',
    icon: '⏱️',
    keywords: ['time', 'convert', 'duration', 'seconds', 'minutes', 'hours'],
    path: '/tools/time-convert',
  },
  {
    id: 'reg2gpo',
    category: 'utilities',
    icon: '🧩',
    keywords: ['registry', 'gpo', 'group', 'policy', 'windows', 'xml', 'convert'],
    path: '/tools/reg2gpo',
  },
  {
    id: 'hash-generator',
    category: 'utilities',
    icon: '🔏',
    keywords: ['hash', 'sha', 'md5', 'sha256', 'sha512', 'checksum', 'digest'],
    path: '/tools/hash-generator',
  },
] as const

export function getToolMeta(id: string): ToolMeta | undefined {
  return toolRegistry.find((t) => t.id === id)
}

export function getToolsByCategory(category: Category): readonly ToolMeta[] {
  return toolRegistry.filter((t) => t.category === category)
}
