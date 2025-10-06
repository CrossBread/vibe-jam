# NYGP - Not Your Grandaddy's Pong ✨
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

## Auto-deploy (GitHub Pages)
This repo includes a Pages workflow for branch **master**. On every push to `master`: test → build → deploy to Pages.

Enable:
- Repo → Settings → Pages → Source = GitHub Actions (no further config needed).

