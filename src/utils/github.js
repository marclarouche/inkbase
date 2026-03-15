import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN,
})

const OWNER = import.meta.env.VITE_GITHUB_OWNER
const REPO  = import.meta.env.VITE_GITHUB_REPO

// ─── In-memory cache ─────────────────────────────────────────────────────────
// Keyed by a string, each entry is { value, expiresAt }.
// TTL is 60s for most reads. Write operations invalidate relevant keys.

const TTL = 60_000 // 60 seconds

const cache = {
  _store: new Map(),

  get(key) {
    const entry = this._store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key)
      return null
    }
    return entry.value
  },

  set(key, value) {
    this._store.set(key, { value, expiresAt: Date.now() + TTL })
  },

  // Invalidate all keys that start with a given prefix
  invalidate(prefix) {
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) this._store.delete(key)
    }
  },

  // Wipe everything — used after writes that affect multiple keys
  clear() {
    this._store.clear()
  },
}

// ─── Branches ────────────────────────────────────────────────────────────────

export async function listBranches() {
  const key = 'branches'
  const hit = cache.get(key)
  if (hit) return hit

  const { data } = await octokit.repos.listBranches({ owner: OWNER, repo: REPO })
  const result = data.map(b => b.name)
  cache.set(key, result)
  return result
}

export async function createBranch(branchName, fromBranch = 'main') {
  const { data: ref } = await octokit.git.getRef({
    owner: OWNER, repo: REPO,
    ref: `heads/${fromBranch}`,
  })
  await octokit.git.createRef({
    owner: OWNER, repo: REPO,
    ref: `refs/heads/${branchName}`,
    sha: ref.object.sha,
  })
  cache.invalidate('branches')
  return branchName
}

export async function deleteBranch(branchName) {
  await octokit.git.deleteRef({
    owner: OWNER, repo: REPO,
    ref: `heads/${branchName}`,
  })
  cache.invalidate('branches')
}

// ─── Articles (files) ────────────────────────────────────────────────────────

export async function listArticles(branch = 'main') {
  const key = `articles:${branch}`
  const hit = cache.get(key)
  if (hit) return hit

  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER, repo: REPO,
      path: 'content',
      ref: branch,
    })
    const folders = data.filter(item => item.type === 'dir')
    const articles = await Promise.all(
      folders.map(async folder => {
        try {
          const meta = await getArticleMeta(folder.name, branch)
          return { slug: folder.name, ...meta }
        } catch {
          return { slug: folder.name, title: folder.name, description: '' }
        }
      })
    )
    cache.set(key, articles)
    return articles
  } catch {
    return []
  }
}

export async function getArticleContent(slug, branch = 'main') {
  const key = `content:${slug}:${branch}`
  const hit = cache.get(key)
  if (hit) return hit

  const { data } = await octokit.repos.getContent({
    owner: OWNER, repo: REPO,
    path: `content/${slug}/index.md`,
    ref: branch,
  })
  const content = atob(data.content.replace(/\n/g, ''))
  const result = { content, sha: data.sha }
  cache.set(key, result)
  return result
}

export async function getArticleMeta(slug, branch = 'main') {
  const { content } = await getArticleContent(slug, branch)
  return parseFrontmatter(content)
}

export async function saveArticle(slug, content, message, branch) {
  // Always fetch a fresh SHA before writing — never use a cached one
  let sha
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER, repo: REPO,
      path: `content/${slug}/index.md`,
      ref: branch,
    })
    sha = data.sha
  } catch {
    // File doesn't exist yet — new article
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER, repo: REPO,
    path: `content/${slug}/index.md`,
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch,
    ...(sha ? { sha } : {}),
  })

  // Invalidate everything related to this article and the article list
  cache.invalidate(`content:${slug}`)
  cache.invalidate(`articles:`)
  cache.invalidate(`history:${slug}`)
}

// ─── Pull Requests (Draft → Publish) ────────────────────────────────────────

export async function createPullRequest(branchName, title, body = '') {
  const { data } = await octokit.pulls.create({
    owner: OWNER, repo: REPO,
    title,
    body,
    head: branchName,
    base: 'main',
  })
  cache.invalidate('prs')
  return data
}

export async function listOpenPRs() {
  const key = 'prs'
  const hit = cache.get(key)
  if (hit) return hit

  const { data } = await octokit.pulls.list({
    owner: OWNER, repo: REPO,
    state: 'open',
    base: 'main',
  })
  cache.set(key, data)
  return data
}

export async function mergePullRequest(pullNumber, commitMessage) {
  await octokit.pulls.merge({
    owner: OWNER, repo: REPO,
    pull_number: pullNumber,
    commit_title: commitMessage,
    merge_method: 'squash',
  })
  // Merge affects articles on main, branches, and PRs — clear everything
  cache.clear()
}

// ─── Commits (changelog) ────────────────────────────────────────────────────

export async function getCommitHistory(slug, branch = 'main') {
  const key = `history:${slug}:${branch}`
  const hit = cache.get(key)
  if (hit) return hit

  const { data } = await octokit.repos.listCommits({
    owner: OWNER, repo: REPO,
    path: `content/${slug}/index.md`,
    sha: branch,
    per_page: 20,
  })
  const result = data.map(c => ({
    sha:     c.sha.slice(0, 7),
    message: c.commit.message,
    date:    c.commit.author.date,
    author:  c.commit.author.name,
  }))
  cache.set(key, result)
  return result
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { title: 'Untitled', description: '', tags: [], date: '' }
  const raw = match[1]
  const title       = (raw.match(/^title:\s*(.+)$/m)       || [])[1]?.trim() || 'Untitled'
  const description = (raw.match(/^description:\s*(.+)$/m) || [])[1]?.trim() || ''
  const tagsRaw     = (raw.match(/^tags:\s*(.+)$/m)        || [])[1]?.trim() || ''
  const tags        = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
  const date        = (raw.match(/^date:\s*(.+)$/m)        || [])[1]?.trim() || ''
  return { title, description, tags, date }
}

export function buildArticleTemplate(title, description = '', tags = '') {
  const today = new Date().toISOString().split('T')[0]
  return `---
title: ${title}
description: ${description}
date: ${today}
tags: ${tags}
---

# ${title}

Start writing here...
`
}
