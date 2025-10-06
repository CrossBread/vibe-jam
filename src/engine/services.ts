// engine/services.ts
import { EventBus } from '../types/events'

export interface RNG { next(): number }
export interface Clock { now(): number }
export interface Physics {
  // pure helpers: sweep tests, bounce response, etc.
}
export interface Services {
  bus: EventBus;
  rng: RNG;
  clock: Clock;
  physics: Physics;
}
