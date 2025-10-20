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

### Fun tuning simulations

The fun tuning utilities live in `src/game/funTuning`. A thin CLI wrapper is available so you can run mutation batches without wiring them into the main game loop.

1. Provide a headless simulator module that implements the `HeadlessMatchSimulator` contract. Export either:
   - a `createSimulator()` factory that returns the simulator instance, or
   - a named export called `simulator`, or
   - a default export that already implements `runMatch()`.

   A ready-to-use simulator that reuses the main Pong logic in headless mode is available at
   `src/game/funTuning/pongHeadlessSimulator.ts`. Point the CLI at this file to drive trials with the
   production modifiers and physics without rendering the UI.

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

### Fun tuning simulations

The fun tuning utilities live in `src/game/funTuning`. The CLI reuses the production Pong engine in headless mode so tuning runs exercise the same code used in-game.

1. Choose a simulator.
   - The built-in simulator at `src/game/funTuning/pongHeadlessSimulator.ts` drives matches with the shipping physics and modifiers while skipping UI work. This is the recommended option for most scenarios.
   - You can provide your own module that exports either a `createSimulator()` factory, a `simulator` value, or a default export with a `runMatch()` method.

2. Define the trials you want to run. A sample configuration is available at `docs/fun-tuning-sample.json` and demonstrates the expected shape:

```json
{
  "trials": [
    {
      "id": "baseline-black-hole",
      "mods": [
        {
          "modPath": "arena.blackHole",
          "parameters": {
            "gravityStrength": 750000,
            "radius": 280
          }
        }
      ],
      "repetitions": 10,
      "aiMisalignment": 0.6
    }
  ],
  "options": {
    "generations": 3,
    "mutationSurvivors": 2,
    "concurrency": 2,
    "scoreLimit": 11
  }
}
```

3. Install dependencies (`npm install`) and run the CLI. The npm script works cross-platform:

```bash
npm run fun-tuning -- \
  --simulator ./src/game/funTuning/pongHeadlessSimulator.ts \
  --trials ./docs/fun-tuning-sample.json \
  --concurrency 4 \
  --output ./reports/fun-tuning-report.json
```

PowerShell users can rely on line continuations instead:

```powershell
npm run fun-tuning -- `
  --simulator .\src\game\funTuning\pongHeadlessSimulator.ts `
  --trials .\docs\fun-tuning-sample.json `
  --concurrency 4 `
  --output .\reports\fun-tuning-report.json
```

If you prefer to call the entry point directly (useful when scripting custom tooling), invoke `tsx` explicitly:

```bash
npx tsx src/game/funTuning/runFunTuningCli.ts --simulator ./src/game/funTuning/pongHeadlessSimulator.ts --trials ./docs/fun-tuning-sample.json --concurrency 1 --output ./reports/fun-tuning-report.json
```

Create the `reports` folder first if it does not already exist: `New-Item -ItemType Directory -Path .\reports -Force`. The backtick (`) is PowerShell's line-continuation character.

CLI overrides (`--repetitions`, `--score-limit`, `--ai-misalignment`, `--generations`, `--mutation-survivors`, `--concurrency`, `--time-scale`)
replace the defaults from the trials file. The `--concurrency` flag controls how many matches run in parallel per trial; increase
it to take advantage of multicore machines when your simulator supports concurrent work. Use `--time-scale` to multiply the in-game clock when you want headless runs to simulate faster than real time—the built-in simulator automatically renormalizes all time-based metrics so reports stay comparable. The command prints a high-level summary
(best fun score and recommended config patch) and, if `--output` is provided, writes the full `FunTuningReport` JSON to disk.

### Fun fitness scoring

The fun tuning report includes an aggregate *fun fitness* score for each trial. The score is the simple average of six normalized components, so every factor carries equal weight:

- **Balance** rewards evenly matched rounds by scoring `1 - |roundWinRate - 0.5| * 2`.
- **Score gap** penalizes blowouts based on the largest lead observed relative to the score limit.
- **Round duration** prefers rallies that last between roughly 5 and 30 seconds—the median round length is scaled toward 1 inside that window and gradually falls off outside it.
- **Returns per round** encourages back-and-forth play by scaling the median rally length against eight returns.
- **Shot clock** measures how often a rally actually ends because the clock expires. A lower expiration rate means a higher contribution.
- **Direction changes** discourages excessive paddle thrashing by penalizing median combined direction changes above ten.

The headless simulator normalizes all time-based measurements using the active time scale, so durations, shot clock summaries, and return counts line up with real seconds even when you accelerate the simulation with `--time-scale`.

## Auto-deploy (GitHub Pages)
This repo includes a Pages workflow for branch **master**. On every push to `master`: test → build → deploy to Pages.

Enable:
- Repo → Settings → Pages → Source = GitHub Actions (no further config needed).

