import manual from '../config/manual-pages.json'

/**
 * The user manual is a static PDF built by docs/manual/build.mjs, served from
 * the site itself (same origin: opening it sends nothing to a third party).
 * manual-pages.json maps each tool to the page that describes it.
 */
const pages: Record<string, number> = manual.tools

export function manualHref(): string {
  return manual.file
}

/** Link straight to a tool's page; PDF viewers honour #page=N. */
export function manualToolHref(toolId: string): string {
  const page = pages[toolId]
  return page ? `${manual.file}#page=${page}` : manual.file
}

export function manualToolPage(toolId: string): number | undefined {
  return pages[toolId]
}

export function manualSizeLabel(): string {
  const mb = manual.bytes / (1024 * 1024)
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`
}
