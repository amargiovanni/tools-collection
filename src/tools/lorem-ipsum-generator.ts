import { ok, err } from '../lib/result'
import type { Result } from '../lib/result'

export type OutputType = 'paragraphs' | 'sentences' | 'words'

export interface LoremIpsumOptions {
  type: OutputType
  count: number
  startWithClassic: boolean
}

const CLASSIC_OPENING =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'

const WORD_BANK: readonly string[] = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et',
  'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis',
  'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex',
  'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur',
  'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt',
  'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est',
  'laborum', 'at', 'vero', 'eos', 'accusamus', 'iusto', 'odio', 'dignissimos',
  'ducimus', 'blanditiis', 'praesentium', 'voluptatum', 'deleniti', 'atque',
  'corrupti', 'quos', 'dolores', 'quas', 'molestias', 'excepturi',
  'occaecati', 'cupiditate', 'provident', 'similique', 'mollitia', 'animi',
  'perspiciatis', 'unde', 'omnis', 'iste', 'natus', 'error', 'voluptatem',
  'accusantium', 'doloremque', 'laudantium', 'totam', 'rem', 'aperiam',
  'eaque', 'ipsa', 'quae', 'ab', 'illo', 'inventore', 'veritatis', 'quasi',
  'architecto', 'beatae', 'vitae', 'dicta', 'explicabo', 'nemo', 'ipsam',
  'quia', 'voluptas', 'aspernatur', 'aut', 'odit', 'fugit', 'consequuntur',
  'magni', 'ratione', 'sequi', 'nesciunt', 'neque', 'porro', 'quisquam',
  'nihil', 'impedit', 'quo', 'minus', 'quod', 'maxime', 'placeat', 'facere',
  'possimus', 'assumenda', 'repellendus', 'temporibus', 'autem', 'quibusdam',
  'officiis', 'debitis', 'rerum', 'necessitatibus', 'saepe', 'eveniet',
  'voluptates', 'repudiandae', 'recusandae', 'itaque', 'earum', 'hic',
  'tenetur', 'sapiente', 'delectus', 'reiciendis', 'voluptatibus', 'maiores',
  'alias', 'perferendis', 'doloribus', 'asperiores', 'repellat',
  'nam', 'libero', 'tempore', 'cum', 'soluta', 'nobis', 'eligendi', 'optio',
  'cumque', 'impedimenta', 'distantio', 'praesent', 'finibus', 'fringilla',
  'interdum', 'posuere', 'cubilia', 'curae', 'morbi', 'tristique', 'senectus',
  'malesuada', 'fames', 'turpis', 'egestas', 'pellentesque', 'habitant',
  'facilisis', 'cras', 'elementum', 'viverra', 'maecenas', 'accumsan',
  'lacus', 'vel', 'tortor', 'cursus', 'risus', 'pretium', 'vulputate',
  'sapien', 'nec', 'sagittis', 'aliquam', 'metus', 'ultrices', 'semper',
  'fusce', 'justo', 'lacinia', 'augue', 'vestibulum', 'arcu', 'bibendum',
  'porta', 'nisl', 'tincidunt', 'congue', 'erat', 'varius',
  'leo', 'natoque', 'penatibus', 'magnis', 'dis', 'parturient', 'montes',
  'nascetur', 'ridiculus', 'mus', 'donec', 'suscipit', 'ante', 'primis',
  'faucibus', 'orci', 'luctus', 'ullamcorper', 'mattis', 'pulvinar', 'dapibus',
] as const

/**
 * Deterministic seeded PRNG (mulberry32) so tests are reproducible when needed,
 * but we default to a random seed for normal usage.
 */
function createRng(seed?: number): () => number {
  let s = seed ?? (Math.random() * 0xFFFFFFFF) >>> 0
  return () => {
    s |= 0
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }
}

function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function pickWord(rng: () => number): string {
  return WORD_BANK[randomInt(rng, 0, WORD_BANK.length - 1)]!
}

function generateSentence(rng: () => number): string {
  const wordCount = randomInt(rng, 8, 15)
  const words: string[] = []
  for (let i = 0; i < wordCount; i++) {
    words.push(pickWord(rng))
  }
  words[0] = capitalize(words[0]!)
  return words.join(' ') + '.'
}

function generateParagraph(rng: () => number): string {
  const sentenceCount = randomInt(rng, 4, 8)
  const sentences: string[] = []
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence(rng))
  }
  return sentences.join(' ')
}

export function generateLoremIpsum(options: LoremIpsumOptions, seed?: number): Result<string> {
  if (!Number.isFinite(options.count) || options.count < 1) {
    return err('INVALID_COUNT', 'Count must be a positive number')
  }

  const count = Math.max(1, Math.min(100, Math.floor(options.count)))

  const rng = createRng(seed)

  switch (options.type) {
    case 'paragraphs': {
      const paragraphs: string[] = []
      for (let i = 0; i < count; i++) {
        if (i === 0 && options.startWithClassic) {
          const restOfParagraph = generateParagraph(rng)
          paragraphs.push(CLASSIC_OPENING + ' ' + restOfParagraph)
        } else {
          paragraphs.push(generateParagraph(rng))
        }
      }
      return ok(paragraphs.join('\n\n'))
    }
    case 'sentences': {
      const sentences: string[] = []
      for (let i = 0; i < count; i++) {
        if (i === 0 && options.startWithClassic) {
          sentences.push(CLASSIC_OPENING)
        } else {
          sentences.push(generateSentence(rng))
        }
      }
      return ok(sentences.join(' '))
    }
    case 'words': {
      const words: string[] = []
      if (options.startWithClassic) {
        const classicWords = CLASSIC_OPENING.toLowerCase().replace(/[.,]/g, '').split(' ')
        for (let i = 0; i < Math.min(count, classicWords.length); i++) {
          words.push(classicWords[i]!)
        }
      }
      while (words.length < count) {
        words.push(pickWord(rng))
      }
      // Capitalize the first word
      if (words.length > 0) {
        words[0] = capitalize(words[0]!)
      }
      return ok(words.join(' '))
    }
    default:
      return err('INVALID_TYPE', 'Invalid output type')
  }
}
