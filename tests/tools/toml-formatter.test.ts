import { describe, it, expect } from 'vitest'
import {
  formatToml,
  validateToml,
  minifyTomlStr,
  tomlToJson,
  jsonToToml,
} from '../../src/tools/toml-formatter'

describe('formatToml', () => {
  it('returns error for empty input', () => {
    const result = formatToml('', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for whitespace-only input', () => {
    const result = formatToml('   ', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for invalid TOML', () => {
    const result = formatToml('= invalid', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TOML')
      expect(result.error.message).toContain('Line')
    }
  })

  it('formats simple key-value pairs', () => {
    const input = 'name = "test"\nvalue = 42'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('name = "test"')
      expect(result.value).toContain('value = 42')
    }
  })

  it('formats sections', () => {
    const input = '[server]\nhost = "localhost"\nport = 8080'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('[server]')
      expect(result.value).toContain('host = "localhost"')
      expect(result.value).toContain('port = 8080')
    }
  })

  it('formats nested sections', () => {
    const input = '[database]\nhost = "localhost"\n\n[database.pool]\nmax = 10'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('[database]')
      expect(result.value).toContain('[database.pool]')
    }
  })

  it('formats array of tables', () => {
    const input = '[[products]]\nname = "Hammer"\n\n[[products]]\nname = "Nail"'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('[[products]]')
      expect(result.value).toContain('name = "Hammer"')
      expect(result.value).toContain('name = "Nail"')
    }
  })

  it('handles boolean values', () => {
    const input = 'enabled = true\ndisabled = false'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('enabled = true')
      expect(result.value).toContain('disabled = false')
    }
  })

  it('handles arrays', () => {
    const input = 'colors = ["red", "green", "blue"]'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('colors = ["red", "green", "blue"]')
    }
  })

  it('handles inline tables', () => {
    const input = 'point = {x = 1, y = 2}'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      // Inline tables are expanded to sections when formatted
      expect(result.value).toContain('[point]')
      expect(result.value).toContain('x = 1')
      expect(result.value).toContain('y = 2')
    }
  })

  it('handles comments by stripping them during formatting', () => {
    const input = '# This is a comment\nname = "test" # inline comment'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('name = "test"')
    }
  })

  it('handles dotted keys', () => {
    const input = 'a.b.c = 42'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
  })

  it('handles float values', () => {
    const input = 'pi = 3.14\nneg = -0.01\nexp = 5e+22'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('pi = 3.14')
    }
  })

  it('handles special float values', () => {
    const input = 'sf1 = inf\nsf2 = nan'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('sf1 = inf')
      expect(result.value).toContain('sf2 = nan')
    }
  })

  it('handles dates', () => {
    const input = 'date = 2024-01-15'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('date = 2024-01-15')
    }
  })

  it('handles datetime with timezone', () => {
    const input = 'dt = 2024-01-15T10:30:00Z'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('dt = 2024-01-15T10:30:00Z')
    }
  })

  it('handles escape sequences in strings', () => {
    const input = 'path = "C:\\\\Users\\\\test"'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('path = "C:\\\\Users\\\\test"')
    }
  })

  it('handles literal strings', () => {
    const input = "path = 'C:\\Users\\test'"
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
  })

  it('handles quoted keys', () => {
    const input = '"my key" = "value"'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('"my key" = "value"')
    }
  })

  it('handles hex integers', () => {
    const input = 'hex = 0xDEAD_BEEF'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('hex = 3735928559')
    }
  })

  it('handles octal integers', () => {
    const input = 'oct = 0o755'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('oct = 493')
    }
  })

  it('handles binary integers', () => {
    const input = 'bin = 0b11010110'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('bin = 214')
    }
  })

  it('reports duplicate key errors', () => {
    const input = 'name = "first"\nname = "second"'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TOML')
      expect(result.error.message).toContain('Duplicate key')
    }
  })
})

describe('validateToml', () => {
  it('returns error for empty input', () => {
    const result = validateToml('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns true for valid TOML', () => {
    const result = validateToml('key = "value"')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(true)
    }
  })

  it('returns error for invalid TOML', () => {
    const result = validateToml('= no key')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TOML')
    }
  })

  it('validates complex TOML', () => {
    const input = `
[package]
name = "my-app"
version = "0.1.0"

[dependencies]
serde = {version = "1.0", features = ["derive"]}

[[bin]]
name = "main"
path = "src/main.rs"
`
    const result = validateToml(input)
    expect(result.ok).toBe(true)
  })
})

