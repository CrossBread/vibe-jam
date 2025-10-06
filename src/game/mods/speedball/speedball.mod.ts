// File: src/game/mods/speedball/speedball.mod.ts
// Example mutator: increases ball speed during update; teardown is automatic.
import type { BallMod, ModContext } from '../mod.types';
import { Phase } from '../../../engine/scheduler'

// Local component store types would live in this mod folder or shared components.
interface Velocity { x: number; y: number }
declare const VelocityStore: import('../mod.types').ComponentStore<Velocity>;

// Utility to iterate your ECS; adapt to your actual world API.
function forEachWith<T>(world: any, store: import('../mod.types').ComponentStore<T>, fn: (e: number, c: T) => void) {
  // Example shape; replace with your ECS query.
  const view = world.view(store);
  for (const e of view) fn(e, view.get(e));
}

const SpeedBall: BallMod = {
  id: 'mod.speedball',
  kind: 'ball',
  tags: ['mutator', 'speed'],
  enable(ctx: ModContext) {
    const factor = 1.25;

    ctx.registerSystem('update' satisfies Phase, (dt) => {
      // Scale velocity every frame in a controlled way.
      forEachWith(ctx as any, VelocityStore, (_e, vel) => {
        vel.x *= factor;
        vel.y *= factor;
      });
    }, /* order */ 10);
  }
};

export default SpeedBall;