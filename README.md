# @lxgicstudios/robots-gen

[![npm version](https://img.shields.io/npm/v/@lxgicstudios/robots-gen.svg)](https://www.npmjs.com/package/@lxgicstudios/robots-gen)
[![license](https://img.shields.io/npm/l/@lxgicstudios/robots-gen.svg)](https://github.com/lxgicstudios/robots-gen/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/@lxgicstudios/robots-gen.svg)](https://nodejs.org)

Generate robots.txt files with smart defaults. Block AI crawlers like GPTBot and ClaudeBot with a single flag. Get framework-specific rules for Next.js, Gatsby, Nuxt, and Astro. Lock down staging environments automatically.

**Zero dependencies.** Just Node.js built-ins.

## Install

```bash
npm install -g @lxgicstudios/robots-gen
```

Or run directly with npx:

```bash
npx @lxgicstudios/robots-gen --block-ai --sitemap https://example.com/sitemap.xml
```

## Usage

```bash
# Generate with smart defaults
robots-gen

# Block AI crawlers and add sitemap
robots-gen --block-ai --sitemap https://example.com/sitemap.xml

# Staging environment (blocks all crawlers)
robots-gen --env staging

# Next.js specific rules
robots-gen --framework next --sitemap https://example.com/sitemap.xml

# Block specific bots
robots-gen --block SemrushBot --block AhrefsBot

# Custom allow/disallow rules
robots-gen --allow "/" --disallow "/admin" --disallow "/private"

# Output to stdout as JSON
robots-gen --json --stdout
```

## Features

- Smart default rules for common paths (/admin, /private, /tmp)
- One-flag AI crawler blocking (18+ known AI bots)
- Framework presets for Next.js, Gatsby, Nuxt, and Astro
- Staging/development environment presets that block everything
- Sitemap reference support
- Custom bot blocking
- Crawl delay configuration
- JSON output for programmatic use
- Zero external dependencies

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--output <file>` | Output file path | `robots.txt` |
| `--sitemap <url>` | Add sitemap reference (repeatable) | |
| `--block-ai` | Block all known AI crawlers | `false` |
| `--block <bot>` | Block a specific bot (repeatable) | |
| `--allow <path>` | Add an Allow rule (repeatable) | |
| `--disallow <path>` | Add a Disallow rule (repeatable) | |
| `--env <env>` | Environment (production, staging, development) | `production` |
| `--framework <name>` | Framework rules (next, gatsby, nuxt, astro) | |
| `--crawl-delay <n>` | Crawl delay in seconds | |
| `--host <domain>` | Set preferred host | |
| `--json` | Output as JSON | `false` |
| `--stdout` | Print to stdout instead of writing a file | `false` |
| `--help` | Show help message | |

## AI Crawlers Blocked

When you use `--block-ai`, these bots get blocked:

GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, Anthropic-AI, Google-Extended, CCBot, PerplexityBot, Bytespider, Applebot-Extended, FacebookBot, Meta-ExternalAgent, Amazonbot, Cohere-AI, AI2Bot, Diffbot, Omgilibot, YouBot

## Framework Presets

| Framework | Disallowed Paths |
|-----------|-----------------|
| Next.js | `/_next/static/`, `/_next/image/`, `/api/`, `/_next/data/` |
| Gatsby | `/page-data/`, `/.cache/`, `/static/` |
| Nuxt | `/_nuxt/`, `/api/`, `/__nuxt_error` |
| Astro | `/_astro/`, `/api/` |

## License

MIT - [LXGIC Studios](https://lxgicstudios.com)
