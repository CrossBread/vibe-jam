import type { ComponentStore } from './mods/mod.types'

export interface World {
  createEntity(): number
  destroyEntity(id: number): void
  addComponent<T>(id: number, store: ComponentStore<T>, data: T): void
}

export function createWorld(): World {
  let nextEntityId = 1
  const entities = new Set<number>()
  const components = new Map<ComponentStore<any>, Map<number, any>>()

  function ensureStore<T>(store: ComponentStore<T>): Map<number, T> {
    let map = components.get(store)
    if (!map) {
      map = new Map<number, T>()
      components.set(store, map as Map<number, any>)
    }
    return map as Map<number, T>
  }

  return {
    createEntity() {
      const id = nextEntityId++
      entities.add(id)
      return id
    },
    destroyEntity(id) {
      if (!entities.has(id)) return
      entities.delete(id)
      for (const store of components.values()) {
        store.delete(id)
      }
    },
    addComponent(id, store, data) {
      if (!entities.has(id)) {
        entities.add(id)
      }
      const map = ensureStore(store)
      map.set(id, data)
    }
  }
}
