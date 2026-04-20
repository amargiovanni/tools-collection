import { generateRecoveryCodes } from './random-secrets'

export interface RecoveryCodeOptions {
  count: number
  length: number
  groupSize: number
}

export { generateRecoveryCodes }
