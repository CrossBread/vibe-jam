# Vibe Games Starter — Full (TypeScript + Vite + Canvas) ✨

**Goals:** vibe-code small web games; auto-test and auto-deploy on every push; drive changes by natural language via the **Assistants-in-Action** workflow.

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

## Assistants-in-Action (no servers!)
The action **edits this repo via OpenAI** and commits directly to **master**.

### Setup
1) Repo secret: `OPENAI_API_KEY` (Settings → Secrets → Actions).  
2) (Optional) Label: create a label named `agent` for issues.

### Use it
- **Run workflow** (Actions → “Assistants in Action”) and paste your instruction, or
- Open an **Issue** with title containing `[agent]` (or add label `agent`) and put your instruction in the body. The action will:
  - inspect code,
  - modify files/tests,
  - commit to `master`,
  - Pages deploy will update your public site.

### Examples
- “Add right-paddle AI with reaction 0.2s and max speed 300; set win score to 15.”
- “Make the game slightly slower and swap the font to a monospace scoreboard.”

---

## Optional: GitHub App (for external services)
You **do not need** a GitHub App for this Actions-based flow. GHA’s built-in `GITHUB_TOKEN` plus your `OPENAI_API_KEY` is enough.

Create a GitHub App **only if** you want to control commits from outside Actions (e.g., a separate worker or server).

See `docs/SETUP_GITHUB_APP.md` for a minimal, safe configuration.
