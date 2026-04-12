import { Octokit } from '@octokit/rest'
import { getActiveRepoConfig } from '../components/RepoContext.jsx'

// ─── Dynamic repo config ──────────────────────────────────────────────────────
// Reads from localStorage (set by RepoContext) so switching repos in the UI
// is reflected here after the page reloads. Falls back to .env on first run.

function getOctokit() {
  const { token } = getActiveRepoConfig()
  return new Octokit({ auth: token })
}

function getOwner() { return getActiveRepoConfig().owner }
function getRepo()  { return getActiveRepoConfig().repo  }

// ─── Root path constants ──────────────────────────────────────────────────────
export const ROOTS = {
  ARTICLES:   'content',
  LIT_REVIEW: 'lit-review',
  CATALOGS:   'catalogs/nist-800-53-r5',
}

// ─── In-memory cache ──────────────────────────────────────────────────────────
const TTL = 60_000

const cache = {
  _store: new Map(),
  get(key) {
    const entry = this._store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) { this._store.delete(key); return null }
    return entry.value
  },
  set(key, value) {
    this._store.set(key, { value, expiresAt: Date.now() + TTL })
  },
  invalidate(prefix) {
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) this._store.delete(key)
    }
  },
  clear() { this._store.clear() },
}

// ─── Branches ─────────────────────────────────────────────────────────────────

export async function listBranches() {
  const key = 'branches'
  const hit = cache.get(key)
  if (hit) return hit
  const { data } = await getOctokit().repos.listBranches({ owner: getOwner(), repo: getRepo() })
  const result = data.map(b => b.name)
  cache.set(key, result)
  return result
}

export async function createBranch(branchName, fromBranch = 'main') {
  const { data: ref } = await getOctokit().git.getRef({
    owner: getOwner(), repo: getRepo(), ref: `heads/${fromBranch}`,
  })
  await getOctokit().git.createRef({
    owner: getOwner(), repo: getRepo(),
    ref: `refs/heads/${branchName}`,
    sha: ref.object.sha,
  })
  cache.invalidate('branches')
  return branchName
}

export async function deleteBranch(branchName) {
  await getOctokit().git.deleteRef({
    owner: getOwner(), repo: getRepo(), ref: `heads/${branchName}`,
  })
  cache.invalidate('branches')
}

// ─── Articles ─────────────────────────────────────────────────────────────────

function filePath(rootPath, slug) {
  if (rootPath === ROOTS.CATALOGS) return `${rootPath}/${slug}.md`
  return `${rootPath}/${slug}/index.md`
}

export async function listArticles(branch = 'main', rootPath = ROOTS.ARTICLES) {
  const key = `articles:${rootPath}:${branch}`
  const hit = cache.get(key)
  if (hit) return hit
  try {
    const { data } = await getOctokit().repos.getContent({
      owner: getOwner(), repo: getRepo(), path: rootPath, ref: branch,
    })
    if (rootPath === ROOTS.CATALOGS) {
      const files = data.filter(item => item.type === 'file' && item.name.endsWith('.md'))
      const articles = files.map(f => ({
        slug: f.name.replace('.md', ''),
        title: f.name.replace('.md', ''),
        description: 'NIST SP 800-53 Control Family',
        tags: ['nist', 'catalog'], date: '',
      }))
      cache.set(key, articles)
      return articles
    }
    const folders = data.filter(item => item.type === 'dir')
    const articles = await Promise.all(
      folders.map(async folder => {
        try {
          const meta = await getArticleMeta(folder.name, branch, rootPath)
          return { slug: folder.name, ...meta }
        } catch {
          return { slug: folder.name, title: folder.name, description: '' }
        }
      })
    )
    cache.set(key, articles)
    return articles
  } catch { return [] }
}

export async function getArticleContent(slug, branch = 'main', rootPath = ROOTS.ARTICLES) {
  const key = `content:${rootPath}:${slug}:${branch}`
  const hit = cache.get(key)
  if (hit) return hit
  const { data } = await getOctokit().repos.getContent({
    owner: getOwner(), repo: getRepo(), path: filePath(rootPath, slug), ref: branch,
  })
  const content = atob(data.content.replace(/\n/g, ''))
  const result = { content, sha: data.sha }
  cache.set(key, result)
  return result
}

export async function getArticleMeta(slug, branch = 'main', rootPath = ROOTS.ARTICLES) {
  const { content } = await getArticleContent(slug, branch, rootPath)
  return parseFrontmatter(content)
}

export async function saveArticle(slug, content, message, branch, rootPath = ROOTS.ARTICLES) {
  const path = filePath(rootPath, slug)
  let sha
  try {
    const { data } = await getOctokit().repos.getContent({
      owner: getOwner(), repo: getRepo(), path, ref: branch,
    })
    sha = data.sha
  } catch { /* new file */ }
  await getOctokit().repos.createOrUpdateFileContents({
    owner: getOwner(), repo: getRepo(), path, message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch, ...(sha ? { sha } : {}),
  })
  cache.invalidate(`content:${rootPath}:${slug}`)
  cache.invalidate(`articles:${rootPath}:`)
  cache.invalidate(`history:${rootPath}:${slug}`)
}

// ─── Pull Requests ────────────────────────────────────────────────────────────

export async function createPullRequest(branchName, title, body = '') {
  const { data } = await getOctokit().pulls.create({
    owner: getOwner(), repo: getRepo(), title, body, head: branchName, base: 'main',
  })
  cache.invalidate('prs')
  return data
}

export async function listOpenPRs() {
  const key = 'prs'
  const hit = cache.get(key)
  if (hit) return hit
  const { data } = await getOctokit().pulls.list({
    owner: getOwner(), repo: getRepo(), state: 'open', base: 'main',
  })
  cache.set(key, data)
  return data
}

export async function mergePullRequest(pullNumber, commitMessage) {
  await getOctokit().pulls.merge({
    owner: getOwner(), repo: getRepo(),
    pull_number: pullNumber,
    commit_title: commitMessage,
    merge_method: 'squash',
  })
  cache.clear()
}

// ─── Commits ──────────────────────────────────────────────────────────────────

export async function getCommitHistory(slug, branch = 'main', rootPath = ROOTS.ARTICLES) {
  const key = `history:${rootPath}:${slug}:${branch}`
  const hit = cache.get(key)
  if (hit) return hit
  const { data } = await getOctokit().repos.listCommits({
    owner: getOwner(), repo: getRepo(),
    path: filePath(rootPath, slug), sha: branch, per_page: 20,
  })
  const result = data.map(c => ({
    sha: c.sha.slice(0, 7), message: c.commit.message,
    date: c.commit.author.date, author: c.commit.author.name,
  }))
  cache.set(key, result)
  return result
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

export function buildDissertationTemplate(title, description = '', tags = '') {
  const today = new Date().toISOString().split('T')[0]
  return `---
title: ${title}
description: ${description}
date: ${today}
tags: ${tags}
status: draft
---

# ${title}

## Summary

## Key Arguments

## Relation to NIST 800-53 Gap

## Citations

`
}
