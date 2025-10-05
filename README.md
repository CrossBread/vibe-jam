# Vibe Games Starter (TypeScript + Vite + Canvas)

Zero-backend, auto-deployable web games with CI tests. Start with Pong, scale up later.

## Quick start (local)
```bash
npm i
npm run dev
```

## Tests
```bash
npm run test       # unit
npm run test:e2e   # e2e (starts preview server)
```

## Deployment (GitHub Pages)
This repo includes a GitHub Actions workflow that:
- installs deps
- runs unit + e2e tests (headless Playwright)
- builds the site
- deploys to GitHub Pages on push to `main`

Enable Actions & Pages, then push. Your game will be at:
`https://<your-username>.github.io/<repo-name>/`

## Cloudflare Pages (optional)
Instead of GitHub Pages, connect the repo in Cloudflare Pages and set:
- Build command: `npm run build`
- Build output directory: `dist`

CF Pages will auto-build on every push and give you preview URLs per PR.
