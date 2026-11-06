import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(HERE, '../..')
export const PDF_NAME = 'tools-collection-manual.pdf'

/** Registry, categories and icons come straight from the site's sources. */
export async function loadCatalogue() {
  const { toolRegistry, categories } = await import(pathToFileURL(join(ROOT, 'src/config/tools.ts')).href)
  const icons = await import(pathToFileURL(join(ROOT, 'src/lib/icons.ts')).href)
  const en = JSON.parse(await readFile(join(ROOT, 'src/i18n/messages/en.json'), 'utf8'))
  const content = JSON.parse(await readFile(join(HERE, 'content.json'), 'utf8'))
  const camel = (id) => id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const tools = toolRegistry.map((t) => ({
    ...t,
    name: en[`tools_${camel(t.id)}_name`],
    description: en[`tools_${camel(t.id)}_description`],
    use: content.tools[t.id]?.use,
    icon: icons.toolIconSvg(t.id, 'ico'),
  }))
  return { tools, categories, en, content, icons }
}

