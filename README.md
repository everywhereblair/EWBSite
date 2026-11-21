# EverywhereBlair

Source for [everywhereblair.com](https://everywhereblair.com): writing and projects about how I use LLMs to solve problems.

SvelteKit 2 + Svelte 5, Tailwind v4, fully prerendered, deployed on **Cloudflare Workers** (static assets) via Cloudflare's Git integration: every push to `main` deploys.

## How content gets here

```
Obsidian vault (drafts, private)  →  npm run upload -- "Title"  →  src/content/*.md  →  push main  →  Cloudflare
```

Articles are written in Obsidian. `scripts/publish.mjs` validates a finished note, strips anything private (comments, internal links, non-public frontmatter, confidential terms), builds the site, commits, pushes, and waits until the page is live. The script is deterministic; no LLM touches the article on the way out.

## For humans and agents

Every page has a plain-markdown twin (append `.md`), plus `/llms.txt`, `/llms-full.txt`, `/rss.xml`, `/sitemap.xml`, and JSON-LD on each page.

## Develop

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # fails on broken internal links
npm run check          # types
npm run test:publish   # publisher unit tests
```

Publishing needs `scripts/publish.local.json` (copy `publish.example.json`).
