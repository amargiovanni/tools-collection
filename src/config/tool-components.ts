/**
 * Explicit mapping of tool IDs to their Solid component imports.
 * This avoids import.meta.glob issues with Astro's hydration.
 * When adding a new tool, add its import here.
 */

import ListGenerator from '../components/tools/ListGenerator'
import AddTextToLines from '../components/tools/AddTextToLines'
import ConvertCase from '../components/tools/ConvertCase'
import RemoveDuplicateLines from '../components/tools/RemoveDuplicateLines'
import RemoveLineBreaks from '../components/tools/RemoveLineBreaks'
import RemoveLinesContaining from '../components/tools/RemoveLinesContaining'
import PasswordGenerator from '../components/tools/PasswordGenerator'
import UsernameGenerator from '../components/tools/UsernameGenerator'
import PinGenerator from '../components/tools/PinGenerator'
import DomainExtractor from '../components/tools/DomainExtractor'
import EmailExtractor from '../components/tools/EmailExtractor'
import CountDuplicates from '../components/tools/CountDuplicates'
import PemInspector from '../components/tools/PemInspector'
import PasswordStrength from '../components/tools/PasswordStrength'
import QrCode from '../components/tools/QrCode'
import EmojiShortcode from '../components/tools/EmojiShortcode'
import Base64 from '../components/tools/Base64'
import UrlEncoder from '../components/tools/UrlEncoder'
import JsonFormatter from '../components/tools/JsonFormatter'
import DiffChecker from '../components/tools/DiffChecker'
import RegexTester from '../components/tools/RegexTester'
import XmlBeautifier from '../components/tools/XmlBeautifier'
import ColorPicker from '../components/tools/ColorPicker'
import TimestampConverter from '../components/tools/TimestampConverter'
import TimeConvert from '../components/tools/TimeConvert'
import Reg2Gpo from '../components/tools/Reg2Gpo'
import HashGenerator from '../components/tools/HashGenerator'

import type { Component } from 'solid-js'
import type { Language } from '../i18n'

type ToolComponent = Component<{ lang: Language }>

export const toolComponents: Record<string, ToolComponent> = {
  'list-generator': ListGenerator,
  'add-text-to-lines': AddTextToLines,
  'convert-case': ConvertCase,
  'remove-duplicate-lines': RemoveDuplicateLines,
  'remove-line-breaks': RemoveLineBreaks,
  'remove-lines-containing': RemoveLinesContaining,
  'password-generator': PasswordGenerator,
  'username-generator': UsernameGenerator,
  'pin-generator': PinGenerator,
  'domain-extractor': DomainExtractor,
  'email-extractor': EmailExtractor,
  'count-duplicates': CountDuplicates,
  'pem-inspector': PemInspector,
  'password-strength': PasswordStrength,
  'qr-code': QrCode,
  'emoji-shortcode': EmojiShortcode,
  'base64': Base64,
  'url-encoder': UrlEncoder,
  'json-formatter': JsonFormatter,
  'diff-checker': DiffChecker,
  'regex-tester': RegexTester,
  'xml-beautifier': XmlBeautifier,
  'color-picker': ColorPicker,
  'timestamp-converter': TimestampConverter,
  'time-convert': TimeConvert,
  'reg2gpo': Reg2Gpo,
  'hash-generator': HashGenerator,
}
