# NYGP - Not Your Grandaddy's Video Tennis ✨
## Pong + Modes
## [Play the latest build in your browser](https://crossbread.github.io/vibe-jam/)

# Rules
1. Game ends when the last ball leaves play.
2. A ball leaves play when it crosses the left or right boundary of the arena.
3. The Loser is the player who failed to defend. (On the side of the arena the last ball hit.)
4. The Winner is the other player(s).

# Terms and Definitions
**Return** - When a paddle makes contact with a ball sending it back toward the other player
**Paddle** - An object the player controls in order to prevent the ball from crossing their goal zone
**Arena** - The play space which contains the player's paddles, one or more balls, solid walls at the top and bottom, and score zones each player must defend.
**Modifier** - An alteration to the vanilla pong ruleset.

## Local dev
```bash
npm i
npm run dev    # http://localhost:5173
npm run test   # unit
npm run test:e2e
```

### Fun tuning simulations

The fun tuning utilities live in `src/game/funTuning`. A thin CLI wrapper is available so you can run mutation batches without wiring them into the main game loop.

1. Provide a headless simulator module that implements the `HeadlessMatchSimulator` contract. Export either:
   - a `createSimulator()` factory that returns the simulator instance, or
   - a named export called `simulator`, or
   - a default export that already implements `runMatch()`.

2. Create a trial definition file (JSON). You can provide either an array of trials or an object that includes additional default options:

```json
{
  "trials": [
    {
      "id": "black-hole-baseline",
      "mods": [
        {
          "modPath": "arena.blackHole",
          "parameters": {
            "gravityStrength": 1000000,
            "radius": 320
          }
        }
      ],
      "repetitions": 5,
      "aiMisalignment": 0.6
    }
  ],
  "options": {
    "generations": 3,
    "mutationSurvivors": 2
  }
}
```

3. Run the CLI:

```bash
npm run fun-tuning -- \
  --simulator ./simulators/blackHoleSimulator.ts \
  --trials ./configs/black-hole-trials.json \
  --concurrency 4 \
  --output ./reports/black-hole-report.json
```

CLI overrides (`--repetitions`, `--score-limit`, `--ai-misalignment`, `--generations`, `--mutation-survivors`, `--concurrency`) replace the defaults from the trials file. The `--concurrency` flag controls how many matches run in parallel per trial; increase it to take advantage of multicore machines when your simulator supports concurrent work. The command prints a high-level summary (best fun score and recommended config patch) and, if `--output` is provided, writes the full `FunTuningReport` JSON to disk.

## Auto-deploy (GitHub Pages)
This repo includes a Pages workflow for branch **master**. On every push to `master`: test → build → deploy to Pages.

Enable:
- Repo → Settings → Pages → Source = GitHub Actions (no further config needed).

