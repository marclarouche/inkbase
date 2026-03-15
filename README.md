# Inkbase

A personal writing repository with Git-style version control for articles. Think GitHub, but built for prose.

## What It Does

- **Library** — browse all published articles from your `privacy-articles` GitHub repo
- **Editor** — rich text markdown editor with live preview, saves as commits
- **Branches** — create draft branches, work on revisions without touching published content
- **Diff View** — side-by-side comparison of draft vs published before merging
- **Review Queue** — open pull requests, review diffs, merge to publish
- **Commit History** — full changelog per article, visible to readers

## Tech Stack

- React + Vite
- Octokit (GitHub API)
- react-markdown + remark-gfm
- @uiw/react-md-editor
- react-router-dom
- diff (for line-by-line diffing)

---

## Phase 1 Setup (Localhost)

### 1. Create your articles repo on GitHub

Create a new **public or private** GitHub repo named `privacy-articles`.

Initialize it with a README so it has a `main` branch.

### 2. Create a GitHub Personal Access Token

Go to: https://github.com/settings/tokens/new

- Note: `inkbase-local`
- Expiration: 90 days (or No expiration for personal use)
- Scopes: ✅ `repo` (full control)

Copy the token — you won't see it again.

### 3. Clone and configure this app

```bash
git clone https://github.com/marclarouche/inkbase.git
cd inkbase
npm install
cp .env.example .env
```

Edit `.env`:
```
VITE_GITHUB_TOKEN=ghp_your_token_here
VITE_GITHUB_OWNER=your_github_username
VITE_GITHUB_REPO=privacy-articles
```

### 4. Run it

```bash
npm run dev
```

Open http://localhost:5173

---

## Article Structure in `privacy-articles`

Each article is a folder with a single `index.md` file:

```
privacy-articles/
  ├── how-targeted-ads-track-you/
  │     └── index.md
  ├── vpn-myths/
  │     └── index.md
  └── ...
```

### Frontmatter format

Every `index.md` should start with:

```markdown
---
title: How Targeted Advertising Quietly Shares Your Location
description: What a New CBP Disclosure Reveals About the Hidden Surveillance Economy
date: 2026-03-08
tags: privacy, surveillance, ad-tech
---

# Your article content here...
```

---

## Workflow

### Writing a new article

1. Click **New Article** in the nav
2. Add a title — the slug is auto-generated
3. You land in the editor on `main`
4. Write, commit with a message, repeat

### Drafting a revision

1. Open any article → click **Edit**
2. In the editor, click **+** next to the branch selector
3. Name your branch (e.g. `draft/add-vpn-section`)
4. Make changes, commit to the draft branch
5. Click **View Diff →** to review changes
6. Click **Open Pull Request** in the diff view
7. Go to **Review Queue** → **Merge & Publish**

### Commit message conventions (optional)

```
init: Article Title          ← first creation
update: add new section      ← content additions  
fix: typo in intro           ← small corrections
restructure: reorder sections ← bigger changes
```

---

## Phase 2 — Netlify Deployment

1. Push this repo to GitHub
2. Connect to Netlify
3. Set environment variables in Netlify dashboard (same as `.env`)
4. Switch from PAT to GitHub OAuth (guide coming in Phase 2)
5. Add username gate in `App.jsx`

---

## Roadmap

- [x] Phase 1 — localhost prototype with PAT auth
- [ ] Phase 2 — Netlify deploy + GitHub OAuth + username gate
- [ ] Phase 3 — multi-user support + Cloudflare Access allowlist
- [ ] Reader-facing public view with visible changelog
- [ ] Article series / collections
- [ ] Export to PDF / HTML
