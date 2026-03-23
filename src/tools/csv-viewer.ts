export type CsvParseResult = {
  headers: string[]
  rows: string[][]
  rowCount: number
}

export type CsvResult = ({ ok: true } & CsvParseResult) | { ok: false; error: string }

function detectDelimiter(firstLine: string): string {
  const counts: [string, number][] = [
    [',',  (firstLine.match(/,/g)  ?? []).length],
    [';',  (firstLine.match(/;/g)  ?? []).length],
    ['\t', (firstLine.match(/\t/g) ?? []).length],
    ['|',  (firstLine.match(/\|/g) ?? []).length],
  ]
  counts.sort((a, b) => b[1] - a[1])
  return counts[0]![0]
}

function parseLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells
}

export function parseCsv(input: string): CsvResult {
  const text = input.trim()
  if (!text) return { ok: false, error: 'Empty input' }

  const firstNewlineIdx = text.indexOf('\n')
  const firstLine = firstNewlineIdx === -1 ? text : text.slice(0, firstNewlineIdx)
  const delimiter = detectDelimiter(firstLine)

  // Character-by-character scan so quoted fields containing newlines are handled correctly
  const rows: string[][] = []
  let cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current)
      current = ''
    } else if (ch === '\r' && !inQuotes) {
      if (text[i + 1] === '\n') i++
      cells.push(current)
      current = ''
      if (cells.some((c) => c.trim() !== '')) rows.push(cells)
      cells = []
    } else if (ch === '\n' && !inQuotes) {
      cells.push(current)
      current = ''
      if (cells.some((c) => c.trim() !== '')) rows.push(cells)
      cells = []
    } else {
      current += ch
    }
  }

  cells.push(current)
  if (cells.some((c) => c.trim() !== '')) rows.push(cells)

  if (rows.length < 1) return { ok: false, error: 'No data found' }

  const headers = rows[0]!
  if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
    return { ok: false, error: 'Could not detect columns' }
  }

  const dataRows = rows.slice(1).map((rowCells) => {
    while (rowCells.length < headers.length) rowCells.push('')
    return rowCells.slice(0, headers.length) as string[]
  })

  return { ok: true, headers, rows: dataRows, rowCount: dataRows.length }
}

export type SortDirection = 'asc' | 'desc' | null

export function sortRows(
  rows: string[][],
  colIndex: number,
  direction: SortDirection,
): string[][] {
  if (direction === null) return rows
  return [...rows].sort((a, b) => {
    const av = a[colIndex] ?? ''
    const bv = b[colIndex] ?? ''
    const numA = parseFloat(av)
    const numB = parseFloat(bv)
    const isNumeric = !isNaN(numA) && !isNaN(numB)
    const cmp = isNumeric ? numA - numB : av.localeCompare(bv)
    return direction === 'asc' ? cmp : -cmp
  })
}