describe('minifyTomlStr', () => {
  it('returns error for empty input', () => {
    const result = minifyTomlStr('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('removes comments', () => {
    const input = '# Comment\nname = "test" # inline'
    const result = minifyTomlStr(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).not.toContain('#')
    }
  })

  it('removes empty lines', () => {
    const input = 'a = 1\n\n\nb = 2\n'
    const result = minifyTomlStr(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).not.toContain('\n\n')
    }
  })

  it('preserves key-value pairs', () => {
    const input = '[server]\n# Server host\nhost = "localhost"\nport = 8080\n'
    const result = minifyTomlStr(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('[server]')
      expect(result.value).toContain('host = "localhost"')
      expect(result.value).toContain('port = 8080')
      expect(result.value).not.toContain('# Server host')
    }
  })

  it('returns error for invalid TOML', () => {
    const result = minifyTomlStr('= bad')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TOML')
    }
  })
})

describe('tomlToJson', () => {
  it('returns error for empty input', () => {
    const result = tomlToJson('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('converts simple key-value pairs', () => {
    const input = 'name = "test"\ncount = 42\nenabled = true'
    const result = tomlToJson(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed.name).toBe('test')
      expect(parsed.count).toBe(42)
      expect(parsed.enabled).toBe(true)
    }
  })

  it('converts sections to nested objects', () => {
    const input = '[database]\nhost = "localhost"\nport = 5432'
    const result = tomlToJson(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed.database.host).toBe('localhost')
      expect(parsed.database.port).toBe(5432)
    }
  })

  it('respects the indent parameter', () => {
    const input = '[database]\nhost = "localhost"'
    const result = tomlToJson(input, 4)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('\n    "host": "localhost"')
    }
  })

  it('converts arrays', () => {
    const input = 'tags = ["web", "api", "rest"]'
    const result = tomlToJson(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed.tags).toEqual(['web', 'api', 'rest'])
    }
  })

  it('converts array of tables', () => {
    const input = '[[products]]\nname = "A"\n\n[[products]]\nname = "B"'
    const result = tomlToJson(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed.products).toHaveLength(2)
      expect(parsed.products[0].name).toBe('A')
      expect(parsed.products[1].name).toBe('B')
    }
  })

  it('converts dates as strings', () => {
    const input = 'date = 2024-01-15'
    const result = tomlToJson(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed.date).toBe('2024-01-15')
    }
  })

  it('returns error for invalid TOML', () => {
    const result = tomlToJson('[unclosed')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TOML')
    }
  })
})

describe('jsonToToml', () => {
  it('returns error for empty input', () => {
    const result = jsonToToml('', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('converts simple JSON object', () => {
    const input = '{"name": "test", "count": 42}'
    const result = jsonToToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('name = "test"')
      expect(result.value).toContain('count = 42')
    }
  })

  it('converts nested JSON objects to TOML sections', () => {
    const input = '{"server": {"host": "localhost", "port": 8080}}'
    const result = jsonToToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('[server]')
      expect(result.value).toContain('host = "localhost"')
      expect(result.value).toContain('port = 8080')
    }
  })

  it('converts arrays', () => {
    const input = '{"tags": ["a", "b"]}'
    const result = jsonToToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('tags = ["a", "b"]')
    }
  })

  it('converts arrays of objects to array of tables', () => {
    const input = '{"items": [{"name": "A"}, {"name": "B"}]}'
    const result = jsonToToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('[[items]]')
      expect(result.value).toContain('name = "A"')
      expect(result.value).toContain('name = "B"')
    }
  })

  it('returns error for JSON arrays at root', () => {
    const result = jsonToToml('[1, 2, 3]', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_JSON')
    }
  })

  it('returns error for invalid JSON', () => {
    const result = jsonToToml('{bad json}', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_JSON')
    }
  })

  it('returns error for JSON with null values', () => {
    const result = jsonToToml('{"key": null}', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_JSON')
    }
  })

  it('handles boolean JSON values', () => {
    const input = '{"enabled": true, "disabled": false}'
    const result = jsonToToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('enabled = true')
      expect(result.value).toContain('disabled = false')
    }
  })
})

describe('multiline strings', () => {
  it('handles multiline basic strings spanning multiple lines', () => {
    const input = 'desc = """\nHello\nWorld"""'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('desc = "Hello\\nWorld"')
    }
  })

  it('handles multiline basic strings on same line', () => {
    const input = 'desc = """Hello World"""'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('desc = "Hello World"')
    }
  })

  it('handles multiline literal strings spanning multiple lines', () => {
    const input = "desc2 = '''\nHello\nWorld'''"
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('desc2 = "Hello\\nWorld"')
    }
  })

  it('handles multiline literal strings on same line', () => {
    const input = "desc2 = '''Hello World'''"
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('desc2 = "Hello World"')
    }
  })

  it('converts multiline basic strings to JSON', () => {
    const input = 'desc = """\nHello\nWorld"""'
    const result = tomlToJson(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed.desc).toBe('Hello\nWorld')
    }
  })

  it('converts multiline literal strings to JSON', () => {
    const input = "desc = '''\nHello\nWorld'''"
    const result = tomlToJson(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed.desc).toBe('Hello\nWorld')
    }
  })
})

