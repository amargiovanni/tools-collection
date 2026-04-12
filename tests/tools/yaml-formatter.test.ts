import { describe, it, expect } from 'vitest'
import {
  formatYaml,
  validateYaml,
  minifyYaml,
  yamlToJson,
  jsonToYaml,
} from '../../src/tools/yaml-formatter'

describe('validateYaml', () => {
  it('returns error for empty input', () => {
    const result = validateYaml('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for whitespace-only input', () => {
    const result = validateYaml('   ')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns true for valid YAML mapping', () => {
    const result = validateYaml('name: John\nage: 30')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(true)
    }
  })

  it('returns true for valid YAML sequence', () => {
    const result = validateYaml('- apple\n- banana\n- cherry')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(true)
    }
  })
})

describe('formatYaml', () => {
  it('returns error for empty input', () => {
    const result = formatYaml('', 2)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('formats a simple mapping with 2-space indent', () => {
    const result = formatYaml('name: John\nage: 30', 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('name: John')
      expect(result.value).toContain('age: 30')
    }
  })

  it('formats nested objects with chosen indent', () => {
    const yaml = 'person:\n  name: John\n  age: 30'
    const result = formatYaml(yaml, 4)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('person:')
      expect(result.value).toContain('    name: John')
      expect(result.value).toContain('    age: 30')
    }
  })

  it('formats a sequence', () => {
    const yaml = '- apple\n- banana\n- cherry'
    const result = formatYaml(yaml, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('- apple')
      expect(result.value).toContain('- banana')
      expect(result.value).toContain('- cherry')
    }
  })

  it('handles booleans and null', () => {
    const yaml = 'enabled: true\ndisabled: false\nempty: null'
    const result = formatYaml(yaml, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('enabled: true')
      expect(result.value).toContain('disabled: false')
      expect(result.value).toContain('empty: null')
    }
  })

  it('handles numbers', () => {
    const yaml = 'count: 42\nprice: 9.99'
    const result = formatYaml(yaml, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('count: 42')
      expect(result.value).toContain('price: 9.99')
    }
  })

  it('preserves quoted strings', () => {
    const yaml = 'name: "true"'
    const result = formatYaml(yaml, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('"true"')
    }
  })

  it('handles comments by stripping them', () => {
    const yaml = 'name: John # this is a comment\nage: 30'
    const result = formatYaml(yaml, 2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('name: John')
      expect(result.value).not.toContain('#')
    }
  })
})

describe('minifyYaml', () => {
  it('returns error for empty input', () => {
    const result = minifyYaml('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('minifies a simple mapping', () => {
    const yaml = 'name: John\nage: 30'
    const result = minifyYaml(yaml)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('{name: "John", age: 30}')
    }
  })

  it('minifies a sequence', () => {
    const yaml = '- apple\n- banana'
    const result = minifyYaml(yaml)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('["apple", "banana"]')
    }
  })

  it('minifies nested structures', () => {
    const yaml = 'person:\n  name: John\n  age: 30'
    const result = minifyYaml(yaml)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('{person: {name: "John", age: 30}}')
    }
  })
})

describe('yamlToJson', () => {
  it('returns error for empty input', () => {
    const result = yamlToJson('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('converts a simple mapping to JSON', () => {
    const yaml = 'name: John\nage: 30'
    const result = yamlToJson(yaml)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed.name).toBe('John')
      expect(parsed.age).toBe(30)
    }
  })

  it('converts a sequence to JSON', () => {
    const yaml = '- apple\n- banana\n- cherry'
    const result = yamlToJson(yaml)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed).toEqual(['apple', 'banana', 'cherry'])
    }
  })

  it('converts nested structures to JSON', () => {
    const yaml = 'person:\n  name: John\n  hobbies:\n    - reading\n    - coding'
    const result = yamlToJson(yaml)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed.person.name).toBe('John')
      expect(parsed.person.hobbies).toEqual(['reading', 'coding'])
    }
  })

  it('handles booleans and null', () => {
    const yaml = 'active: true\ndeleted: false\nvalue: null'
    const result = yamlToJson(yaml)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.value)
      expect(parsed.active).toBe(true)
      expect(parsed.deleted).toBe(false)
      expect(parsed.value).toBe(null)
    }
  })
})

describe('jsonToYaml', () => {
  it('returns error for empty input', () => {
    const result = jsonToYaml('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_INPUT')
    }
  })

  it('returns error for invalid JSON', () => {
    const result = jsonToYaml('{invalid}')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_JSON')
    }
  })

  it('converts a simple JSON object to YAML', () => {
    const json = '{"name": "John", "age": 30}'
    const result = jsonToYaml(json)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('name: John')
      expect(result.value).toContain('age: 30')
    }
  })

  it('converts a JSON array to YAML', () => {
    const json = '["apple", "banana", "cherry"]'
    const result = jsonToYaml(json)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('- apple')
      expect(result.value).toContain('- banana')
      expect(result.value).toContain('- cherry')
    }
  })

  it('converts nested JSON to YAML', () => {
    const json = '{"person": {"name": "John", "age": 30}}'
    const result = jsonToYaml(json)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('person:')
      expect(result.value).toContain('name: John')
      expect(result.value).toContain('age: 30')
    }
  })

  it('handles booleans and null in JSON', () => {
    const json = '{"active": true, "deleted": false, "value": null}'
    const result = jsonToYaml(json)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('active: true')
      expect(result.value).toContain('deleted: false')
      expect(result.value).toContain('value: null')
    }
  })

  it('respects indent parameter', () => {
    const json = '{"person": {"name": "John"}}'
    const result = jsonToYaml(json, 4)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toContain('person:')
      expect(result.value).toContain('    name: John')
    }
  })
})
