import { generatePassphrases } from './random-secrets'

export interface PassphraseOptions {
  wordCount: number
  count: number
  separator: string
}

export { generatePassphrases }