describe('multi-line arrays', () => {
  it('handles arrays spanning multiple lines', () => {
    const input = 'colors = [\n  "red",\n  "green",\n  "blue"\n]'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('colors = ["red", "green", "blue"]')
    }
  })

  it('converts multi-line arrays to JSON', () => {
    const input = 'colors = [\n  "red",\n  "green",\n  "blue"\n]'
    const result = tomlToJson(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed.colors).toEqual(['red', 'green', 'blue'])
    }
  })

  it('handles multi-line arrays with trailing comma', () => {
    const input = 'colors = [\n  "red",\n  "green",\n  "blue",\n]'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('colors = ["red", "green", "blue"]')
    }
  })
})

describe('duplicate table headers', () => {
  it('rejects duplicate table headers', () => {
    const input = '[a]\nk = 1\n[a]\nk2 = 2'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TOML')
      expect(result.error.message).toContain('Duplicate table header')
    }
  })

  it('allows different table headers', () => {
    const input = '[a]\nk = 1\n[b]\nk = 2'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
  })
})

describe('TOML spec compliance - integer prefixes', () => {
  it('accepts lowercase hex prefix 0x', () => {
    const input = 'val = 0xFF'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('val = 255')
    }
  })

  it('rejects uppercase hex prefix 0X', () => {
    const input = 'val = 0XFF'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TOML')
      expect(result.error.message).toContain('0X')
    }
  })

  it('rejects uppercase octal prefix 0O', () => {
    const input = 'val = 0O755'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TOML')
      expect(result.error.message).toContain('0O')
    }
  })

  it('rejects uppercase binary prefix 0B', () => {
    const input = 'val = 0B1010'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TOML')
      expect(result.error.message).toContain('0B')
    }
  })
})

describe('TOML spec compliance - leading zeros', () => {
  it('rejects leading zeros on decimal integers', () => {
    const input = 'val = 0123'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TOML')
      expect(result.error.message).toContain('Leading zeros')
    }
  })

  it('accepts plain zero', () => {
    const input = 'val = 0'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('val = 0')
    }
  })

  it('accepts negative numbers without leading zeros', () => {
    const input = 'val = -42'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('val = -42')
    }
  })
})

describe('roundtrip conversion', () => {
  it('roundtrips TOML -> JSON -> TOML', () => {
    const input = '[server]\nhost = "localhost"\nport = 8080\nenabled = true'
    const jsonResult = tomlToJson(input)
    expect(jsonResult.ok).toBe(true)
    if (jsonResult.ok) {
      const tomlResult = jsonToToml(jsonResult.value, 2)
      expect(tomlResult.ok).toBe(true)
      if (tomlResult.ok) {
        expect(tomlResult.value).toContain('[server]')
        expect(tomlResult.value).toContain('host = "localhost"')
        expect(tomlResult.value).toContain('port = 8080')
        expect(tomlResult.value).toContain('enabled = true')
      }
    }
  })
})

describe('special float values', () => {
  it('handles +inf', () => {
    const input = 'val = +inf'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('val = inf')
    }
  })

  it('handles -inf', () => {
    const input = 'val = -inf'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('val = -inf')
    }
  })

  it('handles nan', () => {
    const input = 'val = nan'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('val = nan')
    }
  })

  it('handles +nan', () => {
    const input = 'val = +nan'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('val = nan')
    }
  })

  it('handles -nan', () => {
    const input = 'val = -nan'
    const result = formatToml(input, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('val = nan')
    }
  })

  it('converts inf to JSON', () => {
    const input = 'val = inf'
    const result = tomlToJson(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      // JSON doesn't support Infinity, so it becomes null
      const parsed = JSON.parse(result.value)
      expect(parsed.val).toBe(null)
    }
  })

  it('converts nan to JSON', () => {
    const input = 'val = nan'
    const result = tomlToJson(input)
    expect(result.ok).toBe(true)
    if (result.ok) {
      // JSON doesn't support NaN, so it becomes null
      const parsed = JSON.parse(result.value)
      expect(parsed.val).toBe(null)
    }
  })
})
