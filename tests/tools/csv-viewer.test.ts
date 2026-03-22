import { describe, it, expect } from 'vitest'
import { parseCsv, sortRows } from '../../src/tools/csv-viewer'

describe('parseCsv', () => {
  it('parses a simple comma-separated CSV', () => {
    const result = parseCsv('name,age,city\nAlice,30,Rome\nBob,25,Milan')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.headers).toEqual(['name', 'age', 'city'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]!).toEqual(['Alice', '30', 'Rome'])
    expect(result.rowCount).toBe(2)
  })

  it('detects semicolon delimiter', () => {
    const result = parseCsv('a;b;c\n1;2;3')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.headers).toEqual(['a', 'b', 'c'])
    expect(result.rows[0]!).toEqual(['1', '2', '3'])
  })

  it('detects tab delimiter', () => {
    const result = parseCsv('a\tb\tc\n1\t2\t3')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.headers).toEqual(['a', 'b', 'c'])
  })

  it('handles quoted fields containing the delimiter', () => {
    const result = parseCsv('name,desc\nAlice,"hello, world"')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows[0]!).toEqual(['Alice', 'hello, world'])
  })

  it('handles escaped double quotes inside quoted fields', () => {
    const result = parseCsv('name,quote\nAlice,"say ""hi"""')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows[0]![1]).toBe('say "hi"')
  })

  it('pads short rows to match header length', () => {
    const result = parseCsv('a,b,c\n1,2')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows[0]!).toEqual(['1', '2', ''])
  })

  it('returns error for empty input', () => {
    expect(parseCsv('').ok).toBe(false)
    expect(parseCsv('   ').ok).toBe(false)
  })
})

describe('sortRows', () => {
  const rows = [['Charlie', '30'], ['Alice', '25'], ['Bob', '35']]

  it('sorts alphabetically ascending', () => {
    const sorted = sortRows(rows, 0, 'asc')
    expect(sorted.map((r) => r[0])).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('sorts alphabetically descending', () => {
    const sorted = sortRows(rows, 0, 'desc')
    expect(sorted.map((r) => r[0])).toEqual(['Charlie', 'Bob', 'Alice'])
  })

  it('sorts numerically when values are numbers', () => {
    const sorted = sortRows(rows, 1, 'asc')
    expect(sorted.map((r) => r[1])).toEqual(['25', '30', '35'])
  })

  it('returns original order when direction is null', () => {
    const sorted = sortRows(rows, 0, null)
    expect(sorted).toEqual(rows)
  })

  it('does not mutate the original array', () => {
    const original = [...rows]
    sortRows(rows, 0, 'asc')
    expect(rows).toEqual(original)
  })
})
