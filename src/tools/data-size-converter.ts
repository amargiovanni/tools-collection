import { err, ok } from '../lib/result'
import type { Result } from '../lib/result'

export type DataSizeUnit =
  | 'b'
  | 'B'
  | 'KB'
  | 'MB'
  | 'GB'
  | 'TB'
  | 'KiB'
  | 'MiB'
  | 'GiB'
  | 'TiB'

export interface DataSizeResult {
  b: number
  B: number
  KB: number
  MB: number
  GB: number
  TB: number
  KiB: number
  MiB: number
  GiB: number
  TiB: number
}

const bytesPerUnit: Record<DataSizeUnit, number> = {
  b: 1 / 8,
  B: 1,
  // In this project KB/MB/GB/TB follow the common IT interpretation (base 1024).
  KB: 1_024,
  MB: 1_048_576,
  GB: 1_073_741_824,
  TB: 1_099_511_627_776,
  KiB: 1_024,
  MiB: 1_048_576,
  GiB: 1_073_741_824,
  TiB: 1_099_511_627_776,
}

export function formatDataSize(value: number): string {
  if (!Number.isFinite(value)) return ''
  return Number.isInteger(value) ? `${value}` : value.toFixed(10).replace(/\.?0+$/, '')
}

export function convertDataSize(value: number, fromUnit: DataSizeUnit): Result<DataSizeResult> {
  if (!Number.isFinite(value) || value < 0) {
    return err('INVALID_SIZE_VALUE', 'Enter a valid non-negative data size value')
  }

  const bytes = value * bytesPerUnit[fromUnit]

  return ok({
    b: bytes * 8,
    B: bytes,
    KB: bytes / bytesPerUnit.KB,
    MB: bytes / bytesPerUnit.MB,
    GB: bytes / bytesPerUnit.GB,
    TB: bytes / bytesPerUnit.TB,
    KiB: bytes / bytesPerUnit.KiB,
    MiB: bytes / bytesPerUnit.MiB,
    GiB: bytes / bytesPerUnit.GiB,
    TiB: bytes / bytesPerUnit.TiB,
  })
}
