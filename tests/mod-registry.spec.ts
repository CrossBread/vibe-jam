import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')
const modsRoot = join(projectRoot, 'src', 'game', 'mods')

function getModFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getModFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.mod.ts')) {
      files.push(fullPath)
    }
  }
  return files
}

function hashFile(relativePath: string): string {
  const content = readFileSync(join(projectRoot, relativePath), 'utf8')
  return createHash('sha256').update(content).digest('hex')
}

describe('mod metadata integrity', () => {
  it('has unique mod ids', async () => {
    const seen = new Map<string, string[]>()

    for (const modFile of getModFiles(modsRoot)) {
      const module = await import(pathToFileURL(modFile).href)
      const mod = module.default
      if (!mod || typeof mod !== 'object') {
        throw new Error(`Mod at ${modFile} does not have a default export`)
      }
      if (typeof mod.id !== 'string' || mod.id.length === 0) {
        throw new Error(`Mod at ${modFile} is missing an id`)
      }

      const relative = modFile.slice(projectRoot.length + 1)
      const list = seen.get(mod.id) ?? []
      list.push(relative)
      seen.set(mod.id, list)
    }

    const duplicates = [...seen.entries()].filter(([, files]) => files.length > 1)
    if (duplicates.length > 0) {
      const message = duplicates
        .map(([id, files]) => `${id}:\n  - ${files.join('\n  - ')}`)
        .join('\n')
      throw new Error(`Duplicate mod ids detected:\n${message}`)
    }
  })

  it('locks central registry files', () => {
    const expectedHashes: Record<string, string> = {
      'src/game/mods/registry.ts': '0fba63c1c50b53faaeff0371d75f74ad2843d84b86dc36f1cab77da480e2ce3b',
      'src/game/mods/manager.ts': '67d029200366cab0ecf22c81eb05bfb855d69f1bb90681d762d844ce17c10c1e'
    }

    for (const [relativePath, expectedHash] of Object.entries(expectedHashes)) {
      expect(hashFile(relativePath)).toBe(expectedHash)
    }
  })
})
