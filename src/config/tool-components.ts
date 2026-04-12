/**
 * Lazy mapping of tool IDs to their Solid component imports.
 * Each tool is loaded on demand via dynamic import() for code splitting.
 * When adding a new tool, add its lazy import here.
 */

import { lazy } from 'solid-js'
import type { Component } from 'solid-js'
import type { Language } from '../i18n'

type ToolComponent = Component<{ lang: Language }>

export const toolComponents: Record<string, ToolComponent> = {
  'list-generator': lazy(() => import('../components/tools/ListGenerator')),
  'add-text-to-lines': lazy(() => import('../components/tools/AddTextToLines')),
  'convert-case': lazy(() => import('../components/tools/ConvertCase')),
  'remove-duplicate-lines': lazy(() => import('../components/tools/RemoveDuplicateLines')),
  'remove-line-breaks': lazy(() => import('../components/tools/RemoveLineBreaks')),
  'remove-lines-containing': lazy(() => import('../components/tools/RemoveLinesContaining')),
  'password-generator': lazy(() => import('../components/tools/PasswordGenerator')),
  'username-generator': lazy(() => import('../components/tools/UsernameGenerator')),
  'pin-generator': lazy(() => import('../components/tools/PinGenerator')),
  'bittorrent-magnet-link-generator': lazy(() => import('../components/tools/BittorrentMagnetLinkGenerator')),
  'domain-extractor': lazy(() => import('../components/tools/DomainExtractor')),
  'email-extractor': lazy(() => import('../components/tools/EmailExtractor')),
  'count-duplicates': lazy(() => import('../components/tools/CountDuplicates')),
  'text-counter': lazy(() => import('../components/tools/TextCounter')),
  'pem-inspector': lazy(() => import('../components/tools/PemInspector')),
  'rclone-password': lazy(() => import('../components/tools/RclonePassword')),
  'password-strength': lazy(() => import('../components/tools/PasswordStrength')),
  'qr-code': lazy(() => import('../components/tools/QrCode')),
  'emoji-shortcode': lazy(() => import('../components/tools/EmojiShortcode')),
  'base64': lazy(() => import('../components/tools/Base64')),
  'url-encoder': lazy(() => import('../components/tools/UrlEncoder')),
  'data-size-converter': lazy(() => import('../components/tools/DataSizeConverter')),
  'json-formatter': lazy(() => import('../components/tools/JsonFormatter')),
  'diff-checker': lazy(() => import('../components/tools/DiffChecker')),
  'regex-tester': lazy(() => import('../components/tools/RegexTester')),
  'xml-beautifier': lazy(() => import('../components/tools/XmlBeautifier')),
  'cron-expression': lazy(() => import('../components/tools/CronExpression')),
  'color-picker': lazy(() => import('../components/tools/ColorPicker')),
  'timestamp-converter': lazy(() => import('../components/tools/TimestampConverter')),
  'time-convert': lazy(() => import('../components/tools/TimeConvert')),
  'reg2gpo': lazy(() => import('../components/tools/Reg2Gpo')),
  'hash-generator': lazy(() => import('../components/tools/HashGenerator')),
  'jwt-decoder': lazy(() => import('../components/tools/JwtDecoder')),
  'uuid-generator': lazy(() => import('../components/tools/UuidGenerator')),
  'number-base-converter': lazy(() => import('../components/tools/NumberBaseConverter')),
  'csv-viewer': lazy(() => import('../components/tools/CsvViewer')),
  'yaml-formatter': lazy(() => import('../components/tools/YamlFormatter')),
}
