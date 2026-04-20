import { generateRandomStrings } from './random-secrets'

export interface RandomStringOptions {
  length: number
  count: number
  alphabet: string
}

export { generateRandomStrings }
