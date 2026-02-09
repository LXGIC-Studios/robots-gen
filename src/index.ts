#!/usr/bin/env node

import * as fs from "fs";

// ── ANSI Colors ──
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const HELP = `
${c.bold}${c.cyan}robots-gen${c.reset} - Generate robots.txt with smart defaults

${c.bold}USAGE${c.reset}
  ${c.green}robots-gen${c.reset} [options]

${c.bold}OPTIONS${c.reset}
  ${c.yellow}--output <file>${c.reset}        Output file path (default: robots.txt)
  ${c.yellow}--sitemap <url>${c.reset}        Add sitemap reference (repeatable)
  ${c.yellow}--block-ai${c.reset}             Block known AI crawlers (GPTBot, ClaudeBot, etc.)
  ${c.yellow}--block <bot>${c.reset}           Block a specific bot (repeatable)
  ${c.yellow}--allow <path>${c.reset}          Add an Allow rule (repeatable)
  ${c.yellow}--disallow <path>${c.reset}       Add a Disallow rule (repeatable)
  ${c.yellow}--env <environment>${c.reset}     Environment preset (production, staging, development)
  ${c.yellow}--framework <name>${c.reset}      Framework-specific rules (next, gatsby, nuxt, astro)
  ${c.yellow}--crawl-delay <n>${c.reset}       Set crawl delay in seconds
  ${c.yellow}--host <domain>${c.reset}         Set preferred host
  ${c.yellow}--json${c.reset}                 Output as JSON
  ${c.yellow}--stdout${c.reset}               Print to stdout (don't write file)
  ${c.yellow}--help${c.reset}                 Show this help message

${c.bold}EXAMPLES${c.reset}
  ${c.dim}# Generate with smart defaults${c.reset}
  robots-gen

  ${c.dim}# Block AI crawlers and add sitemap${c.reset}
  robots-gen --block-ai --sitemap https://example.com/sitemap.xml

  ${c.dim}# Staging environment (blocks everything)${c.reset}
  robots-gen --env staging

  ${c.dim}# Next.js specific rules${c.reset}
  robots-gen --framework next --sitemap https://example.com/sitemap.xml

  ${c.dim}# Output to stdout as JSON${c.reset}
  robots-gen --json --stdout

${c.bold}AI CRAWLERS BLOCKED (--block-ai)${c.reset}
  GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, Anthropic-AI,
  Google-Extended, CCBot, PerplexityBot, Bytespider, Applebot-Extended,
  FacebookBot, Meta-ExternalAgent, Amazonbot, Cohere-AI,
  AI2Bot, Diffbot, Omgilibot, YouBot
`;

// Known AI crawler bots
const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "Anthropic-AI",
  "Google-Extended",
  "CCBot",
  "PerplexityBot",
  "Bytespider",
  "Applebot-Extended",
  "FacebookBot",
  "Meta-ExternalAgent",
  "Amazonbot",
  "Cohere-AI",
  "AI2Bot",
  "Diffbot",
  "Omgilibot",
  "YouBot",
];

interface RobotsRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
}

interface RobotsConfig {
  rules: RobotsRule[];
  sitemaps: string[];
  host?: string;
  comments: string[];
}

interface ParsedArgs {
  output: string;
  sitemaps: string[];
  blockAi: boolean;
  blockedBots: string[];
  allow: string[];
  disallow: string[];
  env: string;
  framework: string;
  crawlDelay: number;
  host: string;
  json: boolean;
  stdout: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const result: ParsedArgs = {
    output: "robots.txt",
    sitemaps: [],
    blockAi: false,
    blockedBots: [],
    allow: [],
    disallow: [],
    env: "production",
    framework: "",
    crawlDelay: 0,
    host: "",
    json: false,
    stdout: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") result.help = true;
    else if (arg === "--json") result.json = true;
    else if (arg === "--stdout") result.stdout = true;
    else if (arg === "--block-ai") result.blockAi = true;
    else if (arg === "--output" && args[i + 1]) result.output = args[++i];
    else if (arg === "--sitemap" && args[i + 1]) result.sitemaps.push(args[++i]);
    else if (arg === "--block" && args[i + 1]) result.blockedBots.push(args[++i]);
    else if (arg === "--allow" && args[i + 1]) result.allow.push(args[++i]);
    else if (arg === "--disallow" && args[i + 1]) result.disallow.push(args[++i]);
    else if (arg === "--env" && args[i + 1]) result.env = args[++i];
    else if (arg === "--framework" && args[i + 1]) result.framework = args[++i].toLowerCase();
    else if (arg === "--crawl-delay" && args[i + 1]) result.crawlDelay = parseInt(args[++i], 10);
    else if (arg === "--host" && args[i + 1]) result.host = args[++i];
  }
  return result;
}

function getFrameworkRules(framework: string): { allow: string[]; disallow: string[] } {
  switch (framework) {
    case "next":
    case "nextjs":
      return {
        allow: ["/"],
        disallow: ["/_next/static/", "/_next/image/", "/api/", "/_next/data/"],
      };
    case "gatsby":
      return {
        allow: ["/"],
        disallow: ["/page-data/", "/.cache/", "/static/"],
      };
    case "nuxt":
      return {
        allow: ["/"],
        disallow: ["/_nuxt/", "/api/", "/__nuxt_error"],
      };
    case "astro":
      return {
        allow: ["/"],
        disallow: ["/_astro/", "/api/"],
      };
    default:
      return { allow: [], disallow: [] };
  }
}

