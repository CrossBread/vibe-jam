# Minimal GitHub App Setup (optional)

You only need a GitHub App if you plan to make commits **outside** of GitHub Actions (e.g., from a custom server/worker). The **Assistants-in-Action** workflow in this repo does *not* require an App.

## Create the App
1. Go to **Settings → Developer settings → GitHub Apps → New GitHub App**.
2. **GitHub App name:** VibeAssistant (unique).
3. **Homepage URL:** your repo URL (e.g., https://github.com/<you>/<repo>).
4. **Callback URL:** *not required* unless you implement OAuth for user login. Leave blank.
5. **Webhook URL:** optional (only needed if your external service wants to receive GitHub events). You can leave blank.
6. **Webhook secret:** only if you set a Webhook URL.
7. **Permissions (Repository):**
   - **Contents: Read & Write**
   - **Issues: Read & Write** (only if you want to respond to issue events externally)
   - (Optional) **Pull requests: Read & Write**
   - **Metadata: Read**
8. **Subscribe to events (only if using webhooks):**
   - `issues` (if you want to trigger on issue instructions)
   - (Optional) `push`, `pull_request`
9. **Where can this GitHub App be installed?** — “Only on this account” is fine.
10. Click **Create GitHub App**.

## Install the App
- Click **Install App**, choose the target repo(s). The App’s installation will have access tokens for API calls.

## Generate credentials
- In the App page → **Private keys** → **Generate a private key** (download `.pem`).
- You’ll use the App ID + installation ID + private key to mint **installation access tokens** (JWT → installation token).

## Using it
- From your external service, exchange the App credentials for an **installation access token** and use it to call GitHub REST APIs (create blobs/trees/commits, or simple `contents` API).

> For the repo in this starter, prefer the built-in **GitHub Actions** flow (no app needed). The App is only for advanced, external automations.
