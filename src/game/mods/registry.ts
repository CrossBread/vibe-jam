import type { GameMod } from './mod.types'

type GlobFn = (pattern: string | string[], options?: unknown) => Record<string, unknown>

let manualRegistry: GameMod[] | undefined

function discoverWithBundler(): GameMod[] {
  const glob = (import.meta as ImportMeta & { glob?: GlobFn }).glob
  if (!glob) {
    return []
  }

  const modules = glob('./**/*.mod.ts', {
    eager: true,
    import: 'default',
  }) as Record<string, GameMod>

  return Object.values(modules)
}

function discoverMods(): GameMod[] {
  if (manualRegistry) {
    return manualRegistry.slice()
  }

  return discoverWithBundler()
}

function sortMods(mods: GameMod[]): GameMod[] {
  return mods.slice().sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0)
    if (orderDiff !== 0) return orderDiff
    return a.id.localeCompare(b.id)
  })
}

export function getAllMods(): GameMod[] {
  return sortMods(discoverMods())
}

export function setManualModRegistry(mods: GameMod[]): void {
  manualRegistry = mods.slice()
}