function buildConfig(args: ParsedArgs): RobotsConfig {
  const config: RobotsConfig = {
    rules: [],
    sitemaps: args.sitemaps,
    comments: [],
  };

  if (args.host) {
    config.host = args.host;
  }

  // ── Staging/Development: block everything ──
  if (args.env === "staging" || args.env === "development") {
    config.comments.push(
      `# robots.txt for ${args.env} environment`,
      "# Blocking all crawlers to prevent indexing"
    );
    config.rules.push({
      userAgent: "*",
      allow: [],
      disallow: ["/"],
    });
    return config;
  }

  config.comments.push("# robots.txt generated by @lxgicstudios/robots-gen");
  config.comments.push(`# Generated: ${new Date().toISOString().split("T")[0]}`);

  // ── AI bot blocking ──
  if (args.blockAi) {
    config.comments.push("", "# Block AI crawlers");
    for (const bot of AI_BOTS) {
      config.rules.push({
        userAgent: bot,
        allow: [],
        disallow: ["/"],
      });
    }
  }

  // ── Custom blocked bots ──
  for (const bot of args.blockedBots) {
    config.rules.push({
      userAgent: bot,
      allow: [],
      disallow: ["/"],
    });
  }

  // ── Main rules ──
  const frameworkRules = args.framework ? getFrameworkRules(args.framework) : { allow: [], disallow: [] };

  const mainAllow = [...frameworkRules.allow, ...args.allow];
  const mainDisallow = [...frameworkRules.disallow, ...args.disallow];

  // Add smart defaults for common paths
  const defaultDisallow = [
    "/admin/",
    "/private/",
    "/tmp/",
    "/*.json$",
    "/search?",
  ];

  // Only add defaults that aren't already covered
  for (const path of defaultDisallow) {
    if (!mainDisallow.includes(path)) {
      mainDisallow.push(path);
    }
  }

  const mainRule: RobotsRule = {
    userAgent: "*",
    allow: mainAllow.length > 0 ? mainAllow : ["/"],
    disallow: mainDisallow,
  };

  if (args.crawlDelay > 0) {
    mainRule.crawlDelay = args.crawlDelay;
  }

  config.rules.push(mainRule);

  return config;
}

function renderRobotsTxt(config: RobotsConfig): string {
  const lines: string[] = [];

  // Comments
  for (const comment of config.comments) {
    lines.push(comment);
  }
  if (config.comments.length > 0) lines.push("");

  // Rules
  for (const rule of config.rules) {
    lines.push(`User-agent: ${rule.userAgent}`);
    for (const path of rule.disallow) {
      lines.push(`Disallow: ${path}`);
    }
    for (const path of rule.allow) {
      lines.push(`Allow: ${path}`);
    }
    if (rule.crawlDelay !== undefined) {
      lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    }
    lines.push("");
  }

  // Host
  if (config.host) {
    lines.push(`Host: ${config.host}`);
    lines.push("");
  }

  // Sitemaps
  for (const sitemap of config.sitemaps) {
    lines.push(`Sitemap: ${sitemap}`);
  }

  return lines.join("\n").trim() + "\n";
}

function run(): void {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(HELP);
    process.exit(0);
  }

  console.log(`\n${c.bold}${c.cyan}robots-gen${c.reset} ${c.dim}v1.0.0${c.reset}\n`);

  const config = buildConfig(args);

  if (args.json) {
    const output = JSON.stringify(config, null, 2);
    if (args.stdout) {
      console.log(output);
    } else {
      const jsonFile = args.output.replace(/\.txt$/, ".json");
      fs.writeFileSync(jsonFile, output);
      console.log(`${c.green}Saved JSON to ${jsonFile}${c.reset}`);
    }
    return;
  }

  const output = renderRobotsTxt(config);

  if (args.stdout) {
    console.log(output);
    return;
  }

  fs.writeFileSync(args.output, output);
  console.log(`${c.green}Generated ${args.output}${c.reset}\n`);

  // Summary
  const ruleCount = config.rules.length;
  const blockedBots = config.rules.filter((r) => r.disallow.includes("/") && r.userAgent !== "*").length;
  const disallowCount = config.rules.reduce((sum, r) => sum + r.disallow.length, 0);

  console.log(`${c.bold}Summary:${c.reset}`);
  console.log(`  ${c.cyan}Rules:${c.reset} ${ruleCount}`);
  console.log(`  ${c.cyan}Blocked bots:${c.reset} ${blockedBots}`);
  console.log(`  ${c.cyan}Disallow paths:${c.reset} ${disallowCount}`);
  console.log(`  ${c.cyan}Sitemaps:${c.reset} ${config.sitemaps.length}`);
  if (args.framework) {
    console.log(`  ${c.cyan}Framework:${c.reset} ${args.framework}`);
  }
  if (args.env !== "production") {
    console.log(`  ${c.yellow}Environment:${c.reset} ${args.env} (all crawling blocked)`);
  }
  if (args.blockAi) {
    console.log(`  ${c.magenta}AI crawlers blocked:${c.reset} ${AI_BOTS.length} bots`);
  }

  console.log("");
  console.log(`${c.dim}Preview:${c.reset}`);
  const previewLines = output.split("\n").slice(0, 15);
  for (const line of previewLines) {
    if (line.startsWith("#")) {
      console.log(`  ${c.dim}${line}${c.reset}`);
    } else if (line.startsWith("User-agent:")) {
      console.log(`  ${c.cyan}${line}${c.reset}`);
    } else if (line.startsWith("Disallow:")) {
      console.log(`  ${c.red}${line}${c.reset}`);
    } else if (line.startsWith("Allow:")) {
      console.log(`  ${c.green}${line}${c.reset}`);
    } else if (line.startsWith("Sitemap:")) {
      console.log(`  ${c.magenta}${line}${c.reset}`);
    } else {
      console.log(`  ${line}`);
    }
  }
  if (output.split("\n").length > 15) {
    console.log(`  ${c.dim}... (${output.split("\n").length - 15} more lines)${c.reset}`);
  }
}

run();
